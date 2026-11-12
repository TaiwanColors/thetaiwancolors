/*
 * stars.js — 星空與流星（畫面上的效果 + 按鈕小圖示）
 *
 * 取代原本的 starryskyscrip.js、starryskybutton.js、startstarryskybutton.js、
 *           createmeteor.js、meteorbutton.js、startmeteorbutton.js。
 *
 * 原本的問題：
 *   - 開啟後畫面上有 80 顆大星星 + 100 顆各自跑 CSS 動畫的閃爍小星星，
 *     手機上變成 100 多個獨立合成的圖層；大星星還用 width/height 動畫（每幀重排）
 *   - 按鈕裡的流星同時由兩支腳本產生，每開一次又多疊一組計時器，越開越密
 *   - startmeteorbutton.js 的 meteors 陣列只增不減，記憶體一直長
 *
 * 現在：
 *   - 全部畫在一張 <canvas> 上，一個動畫迴圈，每秒 30 次
 *   - 外觀沿用原本：大星星照 starlight_1/2.svg 的形狀、閃爍小星星隨機色相、
 *     三種顏色的流星與原本的漸層尾巴、往左下劃過、後半段尾巴縮短消失
 *   - 開啟：星星 2 秒內長出來；關閉：2 秒內縮小淡出，之後迴圈完全停止
 *   - 按鈕小圖示：關著時是靜止的一張（40%），打開時星星閃爍、流星劃過
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const FPS = 30;          // 只有星星時每秒畫幾次（星星閃得慢，30 就很順）
    // 有流星在飛的時候每一幀都畫：流星很快（每秒約 670px），每秒只畫 30 次會一頓一頓的
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const easeOut = (x) => 1 - (1 - x) * (1 - x);
    const DIR = { x: -Math.SQRT1_2, y: Math.SQRT1_2 }; // 流星往左下

    // ===== 可調參數（換算自原本的設定） =====
    const SKY = {
        starsPer1920: 50,          // 畫面寬 1920px 時的大星星「批數 ×10」（原本的公式）
        starSize: [3, 8],          // 大星星大小 (px)
        grow: 2,                   // 長出來／收回去的秒數
        shinyCount: 100,           // 閃爍小星星數
        shinyEvery: 0.2,           // 每 0.2 秒多 10 顆（原本逐批出現）
        shinyDelay: 2,             // 出現後幾秒才亮起
        meteorEvery: 1,            // 每幾秒一顆流星
        meteorDist: 800,           // 流星飛多遠 (px)
        meteorTime: 1.2,           // 飛行秒數
        meteorTail: [60, 150],     // 尾巴長度 (px)
        seaMargin: 8,              // 星星離海面至少幾 px（整顆星都在海面以上，不會被切成一橫）
    };
    const ICON = {
        stars: 10, starSize: [2, 6],   // 同原本：5 組 × 2 顆
        shiny: 10,
        meteorEvery: [0.35, 0.55], meteorDist: 50, meteorTime: 0.6, meteorTail: [10, 30],
    };
    // 三種流星：頭的顏色 + 尾巴漸層（同原本 CSS 的 meteor_1~3）
    const METEOR_STYLES = [
        { head: "#fffc30", tail: ["#fffc3051", "#fc1e6f38", "#c800ff28", "#7700ff0b"] },
        { head: "#99dfff", tail: ["#79ff583a", "#ffca461d", "#ff7a2d25", "#ff238d0b"] },
        { head: "#ff3131", tail: ["#ff8e2b51", "#c6ff4138", "#5cff6120", "#69ff960b"] },
    ];
    const ICON_METEOR = { head: "#ffffff", tail: ["#ffffff51", "#ffffff12"] };

    const box = document.getElementById("starryskycontainer");
    const btn = document.getElementById("starryskyButton");
    if (!box || !btn) return;

    // ===== 星星圖形：直接用 starlight_1.svg / starlight_2.svg 裡的多邊形座標畫 =====
    // （那兩個 svg 只有 viewBox、沒有寬高，當成圖片載入會被拉成 300×150 而變形，
    //   所以直接照同樣的座標畫）
    const STAR_SHAPES = [
        [ // starlight_1：斜十字 + 正十字
            [.52, .52, .78, .3, .56, .56, .78, .81, .52, .59, .27, .81, .49, .56, .27, .3, .52, .52],
            [.56, .59, .52, 1.06, .49, .59, .02, .56, .49, .52, .52, .06, .56, .52, 1.02, .56, .56, .59],
        ],
        [ // starlight_2：正十字
            [.56, .59, .52, 1.06, .49, .59, .02, .56, .49, .52, .52, .06, .56, .52, 1.02, .56, .56, .59],
        ],
    ];
    // 每種星星做成一個以中心為原點、寬 1 的向量路徑；畫的時候直接縮放到實際大小
    // （先畫成小圖再縮小，細細的星芒會被取樣漏掉，只剩斷斷續續的短線）
    const starPaths = STAR_SHAPES.map(function (polys) {
        const path = new Path2D();
        polys.forEach(function (pts) {
            path.moveTo(pts[0] / 1.05 - 0.5, pts[1] / 1.05 - 0.5);
            for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i] / 1.05 - 0.5, pts[i + 1] / 1.05 - 0.5);
            path.closePath();
        });
        return path;
    });

    // ===== 畫布 =====
    function makeLayer(parent, cls) {
        const cv = document.createElement("canvas");
        cv.className = cls;
        parent.appendChild(cv);
        return { cv: cv, ctx: cv.getContext("2d"), w: 0, h: 0 };
    }
    function size(L, w, h) {
        L.w = w; L.h = h;
        L.cv.width = Math.max(1, Math.round(w * DPR));
        L.cv.height = Math.max(1, Math.round(h * DPR));
        L.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    const sky = makeLayer(box, "weather-canvas");
    const icon = makeLayer(btn, "weather-icon");
    const skyOff = { x: 0, y: 0 };
    function measure() {
        const r = box.getBoundingClientRect();
        skyOff.x = r.left; skyOff.y = r.top;
        size(sky, box.clientWidth, box.clientHeight);
        size(icon, btn.clientWidth || 45, btn.clientHeight || 15);
    }
    measure();

    // ===== 星星資料（位置用 0~1 的比例，畫面大小變了也不用重算） =====
    // 海面在星空畫布裡的高度（px），由 waves.js 提供；拿不到就用畫布底部
    function seaY(xPx) {
        return window.seaSurfaceAt ? Math.min(sky.h, window.seaSurfaceAt(xPx + skyOff.x) - skyOff.y) : sky.h;
    }
    // 畫面上的星星：在 x 決定後，y 只放在「海面減去星星半徑和安全距離」以上 → 布滿整片天空直到海面
    function skyY(x, radius) {
        const limit = Math.max(0, (seaY(x * sky.w) - radius - SKY.seaMargin) / sky.h);
        return Math.random() * limit;
    }
    // inSky：畫面上的星星（要避開海面）；按鈕裡則整格都可以
    function makeStars(n, sz, t0, stagger, inSky) {
        const a = [];
        for (let i = 0; i < n; i++) {
            const x = Math.random(), size = rand(sz[0], sz[1]);
            a.push({ x: x, y: inSky ? skyY(x, size / 2) : Math.random(), size: size,
                img: Math.random() < 0.5 ? 0 : 1, born: t0 + (stagger ? stagger(i) : 0) });
        }
        return a;
    }
    function makeShiny(n, t0, icon) {
        const a = [];
        for (let i = 0; i < n; i++) {
            const x = Math.random();
            a.push({
                x: x, y: icon ? Math.random() : skyY(x, 1),
                // 畫面上：隨機色相；按鈕裡：白色
                color: icon ? "255,255,255" : hslToRgb(Math.random() * 360, 100, 50 + Math.random() * 50),
                alpha: 0.5 + Math.random() * 0.5,
                period: 1 + Math.random() * 3, phase: Math.random() * 2,
                born: icon ? t0 : t0 + Math.floor(i / 10) * SKY.shinyEvery + SKY.shinyDelay,
            });
        }
        return a;
    }
    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
        const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
        return f(0) + "," + f(8) + "," + f(4);
    }
    // 閃爍：0.3 ↔ 1，緩入緩出（同原本 @keyframes twinkling）
    const twinkle = (s, t) => 0.3 + 0.7 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - s.phase)) / s.period));

    let on = false, offAt = 0;
    let stars = [], shiny = [], meteors = [], nextMeteor = 0;
    const iconStars = makeStars(ICON.stars, ICON.starSize, -10);
    const iconShiny = makeShiny(ICON.shiny, -10, true);
    let iconMeteors = [], nextIconMeteor = 0, iconTime = 0;

    function newMeteor(L, t, style, dist, time, tail) {
        return { x: rand(0, L.w), y: rand(0, Math.max(1, L.h - (L === sky ? 100 : 10))), t0: t,
            style: style, dist: dist, time: time, tail: rand(tail[0], tail[1]) };
    }

    // ===== 繪製 =====
    function drawStars(L, list, t, fade, scaleFn) {
        const ctx = L.ctx;
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = fade;
        for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const k = scaleFn(s, t) * fade;
            if (k <= 0.01) continue;
            const d = s.size * k * DPR;
            ctx.setTransform(d, 0, 0, d, s.x * L.w * DPR, s.y * L.h * DPR);
            ctx.fill(starPaths[s.img]);
        }
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.globalAlpha = 1;
    }
    function drawShiny(L, list, t, fade, px, animate) {
        const ctx = L.ctx;
        for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const grow = clamp01((t - s.born) / 0.5);
            if (grow <= 0) continue;
            const a = s.alpha * (animate ? twinkle(s, t) : 0.65) * fade;
            ctx.fillStyle = "rgba(" + s.color + "," + a.toFixed(3) + ")";
            const d = px * grow * fade;
            ctx.fillRect(s.x * L.w - d / 2, s.y * L.h - d / 2, d, d);
        }
    }
    // fade：關閉時跟星星一起淡出（0~1）
    function drawMeteors(L, list, t, thick, fade) {
        const ctx = L.ctx;
        ctx.globalAlpha = fade === undefined ? 1 : fade;
        for (let i = list.length - 1; i >= 0; i--) {
            const m = list[i];
            const p = (t - m.t0) / m.time;
            if (p >= 1) { list[i] = list[list.length - 1]; list.pop(); continue; }
            // 後半段（0.5 秒起，0.5 秒內）頭和尾巴都縮到 0（同原本的 width/height 過渡）
            const shrink = 1 - clamp01((t - m.t0 - 0.5) / 0.5);
            if (shrink <= 0) continue;
            const hx = m.x + DIR.x * m.dist * p, hy = m.y + DIR.y * m.dist * p;
            const len = m.tail * shrink;
            const tx = hx - DIR.x * len, ty = hy - DIR.y * len;
            const g = ctx.createLinearGradient(hx, hy, tx, ty);
            m.style.tail.forEach(function (c, j, arr) { g.addColorStop(j / (arr.length - 1), c); });
            ctx.strokeStyle = g;
            ctx.lineWidth = thick * 1.5;
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.fillStyle = m.style.head;
            const hs = thick * shrink;
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        ctx.globalAlpha = 1;
    }

    function drawSky(t) {
        sky.ctx.clearRect(0, 0, sky.w, sky.h);
        const fade = on ? 1 : 1 - clamp01((t - offAt) / SKY.grow);
        drawStars(sky, stars, t, fade, function (s, tt) { return easeOut(clamp01((tt - s.born) / SKY.grow)); });
        drawShiny(sky, shiny, t, fade, 2, true);
        // 流星劃到海面就消失：沿著海面曲線裁切
        if (meteors.length) {
            const ctx = sky.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(sky.w, 0);
            for (let x = sky.w; x >= -1; x -= 40) ctx.lineTo(x, seaY(Math.max(0, x)));
            ctx.closePath();
            ctx.clip();
            drawMeteors(sky, meteors, t, 2, fade);
            ctx.restore();
        }
    }
    function drawIcon(t) {
        icon.ctx.clearRect(0, 0, icon.w, icon.h);
        drawStars(icon, iconStars, 0, 1, function () { return 1; });
        drawShiny(icon, iconShiny, iconTime, 1, 1, on);
        drawMeteors(icon, iconMeteors, iconTime, 1);
    }

    // ===== 迴圈（只在開著或還在淡出時跑） =====
    let running = false, lastDraw = -1e9, lastIconT = 0;
    function tick(nowMs) {
        const t = nowMs / 1000;
        if (meteors.length || nowMs - lastDraw >= 1000 / FPS - 2) {
            lastDraw = nowMs;
            if (on) {
                // 分頁切到背景時動畫會暫停；切回來不要把錯過的流星一次補發，從現在重新計時
                if (t - nextMeteor > SKY.meteorEvery) nextMeteor = t;
                while (t >= nextMeteor) {
                    meteors.push(newMeteor(sky, t, METEOR_STYLES[Math.floor(Math.random() * 3)], SKY.meteorDist, SKY.meteorTime, SKY.meteorTail));
                    nextMeteor += SKY.meteorEvery;
                }
                iconTime += Math.min(0.1, t - lastIconT); // 同上：暫停期間不累積
                while (iconTime >= nextIconMeteor) {
                    iconMeteors.push(newMeteor(icon, iconTime, ICON_METEOR, ICON.meteorDist, ICON.meteorTime, ICON.meteorTail));
                    nextIconMeteor = iconTime + rand(ICON.meteorEvery[0], ICON.meteorEvery[1]);
                }
                drawIcon(t);
            }
            lastIconT = t;
            drawSky(t);
        }
        // 關閉後 2 秒：星星、流星都淡完了 → 清空畫布、停下迴圈
        if (!on && t - offAt > SKY.grow) {
            clearSky();
            running = false;
            return;
        }
        requestAnimationFrame(tick);
    }

    let forceClearTimer = 0;
    function clearSky() {
        sky.ctx.setTransform(1, 0, 0, 1, 0, 0);
        sky.ctx.clearRect(0, 0, sky.cv.width, sky.cv.height);   // 以畫布實際像素整片清掉
        sky.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        stars = []; shiny = []; meteors = [];
    }

    btn.addEventListener("click", function () {
        on = !on;
        const t = performance.now() / 1000;
        btn.style.border = on ? "1px solid rgba(255, 255, 255, 1)" : "1px solid rgba(255, 255, 255, 0.4)";
        icon.cv.style.opacity = on ? 1 : 0.4;
        if (on) {
            measure();
            // 大星星數量同原本：每批 10 顆、每批兩顆一組，直到超過 寬/1920×50
            const target = Math.round((window.innerWidth / 1920) * SKY.starsPer1920);
            const n = Math.ceil(Math.max(1, target) / 10) * 10 * 2;
            stars = makeStars(n, SKY.starSize, t, function (i) { return Math.floor(i / 20) * 0.017; }, true);
            shiny = makeShiny(SKY.shinyCount, t, false);
            meteors = [];
            nextMeteor = t; // 第一顆立刻出現
            nextIconMeteor = iconTime;
            lastIconT = t;
            if (!running) { running = true; requestAnimationFrame(tick); }
        } else {
            offAt = t;
            iconMeteors = [];     // 按鈕裡飛到一半的流星直接清掉，不留一條線
            drawIcon(t);          // 按鈕停在目前這一格（只剩靜止的星星）
            // 保險：不管動畫迴圈處在什麼狀態，淡出時間一到就強制清空畫面上的星空
            clearTimeout(forceClearTimer);
            forceClearTimer = setTimeout(function () { if (!on) clearSky(); }, (SKY.grow + 0.5) * 1000);
        }
    });

    // 容器大小一變（旋轉、手機網址列收合）就重設畫布，畫布才不會被拉伸變形
    // （畫布若跟容器大小不一致，星星會被壓扁成一條條橫線）
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); drawIcon(performance.now() / 1000); }).observe(box);
    window.addEventListener("resize", function () { measure(); drawIcon(performance.now() / 1000); });
    drawIcon(0);
});
