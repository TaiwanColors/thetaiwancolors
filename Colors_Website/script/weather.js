/*
 * weather.js — 雨、雪（畫面上的效果 + 按鈕小圖示）
 *
 * 取代原本的 rainingscrip.js、rainingbutton.js、startrainingbutton.js、
 *           snowingscrip.js、snowingbutton.js、startsnowingbutton.js。
 *
 * 原本的問題：
 *   - 每一滴雨、每一片雪都是一個 <div>，各自跑一個動畫迴圈，每幀還讀容器高度（逼瀏覽器重排）
 *   - 按鈕關掉後，按鈕裡暫停的雨滴／雪花迴圈不會結束，一直空轉；每按一次還會再多疊一組迴圈
 *   - 速度是「每幀幾 px」，120Hz 螢幕上會快一倍
 *
 * 現在：
 *   - 雨、雪各畫在一張 <canvas> 上，粒子只是陣列裡的資料，共用「一個」動畫迴圈
 *   - 速度用「每秒幾 px」，任何更新率都一樣
 *   - 雨、雪都關掉、最後一滴落完之後，迴圈完全停止
 *   - 碰到海面（waves.js 的海面曲線）：雨濺起小水滴＋漣漪；雪慢慢下沉、縮小、融化
 *   - 外觀沿用原本：雨是細線（顏色規則相同），雪用原本的 snowflake_*.png
 *   - 按鈕小圖示：關著時是靜止的一張（40% 不透明），打開時才動
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const rand = (a, b) => a + Math.random() * (b - a);

    // ===== 可調參數（數值換算自原本的設定，原本是以 60fps 的「每幀」計） =====
    const RAIN = {
        spawnEvery: 0.08,          // 每幾秒落下一滴（原本 80ms）
        speed: [540, 1140],        // 下落速度 (px/s)（原本每幀 9~19px）
        length: [2, 22],           // 雨絲長度 (px)
        iconCount: 20,             // 按鈕裡的雨滴數
        iconSpeed: [60, 120],      // 按鈕裡的下落速度 (px/s)
        iconLength: [1, 7],
    };
    // 碰到海面的效果
    const SEA = {
        splashSpeed: [70, 140],    // 濺起水滴的初速 (px/s)
        gravity: 700,              // 水滴的重力 (px/s²)
        rippleSize: 9,             // 漣漪最大半徑 (px)
        rippleLife: 0.45,          // 漣漪持續秒數
        meltTime: 1.2,             // 雪花碰到海面後融化的秒數
    };
    const SNOW = {
        spawnEvery: 0.2,           // 每幾秒落下一片（原本 200ms）
        speed: [60, 120],          // 下落速度 (px/s)（原本每幀 1~2px）
        size: 8,                   // 雪花大小 (px)
        sway: [4, 5],              // 左右飄的幅度 (px)
        swayPeriod: 30,            // 每落下幾 px 左右擺一次（原本 sin(top/30)）
        iconCount: 15,
        iconSpeed: [6, 24],        // 按鈕裡的下落速度 (px/s)
        iconSize: 5,
    };

    // ===== 雪花圖片（原本的素材） =====
    const loadImages = (prefix, n) => Array.from({ length: n }, function (_, i) {
        const im = new Image();
        im.src = "image/" + prefix + (i + 1) + ".png";
        return im;
    });
    const snowImgs = loadImages("snowflake_", 10);
    const snowIconImgs = loadImages("snowflakeB_", 5);

    // ===== 畫布 =====
    function makeCanvas(parent, className) {
        const cv = document.createElement("canvas");
        cv.className = className;
        parent.appendChild(cv);
        return { cv: cv, ctx: cv.getContext("2d"), w: 0, h: 0 };
    }
    function sizeCanvas(L, w, h) {
        L.w = w; L.h = h;
        L.cv.width = Math.max(1, Math.round(w * DPR));
        L.cv.height = Math.max(1, Math.round(h * DPR));
        L.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const rainBtn = document.getElementById("rainButton");
    const snowBtn = document.getElementById("snowButton");
    const rainBox = document.getElementById("rainingcontainer");
    const snowBox = document.getElementById("snowingcontainer");
    if (!rainBtn || !snowBtn || !rainBox || !snowBox) return;

    const rain = {
        on: false, acc: 0, parts: [],
        layer: makeCanvas(rainBox, "weather-canvas"),
        icon: makeCanvas(rainBtn, "weather-icon"),
        iconParts: [], color: "rgba(255, 255, 255, 0.2)", rgb: "255,255,255",
        drops: [],    // 濺起的小水滴
        ripples: [],  // 海面上的漣漪
    };
    const snow = {
        on: false, acc: 0, parts: [],
        layer: makeCanvas(snowBox, "weather-canvas"),
        icon: makeCanvas(snowBtn, "weather-icon"),
        iconParts: [],
        ripples: [],
    };

    // 畫布在頁面上的位置（換算海面高度用）
    const rainOff = { x: 0, y: 0 }, snowOff = { x: 0, y: 0 };
    function measure() {
        const rr = rainBox.getBoundingClientRect(), sr = snowBox.getBoundingClientRect();
        rainOff.x = rr.left; rainOff.y = rr.top;
        snowOff.x = sr.left; snowOff.y = sr.top;
        sizeCanvas(rain.layer, rainBox.clientWidth, rainBox.clientHeight);
        sizeCanvas(snow.layer, snowBox.clientWidth, snowBox.clientHeight);
        sizeCanvas(rain.icon, rainBtn.clientWidth || 45, rainBtn.clientHeight || 15);
        sizeCanvas(snow.icon, snowBtn.clientWidth || 45, snowBtn.clientHeight || 15);
    }
    measure();

    // ===== 雨的顏色：跟著目前的背景色（同原本規則：亮的背景用黑雨、暗的用白雨） =====
    function updateRainColor() {
        const btn = document.querySelector(".circle-button.active");
        if (!btn) return;
        const m = getComputedStyle(btn).backgroundColor.match(/\d+/g);
        if (!m) return;
        const brightness = (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000;
        rain.rgb = brightness > 100 ? "0,0,0" : "255,255,255";
        rain.color = "rgba(" + rain.rgb + ", 0.2)";
    }
    // 換顏色（釣到色球時會觸發色球的 click）就重算一次，不必每滴雨都算
    document.addEventListener("click", function (e) {
        if (e.target && e.target.classList && e.target.classList.contains("circle-button")) updateRainColor();
    });

    // ===== 粒子 =====
    function newRainDrop(w, top) {
        return { x: Math.floor(rand(0, w)), y: top, v: rand(RAIN.speed[0], RAIN.speed[1]), len: rand(RAIN.length[0], RAIN.length[1]),
            layer: Math.random() < 0.5 ? 0 : 1 }; // 落在第幾層海面
    }
    function newFlake(w, top, imgs, speed, sway) {
        return { x: rand(0, w), y: top, v: rand(speed[0], speed[1]), sway: rand(sway[0], sway[1]),
            img: imgs[Math.floor(Math.random() * imgs.length)],
            layer: Math.random() < 0.5 ? 0 : 1 }; // 落在第幾層海面
    }

    // 按鈕裡的初始雨滴／雪花（同原本：散在框裡）
    for (let i = 0; i < RAIN.iconCount; i++) {
        rain.iconParts.push({ x: Math.floor(rand(0, rain.icon.w)), y: rand(0, 10),
            v: rand(RAIN.iconSpeed[0], RAIN.iconSpeed[1]), len: rand(RAIN.iconLength[0], RAIN.iconLength[1]) });
    }
    for (let i = 0; i < SNOW.iconCount; i++) {
        const f = newFlake(snow.icon.w, rand(0, 10), snowIconImgs, SNOW.iconSpeed, [4, 5]);
        snow.iconParts.push(f);
    }

    // ===== 繪製 =====
    function drawRain(L, parts, color, w) {
        const ctx = L.ctx;
        ctx.clearRect(0, 0, L.w, L.h);
        ctx.fillStyle = color;
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            ctx.fillRect(p.x, p.y, w, p.len);
        }
    }
    function drawSnow(L, parts, size) {
        const ctx = L.ctx;
        ctx.clearRect(0, 0, L.w, L.h);
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (!p.img.complete || !p.img.naturalWidth) continue;
            if (p.melt === undefined) {
                const dx = p.sway * Math.sin(p.y / SNOW.swayPeriod);
                ctx.drawImage(p.img, p.x + dx, p.y, size, size);
            } else {
                // 融化：慢慢沉進水裡、縮小、淡出；海面以下的部分不畫（看起來沉進水裡）
                const k = p.melt / SEA.meltTime;
                const sz = size * (1 - 0.45 * k);
                ctx.save();
                ctx.beginPath();
                ctx.rect(p.mx - 2, 0, size + 4, p.sy);
                ctx.clip();
                ctx.globalAlpha = (1 - k) * (1 - k);
                ctx.drawImage(p.img, p.mx + (size - sz) / 2, p.y + (size - sz), sz, sz);
                ctx.restore();
            }
        }
    }
    function drawIcons() {
        drawRain(rain.icon, rain.iconParts, "#fff", 1);
        drawSnow(snow.icon, snow.iconParts, SNOW.iconSize);
    }

    // ===== 更新 =====
    // 按鈕裡的粒子落出底部就回到頂端，數量固定
    function stepIcon(parts, dt, h, w) {
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            p.y += p.v * dt;
            if (p.y >= h) { p.y = -rand(2, 8); p.x = rand(0, w); }
        }
    }

    // ===== 碰到海面 =====
    // 海面高度由 waves.js 提供（跟畫浪同一條曲線）；海有兩層浪，每顆粒子隨機落在其中一層
    // 拿不到就用畫布底部
    function seaY(off, x, h, layer) {
        const y = window.seaSurfaceAt ? window.seaSurfaceAt(x + off.x, layer) - off.y : h;
        return Math.min(h, y);
    }

    // 雨：雨絲底端碰到海面 → 濺起 2~3 顆小水滴 + 一圈漣漪
    function stepRain(dt) {
        const L = rain.layer, parts = rain.parts;
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            const sy = seaY(rainOff, p.x, L.h, p.layer);
            if (p.hit) {
                // 上一幀已經貼在海面上（畫面上看得到雨真的碰到水）→ 這一幀才濺起水花
                rain.ripples.push({ x: p.x, y: sy, t: 0, life: SEA.rippleLife, size: SEA.rippleSize });
                const n = 2 + (Math.random() < 0.5 ? 1 : 0);
                for (let k = 0; k < n; k++) {
                    rain.drops.push({ x: p.x, y: sy - 1, y0: sy, vx: rand(-45, 45), vy: -rand(SEA.splashSpeed[0], SEA.splashSpeed[1]) });
                }
                parts[i] = parts[parts.length - 1]; parts.pop();
                continue;
            }
            p.y += p.v * dt;
            if (p.y + p.len >= sy) {
                // 雨落得很快，一幀可能就越過海面幾十 px：先把雨絲底端放在海面上畫一幀
                p.y = sy - p.len;
                p.hit = true;
            }
        }
        const d = rain.drops;
        for (let i = d.length - 1; i >= 0; i--) {
            const q = d[i];
            q.vy += SEA.gravity * dt;
            q.x += q.vx * dt;
            q.y += q.vy * dt;
            if (q.vy > 0 && q.y >= q.y0) { d[i] = d[d.length - 1]; d.pop(); } // 落回海面就消失
        }
    }

    // 雪：碰到海面就停止飄動，慢慢下沉、縮小、淡掉（融化）
    function stepSnow(dt) {
        const L = snow.layer, parts = snow.parts;
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            if (p.melt === undefined) {
                p.y += p.v * dt;
                const x = p.x + p.sway * Math.sin(p.y / SNOW.swayPeriod);
                const sy = seaY(snowOff, x + SNOW.size / 2, L.h, p.layer);
                if (p.y + SNOW.size >= sy) {
                    // 雪花底部真的碰到海面才開始融化
                    p.y = sy - SNOW.size;
                    p.melt = 0;
                    p.mx = x; // 固定在碰到海面的位置
                    p.sy = sy;
                    snow.ripples.push({ x: x + SNOW.size / 2, y: sy, t: 0, life: SEA.meltTime, size: 5 });
                }
            } else {
                p.melt += dt;
                p.y += p.v * 0.12 * dt;
                p.sy = seaY(snowOff, p.mx + SNOW.size / 2, L.h, p.layer); // 海面會起伏，跟著更新
                if (p.melt >= SEA.meltTime) { parts[i] = parts[parts.length - 1]; parts.pop(); }
            }
        }
    }

    function stepRipples(list, dt) {
        for (let i = list.length - 1; i >= 0; i--) {
            list[i].t += dt;
            if (list[i].t >= list[i].life) { list[i] = list[list.length - 1]; list.pop(); }
        }
    }
    // 漣漪：扁扁的橢圓圈，往外擴散、變淡
    function drawRipples(ctx, list, rgb, alpha) {
        ctx.lineWidth = 0.8;
        for (let i = 0; i < list.length; i++) {
            const r = list[i], p = r.t / r.life;
            const rx = 1.5 + r.size * p;
            ctx.strokeStyle = "rgba(" + rgb + "," + (alpha * (1 - p) * (1 - p)).toFixed(3) + ")";
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, rx, rx * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    let running = false, lastT = 0;
    function tick(now) {
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        // 雨
        if (rain.on) {
            rain.acc += dt;
            while (rain.acc >= RAIN.spawnEvery) { rain.acc -= RAIN.spawnEvery; rain.parts.push(newRainDrop(rain.layer.w, -10)); }
            stepIcon(rain.iconParts, dt, rain.icon.h, rain.icon.w);
        }
        stepRain(dt);
        stepRipples(rain.ripples, dt);
        drawRain(rain.layer, rain.parts, rain.color, 1);
        {
            const ctx = rain.layer.ctx;
            ctx.fillStyle = "rgba(" + rain.rgb + ",0.35)";
            for (let i = 0; i < rain.drops.length; i++) { const q = rain.drops[i]; ctx.fillRect(q.x - 0.6, q.y - 0.6, 1.2, 1.2); }
            drawRipples(ctx, rain.ripples, rain.rgb, 0.35);
        }

        // 雪
        if (snow.on) {
            snow.acc += dt;
            while (snow.acc >= SNOW.spawnEvery) { snow.acc -= SNOW.spawnEvery; snow.parts.push(newFlake(snow.layer.w, -20, snowImgs, SNOW.speed, SNOW.sway)); }
            stepIcon(snow.iconParts, dt, snow.icon.h, snow.icon.w);
        }
        stepSnow(dt);
        stepRipples(snow.ripples, dt);
        drawSnow(snow.layer, snow.parts, SNOW.size);
        drawRipples(snow.layer.ctx, snow.ripples, "255,255,255", 0.25);

        if (rain.on || snow.on) drawIcons();

        // 都關了、畫面上也沒有粒子了 → 停下迴圈
        if (!rain.on && !snow.on && rain.parts.length === 0 && snow.parts.length === 0 &&
            rain.drops.length === 0 && rain.ripples.length === 0 && snow.ripples.length === 0) {
            rain.layer.ctx.clearRect(0, 0, rain.layer.w, rain.layer.h);
            snow.layer.ctx.clearRect(0, 0, snow.layer.w, snow.layer.h);
            running = false;
            return;
        }
        requestAnimationFrame(tick);
    }
    function start() {
        if (running) return;
        running = true;
        lastT = performance.now();
        requestAnimationFrame(tick);
    }

    function setButton(btn, icon, on) {
        btn.style.border = on ? "1px solid rgba(255, 255, 255, 1)" : "1px solid rgba(255, 255, 255, 0.4)";
        icon.cv.style.opacity = on ? 1 : 0.4;
    }

    rainBtn.addEventListener("click", function () {
        rain.on = !rain.on;
        setButton(rainBtn, rain.icon, rain.on);
        if (rain.on) { updateRainColor(); start(); }
    });
    snowBtn.addEventListener("click", function () {
        snow.on = !snow.on;
        setButton(snowBtn, snow.icon, snow.on);
        if (snow.on) start();
    });

    // 容器大小一變（旋轉、手機網址列收合）就重設畫布，畫布才不會被拉伸變形
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { measure(); drawIcons(); });
        ro.observe(rainBox); ro.observe(snowBox);
    }
    window.addEventListener("resize", function () { measure(); drawIcons(); });
    // 雪花圖片載入後補畫一次靜止的按鈕圖示
    window.addEventListener("load", drawIcons);
    drawIcons();
});
