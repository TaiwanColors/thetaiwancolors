/*
 * waves.js — 海浪
 *
 * 取代原本的 wavify.js + jquery.wavify.js + TweenMax + jQuery（四個檔案、兩個 CDN）。
 * 波形公式與曲線畫法移植自 Wavify（peacepostman @ crezeo, MIT License），
 * 外觀與原本相同：
 *
 *   關節 i 的 x = i / bones × 寬
 *   關節 i 的 y = 基準線 + (振幅 / 2) · sin²( speed · (πt + i + i mod bones) )
 *
 * 為什麼比較省：
 *   原版每一幀都「新建一個 TweenMax 補間」去追下一個波形，補間每幀要解析、
 *   內插整條 path 字串，等於每秒重開 60 個動畫。
 *   但這個波其實很慢：y 對時間的導數最大只有 (振幅/2)·speed·π ≈ 每秒 5px，
 *   一幀移動不到 0.1px，畫得再勤也看不出來。
 *   所以這裡直接用公式算，每秒只更新 FPS 次（每次移動 < 0.3px，肉眼無差），
 *   不需要任何外部函式庫，重排與重繪次數也降為原本的 1/3。
 */
(function () {
    "use strict";

    const FPS = 20; // 海浪每秒更新次數

    const WAVES = [
        { id: "feel-the-wave",     height: 0,  bones: 2, amplitude: 20, speed: 0.15, color: "rgba(0, 0, 0, .05)" },
        { id: "feel-the-wave-two", height: 10, bones: 3, amplitude: 20, speed: 0.25, color: "rgba(0, 0, 0, .05)" },
    ];

    const waves = WAVES.map(function (w) {
        const el = document.getElementById(w.id);
        if (el) el.setAttribute("fill", w.color);
        return Object.assign({ el: el, xs: [], ys: [], cps: [] }, w);
    }).filter((w) => w.el);
    if (waves.length === 0) return;

    // 容器（body）尺寸只在載入與 resize 時量
    let width = 0, height = 0;
    function measure() {
        const r = document.body.getBoundingClientRect();
        width = r.width;
        height = r.height;
    }
    measure();
    let resizeTimer = 0;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { measure(); draw(performance.now()); }, 150);
    });

    // 關節位置（同 Wavify 的 drawPoints）
    function points(w, factor) {
        const base = height * 0.69 + w.height;
        for (let i = 0; i <= w.bones; i++) {
            const s = Math.sin((factor + i + (i % w.bones)) * w.speed);
            w.xs[i] = (i / w.bones) * width;
            w.ys[i] = (w.amplitude * s * s) / 2 + base;
        }
    }

    // 曲線（同 Wavify 的 drawPath）：第一段的控制點固定，
    // 之後每段控制點都是上一段控制點對關節的鏡射 → 段與段之間平滑相接
    const f = (n) => Math.round(n * 10) / 10;
    function path(w) {
        const xs = w.xs, ys = w.ys;
        let cpx = (xs[1] - xs[0]) / 2;
        let cpy = 2 * ys[1] - ys[0];
        w.cps[0] = [cpx, cpy];
        let d = "M " + f(xs[0]) + " " + f(ys[0]) +
            " C " + f(cpx) + " " + f(cpy) + " " + f(cpx) + " " + f(cpy) + " " + f(xs[1]) + " " + f(ys[1]);
        for (let i = 1; i < xs.length - 1; i++) {
            cpx = 2 * xs[i] - cpx;
            cpy = 2 * ys[i] - cpy;
            w.cps[i] = [cpx, cpy];
            d += " C " + f(cpx) + " " + f(cpy) + " " + f(cpx) + " " + f(cpy) + " " + f(xs[i + 1]) + " " + f(ys[i + 1]);
        }
        return d + " L " + f(width) + " " + f(height) + " L 0 " + f(height) + " Z";
    }

    // ===== 海面高度：給雨、雪判斷「碰到海面」用 =====
    // 用跟畫浪一模一樣的三次貝茲曲線算：先用二分法找出 x 對應的 t，再算 y。
    // 兩層浪取比較高（y 比較小）的那一層，就是看得到的海面。
    function curveY(w, x) {
        const xs = w.xs, ys = w.ys, n = xs.length - 1;
        if (n < 1 || !w.cps.length) return Infinity;
        let i = Math.min(n - 1, Math.max(0, Math.floor((x / width) * n)));
        const x0 = xs[i], x1 = xs[i + 1], cx = w.cps[i][0], cy = w.cps[i][1];
        const bx = (t) => { const u = 1 - t; return u * u * u * x0 + 3 * u * t * cx + t * t * t * x1; };
        let lo = 0, hi = 1;
        for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; }
        const t = (lo + hi) / 2, u = 1 - t;
        return u * u * u * ys[i] + 3 * u * t * cy + t * t * t * ys[i + 1];
    }
    // layer：指定第幾層浪（0 = 前面那層、1 = 後面那層）；不指定就取看得到的海面（較高的那層）
    window.seaSurfaceAt = function (x, layer) {
        if (layer !== undefined && waves[layer]) return curveY(waves[layer], x);
        let y = Infinity;
        for (let i = 0; i < waves.length; i++) y = Math.min(y, curveY(waves[i], x));
        return y;
    };

    const t0 = performance.now();
    function draw(now) {
        const factor = ((now - t0) / 1000) * Math.PI;
        for (let i = 0; i < waves.length; i++) {
            const w = waves[i];
            points(w, factor);
            w.el.setAttribute("d", path(w));
        }
    }

    // requestAnimationFrame 在分頁隱藏時會自動暫停；只是大部分幀直接略過
    let last = -Infinity;
    const interval = 1000 / FPS;
    function frame(now) {
        if (now - last >= interval - 1) {
            last = now;
            draw(now);
        }
        requestAnimationFrame(frame);
    }
    draw(t0);
    requestAnimationFrame(frame);
})();
