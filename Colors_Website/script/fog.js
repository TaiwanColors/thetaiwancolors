/*
 * fog.js — 霧（程式生成，不使用圖片）
 *
 * 取代原本的 foggyscrip.js、foggybutton.js、startfoggybutton.js。
 *
 * 霧的型態移植自《妖妖古道》的 fog_drift.gdshader，拿掉像素風的部分
 * （像素格、透明度分階、點陣抖動），改成柔和的霧：
 *
 *   大霧塊：fbm 分形雜訊 + 區域扭曲（domain warp），扭曲量本身也隨時間變化
 *           → 霧團一邊飄、一邊慢慢捲動變形，不是一張圖在平移
 *   細霧  ：較小、飄得較快，主要出現在大霧塊裡（霧團裡的細節）
 *   對比 + 門檻：把霧分成一團一團、中間有空隙；濃的地方帶一點亮色，有厚薄
 *
 * 效能：
 *   用 WebGL 畫在「1/2 解析度」的小畫布上，再由瀏覽器平滑放大貼滿畫面
 *   （再加一點微量抖動，避免淡霧出現色階斷層），而且霧變化很慢，每秒只畫 24 次。
 *   關掉、散完之後整個停下，不再計算。
 *
 * 按鈕小圖示：
 *   用同一個 shader 畫縮小版（把 1100px 寬的霧縮進按鈕、時間加快 10 倍），讓玩家一看就知道是什麼效果。
 *   關著時是靜止的一張（不跑任何動畫），打開時才跟著大霧一起飄。
 *
 * 開關：
 *   打開時不是單純淡入，而是把「看得到霧的門檻」從高慢慢降下來
 *   → 霧從最濃的核心先冒出來、再往外長；關掉時反過來慢慢縮回去。
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // ===== 可調參數 =====
    const FOG = {
        // 參考原本 fog_1~5.png：一團團圓蓬蓬的霧，中心亮白、往外慢慢變淡，邊緣柔軟起伏
        color:     [0.88, 0.87, 0.86],  // 霧外圍的顏色（偏灰白）
        highlight: [1.0, 1.0, 1.0],     // 霧團中心的亮白
        density: 0.62,                   // 整體濃度
        largeScale: 420,                 // 大霧團大小 (px)
        largeWeight: 0.9,
        smallScale: 170,                 // 霧團裡的起伏大小 (px)
        smallWeight: 0.22,               // 細節少一點，邊緣才不會碎
        wind: [14, -2],                  // 風向與速度 (px/s)
        smallSpeedMul: 1.8,              // 細霧比大霧快幾倍
        stretch: 1.15,                   // 橫向拉長（1 = 圓）
        warp: 0.7,                       // 扭曲：越大越捲
        threshold: 0.3,                  // 多濃才開始看得到霧
        softness: 0.62,                  // 邊緣漸層寬度：越大越柔
        contrast: 2.1,                   // 霧團與空隙分得多清楚
        sky: 0.55,                       // 天空的霧是水面附近的幾倍（< 1 = 上薄下濃）
        clearRadius: 150,                // 船周圍霧變淡的半徑 (px)
        clearStrength: 0.45,             // 船周圍變淡多少（0 = 不變淡）
    };
    const RES_SCALE = 2;   // 畫布解析度 = 螢幕的 1/RES_SCALE（太低放大後會有階梯感）
    const FPS = 24;        // 每秒畫幾次（霧動得很慢，24 次就很順）
    const FADE_IN = 5;     // 霧湧入的秒數
    const FADE_OUT = 3.5;  // 霧散去的秒數

    const container = document.getElementById("foggycontainer");
    const button = document.getElementById("foggyButton");
    if (!container || !button) return;

    const f1 = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
    const v2 = (a) => "vec2(" + f1(a[0]) + "," + f1(a[1]) + ")";
    const v3 = (a) => "vec3(" + a.map(f1).join(",") + ")";

    const VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
    const FRAG = [
        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif",
        "uniform vec2 u_res;",     // 畫布像素
        "uniform vec2 u_view;",    // 畫面 CSS 像素
        "uniform float u_scale;",  // 霧的尺寸倍率（小螢幕縮小，霧團才不會比整個畫面還大）
        "uniform float u_time;",
        "uniform float u_amount;", // 0 = 沒霧，1 = 霧全開
        "uniform vec2 u_clear;",   // 船的位置（CSS 像素）
        "uniform float u_gain;",   // 濃度倍率（按鈕小圖示用）
        "const vec3 FOG_COLOR = " + v3(FOG.color) + ";",
        "const vec3 HI_COLOR = " + v3(FOG.highlight) + ";",
        "const vec2 WIND = " + v2(FOG.wind) + ";",
        "float hash(vec2 p) {",
        "  p = fract(p * vec2(123.34, 456.21) + 0.37);",
        "  p += dot(p, p + 45.32);",
        "  return fract(p.x * p.y);",
        "}",
        "float vnoise(vec2 p) {",
        "  vec2 i = floor(p); vec2 f = fract(p);",
        "  vec2 u = f * f * (3.0 - 2.0 * f);",
        "  float a = hash(i), b = hash(i + vec2(1.0, 0.0));",
        "  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));",
        "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
        "}",
        // 每一層稍微轉個角度，避免看出網格方向
        "float fbm(vec2 p, int oct) {",
        "  float v = 0.0; float amp = 0.5;",
        "  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);",
        "  for (int i = 0; i < 5; i++) {",
        "    if (i >= oct) break;",
        "    v += amp * vnoise(p);",
        "    p = rot * p * 2.03 + vec2(17.1, 9.2);",
        "    amp *= 0.5;",
        "  }",
        "  return v;",
        "}",
        "void main() {",
        "  vec2 uv = gl_FragCoord.xy / u_res;",
        "  vec2 p = vec2(uv.x, 1.0 - uv.y) * u_view / u_scale;",
        "  vec2 sq = vec2(1.0 / " + f1(FOG.stretch) + ", 1.0);",
        // 大霧塊：慢慢飄 + 隨時間變化的扭曲 → 霧團會捲動變形
        "  vec2 pl = (p - WIND * u_time) * sq / " + f1(FOG.largeScale) + ";",
        "  vec2 q = vec2(fbm(pl + vec2(0.0, u_time * 0.015), 3), fbm(pl + vec2(5.2, 1.3) - vec2(u_time * 0.012, 0.0), 3));",
        "  float big = fbm(pl + " + f1(FOG.warp) + " * q, 4);",
        // 細霧：小、飄得快，主要出現在大霧塊裡
        "  vec2 ps = (p - WIND * " + f1(FOG.smallSpeedMul) + " * u_time) * sq / " + f1(FOG.smallScale) + ";",
        "  float small = fbm(ps + " + f1(FOG.warp * 0.5) + " * q + vec2(31.7, 11.3), 3);",
        "  float lw = " + f1(FOG.largeWeight) + ", sw = " + f1(FOG.smallWeight) + ";",
        "  float f = big * lw + small * sw * (0.4 + big);",
        "  f /= max(0.001, lw + sw * 0.9);",
        "  f = (f - 0.5) * " + f1(FOG.contrast) + " + 0.5;",
        // 開關：門檻從高往下降 → 霧從最濃的核心長出來
        "  float th = " + f1(FOG.threshold) + " + (1.0 - u_amount) * 0.5;",
        "  float shape = smoothstep(th, th + " + f1(FOG.softness) + ", f);",
        "  float a = shape * " + f1(FOG.density) + " * u_gain * smoothstep(0.0, 0.35, u_amount);",
        // 上薄下濃（水面附近最濃）
        "  a *= mix(" + f1(FOG.sky) + ", 1.0, smoothstep(0.1, 0.6, 1.0 - uv.y));",
        // 船周圍變淡，釣魚時看得清楚
        "  float dc = distance(p, u_clear / u_scale);",
        "  a *= 1.0 - " + f1(FOG.clearStrength) + " * (1.0 - smoothstep(" + f1(FOG.clearRadius * 0.4) + ", " + f1(FOG.clearRadius) + ", dc));",
        // 中心亮白、外圍偏灰（像原本霧圖的一團團）
        "  vec3 col = mix(FOG_COLOR, HI_COLOR, smoothstep(0.2, 0.9, shape) * (0.6 + 0.4 * small));",
        // 微量抖動：很淡的霧只有少數幾階透明度，放大後會出現一圈圈色階斷層，加一點雜訊打散
        "  a = clamp(a + (hash(gl_FragCoord.xy + fract(u_time) * 61.0) - 0.5) / 255.0, 0.0, 1.0);",
        "  gl_FragColor = vec4(col * a, a);",  // 預乘透明度
        "}",
    ].join("\n");


    // 編譯 shader、準備一個蓋滿畫布的三角形；回傳 draw(參數)。不支援 WebGL 回傳 null
    function makeRenderer(cv) {
        const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false })
            || cv.getContext("experimental-webgl");
        if (!gl) return null;
        const sh = function (type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("fog shader:", gl.getShaderInfoLog(s)); return null; }
            return s;
        };
        const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return null;
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("fog link:", gl.getProgramInfoLog(prog)); return null; }
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // 一個蓋滿畫布的大三角形
        const loc = gl.getAttribLocation(prog, "a");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = {};
        ["u_res", "u_view", "u_scale", "u_time", "u_amount", "u_clear", "u_gain"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
        return {
            draw: function (o) {
                gl.viewport(0, 0, cv.width, cv.height);
                gl.uniform2f(U.u_res, cv.width, cv.height);
                gl.uniform2f(U.u_view, o.viewW, o.viewH);
                gl.uniform1f(U.u_scale, o.scale);
                gl.uniform1f(U.u_time, o.time);
                gl.uniform1f(U.u_amount, o.amount);
                gl.uniform2f(U.u_clear, o.clearX, o.clearY);
                gl.uniform1f(U.u_gain, o.gain);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            },
            clear: function () {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            },
        };
    }

    // ===== 畫面上的霧 =====
    const canvas = document.createElement("canvas");
    canvas.id = "fog-canvas";
    container.appendChild(canvas);
    const fog = makeRenderer(canvas);

    // ===== 按鈕小圖示：同一個霧的縮小版，讓玩家一看就知道是什麼效果 =====
    // 把一個 1280×(按鈕比例) 的畫面縮進按鈕裡；關著時是靜止的一張，打開時跟著一起飄
    const icon = document.createElement("canvas");
    icon.className = "fog-icon";
    button.appendChild(icon);
    const iconFog = makeRenderer(icon);
    // 圖示太小：照原速度霧在裡面每秒只動不到 1px，看起來是靜止的。
    // 所以視野窄一點（霧團在圖示裡大一點），時間也加快，讓人一眼看出霧在飄
    const ICON_VIEW_W = 1100;  // 圖示裡裝多寬的霧 (px)：太窄只裝得下一團，空隙飄過時會整個空掉
    const ICON_SPEED = 10;     // 圖示裡的霧比大霧快幾倍
    let iconViewH = 427;
    function sizeIcon() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = button.clientWidth || 45, h = button.clientHeight || 15;
        icon.width = Math.max(1, Math.round(w * dpr));
        icon.height = Math.max(1, Math.round(h * dpr));
        iconViewH = ICON_VIEW_W * h / w;
    }
    const t0 = performance.now();
    let iconTime = 8; // 靜止時顯示的那一刻
    function drawIcon() {
        if (!iconFog) return;
        // amount > 1 會把「看得到霧的門檻」再壓低一點 → 圖示裡霧鋪得比較滿，不會飄到一片空白
        iconFog.draw({ viewW: ICON_VIEW_W, viewH: iconViewH, scale: 1, time: iconTime, amount: 1.6,
            clearX: -1e5, clearY: -1e5, gain: 1.2 });
    }
    sizeIcon();
    drawIcon();

    // 畫布大小與船的位置只在開啟與 resize 時量
    let vw = 0, vh = 0, clearX = -1e5, clearY = -1e5;
    function measure() {
        vw = window.innerWidth;
        vh = window.innerHeight;
        canvas.width = Math.max(1, Math.ceil(vw / RES_SCALE));
        canvas.height = Math.max(1, Math.ceil(vh / RES_SCALE));
        const boat = document.getElementById("boat_container_from");
        if (boat) {
            const r = boat.getBoundingClientRect();
            clearX = r.left + r.width / 2;
            clearY = r.top + r.height / 2;
        }
    }
    window.addEventListener("resize", function () {
        sizeIcon();
        if (running) measure(); else drawIcon();
    });

    // ===== 開關與動畫迴圈（只在有霧時跑；關著時什麼都不跑） =====
    let on = false, amount = 0, running = false, lastT = 0, lastDraw = -1e9, lastIconTime = 0;
    const ease = (x) => x * x * (3 - 2 * x);

    function tick(now) {
        const dt = Math.min(0.1, (now - lastT) / 1000);
        lastT = now;
        amount = on ? Math.min(1, amount + dt / FADE_IN) : Math.max(0, amount - dt / FADE_OUT);
        if (now - lastDraw >= 1000 / FPS - 2) {
            lastDraw = now;
            const time = (now - t0) / 1000;
            fog.draw({ viewW: vw, viewH: vh,
                // 以 1280px 寬為基準：手機上霧團約縮成一半
                scale: Math.min(1.2, Math.max(0.5, vw / 1280)),
                time: time, amount: ease(amount), clearX: clearX, clearY: clearY, gain: 1 });
            if (on) { iconTime += (time - lastIconTime) * ICON_SPEED; drawIcon(); }
            lastIconTime = time;
        }
        if (!on && amount <= 0) {
            // 霧散完：清空並停下，不再佔用 GPU
            fog.clear();
            canvas.style.visibility = "hidden";
            running = false;
            return;
        }
        requestAnimationFrame(tick);
    }

    button.addEventListener("click", function () {
        on = !on;
        button.style.border = on ? "1px solid rgba(255, 255, 255, 1)" : "1px solid rgba(255, 255, 255, 0.4)";
        icon.style.opacity = on ? 1 : 0.4;
        if (!fog) return; // 不支援 WebGL：只切換按鈕外觀
        if (on && !running) {
            measure();
            canvas.style.visibility = "visible";
            running = true;
            lastT = performance.now();
            lastIconTime = (lastT - t0) / 1000;
            requestAnimationFrame(tick);
        }
    });
});
