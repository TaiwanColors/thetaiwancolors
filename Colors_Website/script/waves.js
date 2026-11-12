/*
 * waves.js — 海浪（兩層緩慢起伏的海面）
 *
 * 每一層海面是幾個「長短不同的正弦波」疊在一起，各自用不同速度往左右漂：
 *
 *   y(x, t) = 基準線 + Σ 振幅ₖ · sin( 2π · x / 波長ₖ + 角速度ₖ · t + 相位ₖ )
 *
 *   - 波長用「畫面寬度的幾倍」表示，所以手機、電腦看到的起伏比例差不多
 *   - 幾個波的波長、速度彼此不成整數倍，疊起來就不會看出規律的重複
 *
 * 畫法：沿著 x 每隔 STEP px 取一個點，用二次曲線穿過相鄰兩點的中點連起來（平滑、沒有折角）。
 * 海面很慢（每秒只移動幾 px），所以每秒只重畫 FPS 次就很順，比每幀都畫省很多。
 *
 * window.seaSurfaceAt(x, layer)：給雨、雪、星空查「這個 x 的海面在哪個 y」，
 * 直接用上面同一條公式算，跟畫出來的海面一致。
 */
(function () {
    "use strict";

    const FPS = 20;      // 海浪每秒更新次數
    const STEP = 24;     // 取點間隔 (px)

    // 兩層海面：前面那層（layer 0）比較高，後面那層（layer 1）低一點
    //   offset：離基準線往下幾 px
    //   parts：疊在一起的波 [振幅 px, 波長（× 畫面寬）, 角速度 rad/s]
    const LAYERS = [
        { id: "feel-the-wave",     offset: 5,  color: "rgba(0, 0, 0, .05)",
          parts: [[4.2, 1.15, 0.32], [1.8, 0.47, -0.55], [0.8, 0.21, 0.9]] },
        { id: "feel-the-wave-two", offset: 15, color: "rgba(0, 0, 0, .05)",
          parts: [[4.0, 0.83, -0.41], [2.0, 0.36, 0.63], [0.7, 0.17, -1.05]] },
    ];

    const layers = LAYERS.map(function (L) {
        const el = document.getElementById(L.id);
        if (el) el.setAttribute("fill", L.color);
        // 每個波一個隨機起始相位，每次打開網頁的海面形狀都不太一樣
        return Object.assign({ el: el, phase: L.parts.map(() => Math.random() * Math.PI * 2) }, L);
    }).filter((L) => L.el);
    if (layers.length === 0) return;

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

    const t0 = performance.now();
    let tNow = 0; // 目前畫出來的時間（秒）；seaSurfaceAt 用同一個時間，才會跟畫面一致

    // 某一層在 x 的海面高度
    function surface(L, x, t) {
        let y = height * 0.69 + L.offset;
        const w = width || 1;
        for (let k = 0; k < L.parts.length; k++) {
            const p = L.parts[k];
            y += p[0] * Math.sin((2 * Math.PI * x) / (p[1] * w) + p[2] * t + L.phase[k]);
        }
        return y;
    }

    // layer：指定第幾層（0 = 前面、1 = 後面）；不指定就取看得到的海面（比較高的那層）
    window.seaSurfaceAt = function (x, layer) {
        if (layer !== undefined && layers[layer]) return surface(layers[layer], x, tNow);
        let y = Infinity;
        for (let i = 0; i < layers.length; i++) y = Math.min(y, surface(layers[i], x, tNow));
        return y;
    };

    const r1 = (n) => Math.round(n * 10) / 10;
    function path(L, t) {
        const n = Math.max(2, Math.ceil(width / STEP));
        const xs = [], ys = [];
        for (let i = 0; i <= n; i++) { const x = (i / n) * width; xs.push(x); ys.push(surface(L, x, t)); }
        // 二次曲線穿過中點：以每個取樣點當控制點，曲線經過相鄰兩點的中點
        let d = "M 0 " + r1(ys[0]) + " L " + r1((xs[0] + xs[1]) / 2) + " " + r1((ys[0] + ys[1]) / 2);
        for (let i = 1; i < n; i++) {
            d += " Q " + r1(xs[i]) + " " + r1(ys[i]) + " " + r1((xs[i] + xs[i + 1]) / 2) + " " + r1((ys[i] + ys[i + 1]) / 2);
        }
        return d + " L " + r1(width) + " " + r1(ys[n]) + " L " + r1(width) + " " + r1(height) + " L 0 " + r1(height) + " Z";
    }

    function draw(now) {
        tNow = (now - t0) / 1000;
        for (let i = 0; i < layers.length; i++) layers[i].el.setAttribute("d", path(layers[i], tNow));
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
