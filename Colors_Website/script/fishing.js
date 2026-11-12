/*
 * fishing.js — 釣魚互動 + 色球魚群
 *
 * 整個畫面的動態（船晃動、24 顆色球游動、釣線、魚鉤）都在「同一個」
 * requestAnimationFrame 迴圈裡完成，每幀只寫 transform / SVG 屬性，
 * 不讀取版面（getBoundingClientRect 只在載入與 resize 時量一次）。
 *
 * 玩法：
 *   1. 移動魚鉤（滑鼠：跟著游標；手機：手指點／拖曳）到色球的位置。
 *   2. 點一下 = 提竿，釣線往上彈。鉤子碰到色球就會把它一起甩上空中；
 *      沒碰到也會彈，只是空鉤。
 *   3. 色球在空中受重力往下掉，玩家左右移動（手機：按住拖曳）控制落點；
 *      在空中可以再點一下多彈一次。每次出水最多彈 2 次（含第一次），以免太高。
 *      彈完後鉤子會慢慢回到游標，不會一下子被拉回去。
 *   手機：直接點一下色球 → 魚鉤自己游過去、碰到就鉤起來（點空的地方，鉤子就移到那裡）。
 *      按住拖曳可以手動移動鉤子（鉤子在手指上方 40px）。
 *      色球在空中時，在螢幕任何地方左右滑動，色球照滑動量移動；快速點一下 = 再彈一次。
 *      手機上鉤到範圍與船的接住範圍放寬一點，鉤到、落船時會震動（Android）。
 *   每隔一陣子會有一顆色球游出畫面、換成別的顏色游回來（主題色不會），不用重新整理也有新顏色。
 *   4. 掉進船裡才算釣到 → 換成這個顏色，船上原本那顆被丟回水裡；
 *      掉回水裡就是失敗，色球游走。一次只能甩一顆。
 */
window.addEventListener("load", function () {
    "use strict";

    // ===== 可調參數 =====
    const CFG = {
        rodTip:   { x: -9, y: 0 },    // 竿尖相對於船容器中心的位移 (px)（量自船的圖）
        holdSpot: { x: -34, y: 14 },  // 瓶子（釣上來的色球）在船上的位置（相對於船中心）
        bottle: {
            scale: 0.76,              // bottle.svg 每個單位 = 幾 px（瓶身約 25px 寬）
            bottomOffset: 13,         // 瓶底在色球中心下方幾 px（瓶底會沉到船緣後面，被船身蓋住）
            waterLevel: 15,           // 水面高度（bottle.svg 的 y 單位，越小水越多）
        },
        boatCatch: { x: 2, halfWidth: 78 }, // 船上「接得住」的範圍：中心偏移與半寬 (px)
        swayAmpX: 10,                 // 船左右晃動幅度
        swayAmpY: 5,                  // 船上下晃動幅度
        swayOmega: 1.2,               // 船晃動角速度 (rad/s)
        fishSpeed: 42,                // 色球基礎游速 (px/s)
        swapEvery: [18, 35],          // 每隔幾秒（隨機）讓一顆色球游出畫面、換成別的顏色游回來
        wanderEvery: [5, 12],         // 每隔幾秒（隨機）讓一隻魚自己游出畫面（左、右或下面），顏色不變
        awayTime: [2, 6],             // 游出去後在畫面外待幾秒才回來
        maxAway: 4,                   // 同時最多幾隻游出去
        schoolEvery: [12, 24],        // 每隔幾秒（隨機）試著組一群群游
        schoolGap: 17,                // 隊友之間至少隔多遠 (px)，不會疊在一起（色球約 15px）
        schoolSpeed: 1.35,            // 群游時游得比單獨的魚快一點（跟慢慢晃的散魚有對比，但不激動）
        schoolStretch: 1.12,          // 群游中的色球沿著游的方向稍微拉長成橢圓（看得出方向就好）
        leaderSwap: [6, 14],          // 每隔幾秒（隨機）換一隻魚帶頭
        crossChance: 0.8,
        schoolOvershoot: 160,         // 群游可以游出畫面多遠 (px)，之後轉回來           // 帶頭魚挑下一個目標時，有多少機率是「橫越到另一側」（長距離左右移動）
        // ---- 隊員跟隨的積極度 ----
        followTurn: 6,              // 隊員轉向的速度（急轉時 ×1.6、滑行時 ×0.3）
        followSnap: 20,               // 離帶頭魚超過 4 倍這個距離就衝一下追上（越小越積極）
        followChase: 25,              // 滑行時依離帶頭魚的遠近微調速度的靈敏度（越小調得越多）
        reactAngle: 0.45,             // 想去的方向跟自己差超過幾弧度（約 26°）才「反應」急轉（太小會一直抖）
        reactTime: [0.05, 0.15],      // 反應時間（秒）：看到 → 轉，附近一隻傳一隻累積成波浪
        burstBoost: 0.8,            // 衝刺時加速多少（× 基礎游速）
        schoolMax: 1,                 // 同時最多幾群（一大群比較醒目，像真的魚群）
        schoolSize: [5, 7],           // 一群幾隻（組隊時 5~7 隻；之後拉新隊員也不會超過 7 隻）
        schoolShare: 0.55,            // 所有魚裡最多幾成在群裡（留一些散魚，海裡才不會空）
        schoolLife: [60, 120],        // 一群維持幾秒後散開
        schoolRecruit: 220,           // 帶頭魚附近多遠的魚會被拉進隊伍 (px)（經過時沿路把附近的魚吸進來）
        schoolLeaveEvery: 60,         // 每隻隊員平均幾秒會脫隊一次
        // ---- 群聚（隊員只看身邊的隊友）----
        flockRadius: 110,             // 看得到多遠的隊友 (px)
        flockAlign: 2.4,              // 對齊：跟附近隊友同方向的力道（大：整群方向一致）
        flockCohesion: 0.2,           // 聚攏：往附近隊友中心靠的力道（小一點，才會散開不擠成一團）
        flockSeparate: 1.8,           // 分開：太近就推開的力道
        flockSpacing: 32,             // 隊友之間大約保持的距離 (px)
        flockStretch: 7,            // 帶子的長度：每多一隻隊員，往後多拉幾 px
        flockWidth: 48,               // 帶子的寬度：隊員左右最多偏幾 px
        hookOmega: 7,                 // 魚鉤彈簧的自然頻率
        hookZeta: 0.55,               // 魚鉤彈簧阻尼（<1 會微微擺盪）
        touchLinger: 4,               // 手指離開後鉤子停留時間 (s)
        catchRadius: 18,              // 提竿時鉤子離色球多近才算鉤到 (px)
        // ---- 手機（觸控）----
        touchHookLift: 40,            // 鉤子停在手指上方幾 px（手指才不會擋住鉤子和色球）
        touchCatchRadius: 26,         // 觸控時鉤到色球的範圍（手指比滑鼠不精準，放寬一點）
        touchBoatBonus: 16,           // 觸控時船的接住範圍再加寬幾 px
        touchSteerGain: 1.3,          // 空中左右滑動的靈敏度（手指滑 1px，色球移動幾 px）
        tapFishRadius: 40,            // 手機點一下：離點的位置多近的色球會被當成目標 (px)
        autoOmega: 14,                // 魚鉤自動游向目標色球的速度（彈簧頻率，越大越快）
        autoTimeout: 2.5,             // 追不到就放棄的秒數
        tapMaxMove: 12,               // 移動不超過幾 px、
        tapMaxTime: 0.3,              //   而且在幾秒內放開，才算「點一下」
        yankImpulse: 1380,            // 空鉤提竿往上彈的初速 (px/s)，約彈高 255px
        reYankImpulse: 800,           // 空鉤在空中再點一下的初速 (px/s)，約再彈 100px
        maxYanks: 2,                  // 每次出水最多彈幾次（含第一次）
        topMargin: 30,                // 鉤子最高只到離畫面頂端這麼遠 (px)
        recoverTime: 1.2,             // 彈完後「慢慢回到游標」花的時間 (s)
        recoverOmega: 1.2,            // 回程一開始的彈簧頻率（越小越慢）
        flyApex: 110,                 // 鉤到色球時，甩到竿尖上方多高 (px)
        flyReboost: 100,              // 色球在空中再點一下，往上再彈多高 (px)
        flyGravity: 1300,             // 色球在空中的重力 (px/s²)
        steerOmega: 5,                // 空中左右控制的靈敏度（越大越跟手）
        ropeSegments: 18,             // 釣線分幾節（越多越柔軟，也越耗效能）
        ropeGravity: 90,              // 釣線在水中的重力 (px/s²)
        ropeDrag: 2.5,                // 水的阻力（越大線越「拖」）
        ropeIterations: 8,            // 繩長約束迭代次數（越多越不會被拉長）
    };
    // 點這些介面元素時不提竿、不放鉤
    const UI_SELECTOR = "#rainButton,#snowButton,#foggyButton,#starryskyButton," +
        "#visibleIcon,#hideIcon,#logo,.Instagram-text,.YouTube-text,.Threads-text,#loading";

    const boatEl = document.getElementById("boat_container_from");
    const container = document.getElementById("button-container");
    const swayEls = [
        boatEl,
        container,
        document.getElementById("boat_soft_light_container"),
        document.getElementById("boatlight_container"),
    ].filter(Boolean);
    const fishEls = Array.from(container.querySelectorAll(".circle-button"));
    if (!boatEl || fishEls.length === 0) return;

    // ===== SVG 圖層：一條釣線 + 一個魚鉤 + 水花 =====
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.id = "fishing-layer";
    const linePath = document.createElementNS(NS, "path");
    linePath.classList.add("fishing-line");
    const hookPath = document.createElementNS(NS, "path");
    hookPath.classList.add("fishing-hook");
    // J 字形魚鉤：原點是綁線的地方，往下彎成鉤
    hookPath.setAttribute("d", "M0,0 V7 a3.5,3.5 0 0 1 -7,0 v-2");
    svg.appendChild(linePath);
    svg.appendChild(hookPath);
    const splashes = [0, 1, 2].map(function () {
        const c = document.createElementNS(NS, "circle");
        c.classList.add("fishing-splash");
        c.setAttribute("r", "0");
        svg.appendChild(c);
        return { el: c, x: 0, y: 0, t: -1 };
    });
    document.body.appendChild(svg);

    // ===== 小工具 =====
    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const angleDiff = (a, b) => {
        let d = (a - b) % TAU;
        if (d > Math.PI) d -= TAU;
        if (d < -Math.PI) d += TAU;
        return d;
    };
    // 拋物線：p∈[0,1]，H 為最高點比起點終點高出多少
    const arc = (p, H) => 4 * H * p * (1 - p);

    function splash(x, y) {
        const s = splashes.find((s) => s.t < 0) || splashes[0];
        s.x = x; s.y = y; s.t = 0;
    }

    // ===== 版面量測（只在載入與 resize 時做） =====
    // 「基準座標」= 頁面座標扣掉船的晃動。色球容器跟船一起晃，
    // 所以色球用基準座標記錄，畫的時候只要扣掉容器原點即可。
    let vw, vh, boatCX, boatCY, originX, originY, fishR;
    let swayX = 0, swayY = 0;
    const B = { l: 0, r: 0, t: 0, b: 0 }; // 色球活動範圍（基準座標）

    // ===== 船上的瓶子：釣到的色球裝在裡面 =====
    // 後層：水（用瓶子形狀裁切），在色球後面；前層：玻璃（image/bottle.svg），蓋在色球前面
    // 座標用 bottle.svg 的 viewBox 單位（45.46 × 53）
    const BOTTLE_W = 45.46, BOTTLE_H = 53;
    const BOTTLE_PATH = "M32.51,5.83c.35,0,.68.16.9.43.39.5.31,1.22-.19,1.61l-.96.76c-1.27,1-1.15,2.74.21,3.64,4.31,2.84,7.06,7.37,6.9,12.47-.24,7.85,3.81,22.43-16.64,22.43S6.33,32.59,6.09,24.74c-.16-5.1,2.59-9.63,6.9-12.47,1.36-.9,1.48-2.64.21-3.64l-.96-.76c-.5-.39-.58-1.11-.19-1.61.22-.27.55-.43.9-.43h19.56Z";
    const BOTTLE_BOTTOM = 47.07;   // 瓶底在 viewBox 裡的 y
    const BOTTLE_CX = 22.73;       // 瓶身中心在 viewBox 裡的 x
    const bottleBack = document.createElementNS(NS, "svg");
    bottleBack.setAttribute("viewBox", "0 0 " + BOTTLE_W + " " + BOTTLE_H);
    bottleBack.setAttribute("class", "bottle-water");
    // 後層由下而上：玻璃本體（image/bottle.svg）→ 水（不透明、跟海同色，蓋住玻璃本體的白色）
    bottleBack.innerHTML =
        '<image href="image/bottle.svg" width="' + BOTTLE_W + '" height="' + BOTTLE_H + '"/>' +
        '<defs><clipPath id="bottle-clip"><path d="' + BOTTLE_PATH + '"/></clipPath></defs>' +
        '<g clip-path="url(#bottle-clip)"><path class="water-body"/><path class="water-line"/></g>';
    const waterBody = bottleBack.querySelector(".water-body");
    const waterLine = bottleBack.querySelector(".water-line");
    // 前層：玻璃邊緣 ＋ 一道高光（玻璃本體放在後層，才不會把水染白）
    // 邊緣顏色跟著背景切換（亮背景用深邊、暗背景用淺邊），白底上也看得到瓶子
    const bottleGlass = document.createElementNS(NS, "svg");
    bottleGlass.setAttribute("viewBox", "0 0 " + BOTTLE_W + " " + BOTTLE_H);
    bottleGlass.setAttribute("class", "bottle-glass");
    bottleGlass.innerHTML =
        '<path class="glass-edge" d="' + BOTTLE_PATH + '"/>' +
        '<path class="glass-rim" d="M13.2,8.6 H32.2"/>' +                       // 瓶口下緣
        '<path class="glass-shine" d="M11.6,17.2 C9.1,19.6 8.4,24.8 9.4,30.6"/>'; // 瓶身左側的反光
    // 船緣的上緣（量自船的原圖，boat_container_from 內的座標）：x 每 2px 一個點，值是船緣頂端的 y。
    // 瓶子在這條線以下的部分會被裁掉，露出原本的船 → 看起來是「放在」船裡，
    // 而且顏色跟船完全一樣（船上有疊船燈光暈與海浪，複製一份船去蓋會變色）。
    // x 約 126~150 是漁夫，那一段的值比較小；瓶子不要移到那裡。
    const RIM = [29.5, 29.5, 22.5, 17.5, 44.8, 48.8, 51.5, 54, 55.8, 57.2, 58.5, 59.5, 60.5, 61.2, 62, 62.8, 63.2, 64,
        64.5, 65, 65.5, 66, 66.2, 66.8, 67, 67.5, 67.8, 68, 68.5, 68.8, 69, 69.2, 69.5, 69.8, 69.8, 70, 70.2, 70.5, 70.5,
        70.8, 70.8, 71, 71, 71.2, 71.2, 71.5, 71.5, 71.5, 71.8, 71.8, 71.8, 71.8, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
        72, 71.2, 67.8, 66.2, 64.5, 52.5, 51.5, 43, 43.2, 51.2, 51.5, 52.8, 63, 71.2, 71, 70.8, 70.5, 70, 69.8, 69.2, 68.5,
        68, 67.2, 66.5, 65.8, 64.8, 63.8, 62.5, 61.8, 67.2, 67.5, 61.5, 63.5, 63.5];
    const rimY = function (x) { // x：船容器內的 px
        const i = Math.max(0, Math.min(RIM.length - 1.001, x / 2)), i0 = Math.floor(i), f = i - i0;
        return RIM[i0] + (RIM[i0 + 1] - RIM[i0]) * f;
    };

    // 圖層順序：玻璃本體＋水 → 玻璃邊緣與反光（都在 z-index 2）→ 色球（3），色球不會被瓶子蓋到
    document.body.appendChild(bottleBack);
    document.body.appendChild(bottleGlass);
    swayEls.push(bottleBack, bottleGlass); // 跟船一起晃

    // 把瓶子放到船上：瓶身中心對齊色球的位置，瓶底在色球下方 bottle.bottomOffset px
    function placeBottle() {
        const s = CFG.bottle.scale;
        const left = boatCX + CFG.holdSpot.x - BOTTLE_CX * s;
        const top = boatCY + CFG.holdSpot.y + CFG.bottle.bottomOffset - BOTTLE_BOTTOM * s;
        const w = BOTTLE_W * s, h = BOTTLE_H * s;
        [bottleBack, bottleGlass].forEach(function (el) {
            el.style.left = left.toFixed(1) + "px";
            el.style.top = top.toFixed(1) + "px";
            el.style.width = w.toFixed(1) + "px";
            el.style.height = h.toFixed(1) + "px";
        });
        // 裁掉船緣以下的部分：多邊形上緣是瓶子的頂、下緣沿著船緣
        const bw = boatEl.offsetWidth || 190, bh = boatEl.offsetHeight || 95;
        const bx = boatCX - bw / 2, by = boatCY - bh / 2;
        const pts = ["0px 0px", w.toFixed(1) + "px 0px"];
        for (let x = w; x >= -0.01; x -= w / 12) {
            const y = by + rimY(left + x - bx) - top;
            pts.push(x.toFixed(1) + "px " + y.toFixed(1) + "px");
        }
        const clip = "polygon(" + pts.join(",") + ")";
        bottleBack.style.clipPath = clip;
        bottleGlass.style.clipPath = clip;
    }

    function measure() {
        vw = window.innerWidth;
        vh = window.innerHeight;
        const b = boatEl.getBoundingClientRect();
        boatCX = b.left + b.width / 2 - swayX;
        boatCY = b.top + b.height / 2 - swayY;
        const c = container.getBoundingClientRect();
        originX = c.left - swayX;
        originY = c.top - swayY;
        fishR = (fishEls[0].offsetWidth || 15) / 2;
        B.l = 14; B.r = vw - 14;
        B.t = Math.min(originY + 16, vh - 60); B.b = vh - 14;
        placeBottle();
    }
    measure();
    window.addEventListener("resize", measure);

    // ===== 船的上緣（給雨、雪判斷「落到船上」用） =====
    // 把船的圖（含船首、船燈、企鵝）和瓶子畫到一張看不見的小畫布上，
    // 量出每一欄最上面有東西的位置；之後換船的圖也會自動跟著新的圖。
    let boatTop = null;            // boatTop[x]：船容器內第 x px 那一欄的最上緣（沒有東西是 Infinity）
    function buildBoatProfile() {
        const imgs = Array.from(boatEl.querySelectorAll("img"));
        const bw = boatEl.offsetWidth || 190, bh = boatEl.offsetHeight || 95;
        const k = 2; // 兩倍解析度量，比較準
        const cv = document.createElement("canvas");
        cv.width = Math.round(bw * k); cv.height = Math.round(bh * k);
        const g = cv.getContext("2d");
        imgs.forEach(function (im) {
            g.drawImage(im, 0, 0, (im.clientWidth || bw) * k, (im.clientHeight || bh) * k);
        });
        // 瓶子（瓶身在船上的位置）
        const s = CFG.bottle.scale;
        g.setTransform(k * s, 0, 0, k * s,
            k * (CFG.holdSpot.x + bw / 2 - BOTTLE_CX * s),
            k * (CFG.holdSpot.y + bh / 2 + CFG.bottle.bottomOffset - BOTTLE_BOTTOM * s));
        g.fill(new Path2D(BOTTLE_PATH));
        let data;
        try { data = g.getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return; } // 用 file:// 開啟時讀不到，就不做
        const top = new Float32Array(Math.ceil(bw));
        for (let x = 0; x < top.length; x++) {
            const cx = Math.min(cv.width - 1, Math.round((x + 0.5) * k));
            top[x] = Infinity;
            // 至少連續 2px 厚才算表面：像釣竿這種細線，雨雪會直接穿過
            let run = 0;
            for (let y = 0; y < cv.height; y++) {
                if (data[(y * cv.width + cx) * 4 + 3] > 128) {
                    if (++run >= 2 * k) { top[x] = (y - run + 1) / k; break; }
                } else run = 0;
            }
        }
        boatTop = top;
    }
    // 船的圖是 load 之後才加進來的，等它們都載入完再量
    (function waitBoatImages() {
        const imgs = Array.from(boatEl.querySelectorAll("img"));
        Promise.all(imgs.map(function (im) {
            return im.complete ? Promise.resolve() : new Promise(function (r) { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); });
        })).then(buildBoatProfile);
    })();
    // 頁面座標 x 這一欄，船的上緣在頁面上的 y（跟著船晃）；不在船上回傳 Infinity
    window.boatSurfaceAt = function (xPage) {
        if (!boatTop) return Infinity;
        const bw = boatEl.offsetWidth || 190, bh = boatEl.offsetHeight || 95;
        const lx = Math.floor(xPage - (boatCX - bw / 2 + swayX));
        if (lx < 0 || lx >= boatTop.length) return Infinity;
        return boatTop[lx] + boatCY - bh / 2 + swayY;
    };
    window.boatSway = { x: 0, y: 0 }; // 船目前晃動的位移（落在船上融化的雪會跟著船動）

    // ===== 色球（魚）資料 =====
    // 轉向用「多個正弦相加」當作平滑雜訊：每顆魚頻率、相位不同，
    // 是封閉公式，不需要每幀擲亂數，也不會抖動。
    const fish = fishEls.map(function (el) {
        return {
            el: el,
            x: rand(B.l, B.r), y: rand(B.t, B.b),
            h: rand(0, TAU),           // 游動方向
            kick: 0,                   // 擺尾力度 0~1
            f1: rand(0.3, 0.7), p1: rand(0, TAU),
            f2: rand(1.1, 1.9), p2: rand(0, TAU),
            fb: rand(1.6, 2.6), pb: rand(0, TAU),
            flee: 0,                   // 受驚加速剩餘時間
            mode: "swim",              // swim | hooked | held | toss | away（在畫面外等著游回來）
            goal: null, side: "left",  // 游出去（out）／游進來（in）與方向（left | right | bottom）
            recolor: false,            // 這次游出去要不要換色
            sch: null,                 // 正在哪一群裡群游（null = 自己游）
            backAt: 0,                 // 在畫面外待到什麼時候
            splashEnd: true,           // toss 落點要不要濺水花
            // 拋物線動畫用
            ax: 0, ay: 0, bx: 0, by: 0, at: 0, aT: 1, aH: 0,
        };
    });

    // 還沒釣到第一條魚之前，不顯示顏色標題、副標、CMYK、RGB、色號（第一次落進瓶子時才淡入）
    document.body.classList.add("awaiting-catch");

    let held = fish.find((f) => f.el.classList.contains("active")) || null;
    if (held) {
        held.mode = "held";
        held.x = boatCX + CFG.holdSpot.x;
        held.y = boatCY + CFG.holdSpot.y;
        setLineColor(window.getComputedStyle(held.el).backgroundColor);
    } else {
        // 一開始沒有目前的顏色（固定底色）：釣線、瓶子照背景色決定深淺
        // （背景色會花 3 秒漸變過去，要讀「目標」顏色，不能讀漸變中的顏色）
        const sq = document.querySelector(".square");
        setLineColor((sq && sq.style.backgroundColor) || "rgb(76, 76, 76)");
    }

    function setLineColor(bg) {
        const m = (bg || "").match(/\d+/g);
        if (!m) return;
        const brightness = (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000;
        const dark = brightness < 190;
        const root = document.documentElement.style;
        root.setProperty("--fishing-line", dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)");
        // 瓶子：暗背景用淺色邊、白水；亮背景用深色邊、淡藍灰的水，才看得到
        root.setProperty("--glass-edge", dark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.3)");
        // 瓶中的水 = 海的顏色：海是背景色疊兩層 5% 黑的浪（waves.js），等於背景色 × 0.95 × 0.95
        const SEA = 0.95 * 0.95;
        root.setProperty("--sea-color", "rgb(" + Math.round(m[0] * SEA) + "," + Math.round(m[1] * SEA) + "," + Math.round(m[2] * SEA) + ")");
        root.setProperty("--water-line", dark ? "rgba(255, 255, 255, 0.55)" : "rgba(70, 95, 120, 0.4)");
    }

    // ===== 指標輸入 =====
    let px = 0, py = 0;
    let mouseInside = false;
    let touchDown = false, touchUntil = 0;
    let lastPointer = "mouse";
    let clickPending = false, clickTouch = false;
    // 手機震動回饋（Android 才有；iPhone 的瀏覽器不支援，會直接略過）
    function buzz(pattern) {
        if (lastPointer === "mouse" || !navigator.vibrate) return;
        try { navigator.vibrate(pattern); } catch (e) { /* 不支援就略過 */ }
    }
    const nowS = () => performance.now() / 1000;

    // 手機操作（像拉彈弓）：
    //   鉤子在水裡 → 按住拖曳瞄準（鉤子在手指上方），放開 = 提竿
    //   色球／空鉤在空中 → 左右滑動照滑動量移動色球；快速點一下 = 再彈一次
    let touchMode = null;          // "aim" 瞄準 | "steer" 空中操控
    let lastTouchX = 0, touchDownX = 0, touchDownY = 0, touchDownT = 0;
    let touchSteerX = 0;           // 空中時色球要去的 x（由滑動量累加）
    let autoTarget = null, autoT = 0; // 手機點到的色球：魚鉤會自己游過去鉤它
    let autoAim = false;              // 手機：鉤到後自動拋向船（玩家在空中滑動就改成手動）
    const isInAir = () => state === "fly" || state === "land" ||
        ((state === "idle" || state === "cooldown") && airYanks > 0);

    window.addEventListener("pointermove", function (e) {
        if (e.pointerType === "mouse") {
            px = e.clientX; py = e.clientY; lastPointer = "mouse"; mouseInside = true;
            return;
        }
        if (!touchDown || !e.isPrimary) return;
        const dx = e.clientX - lastTouchX;
        lastTouchX = e.clientX;
        px = e.clientX; py = e.clientY;
        touchUntil = nowS() + CFG.touchLinger;
        if (touchMode === "steer" && state === "fly") {
            // 真的滑動了（不是點一下）→ 從自動拋向船改成手動操控
            if (autoAim && Math.abs(e.clientX - touchDownX) > CFG.tapMaxMove) { autoAim = false; touchSteerX = hx; }
            if (!autoAim) touchSteerX = clamp(touchSteerX + dx * CFG.touchSteerGain, 8, vw - 8);
        }
    }, { passive: true });
    window.addEventListener("pointerdown", function (e) {
        if (e.target && e.target.closest && e.target.closest(UI_SELECTOR)) return;
        lastPointer = e.pointerType;
        if (e.pointerType === "mouse") {
            px = e.clientX; py = e.clientY; mouseInside = true;
            clickPending = true; clickTouch = false; // 滑鼠：點一下 = 提竿
            return;
        }
        if (!e.isPrimary) return;
        touchDown = true;
        touchUntil = nowS() + CFG.touchLinger;
        lastTouchX = touchDownX = e.clientX; touchDownY = e.clientY; touchDownT = nowS();
        if (isInAir()) {
            touchMode = "steer";
        } else {
            touchMode = "aim";
            autoTarget = null;      // 重新按下就取消上一個自動目標
            px = e.clientX; py = e.clientY;
        }
    }, { passive: true });
    const touchEnd = function (e) {
        if (e.pointerType === "mouse" || !e.isPrimary || !touchDown) return;
        touchDown = false;
        touchUntil = nowS() + CFG.touchLinger;
        if (e.type === "pointerup") {
            const moved = Math.hypot(e.clientX - touchDownX, e.clientY - touchDownY);
            const quickTap = moved < CFG.tapMaxMove && nowS() - touchDownT < CFG.tapMaxTime;
            if (touchMode === "aim" && !isInAir() && quickTap) {
                // 點一下色球：魚鉤自己游過去鉤；點空的地方：鉤子移到那裡
                autoTarget = fishAt(e.clientX, e.clientY, CFG.tapFishRadius);
                autoT = 0;
            } else if (touchMode === "steer" && quickTap) {
                clickPending = true; clickTouch = true;   // 空中快速點一下 = 再彈一次
            }
        }
        touchMode = null;
    };
    window.addEventListener("pointerup", touchEnd, { passive: true });

    // 電腦操作：按住滑鼠移動時，瀏覽器會把船（圖片）當成要拖走的圖，出現半透明的拖曳圖示；
    // 連點空白處也會反白選到文字。釣魚時都不需要，直接擋掉。
    // （顏色名稱、CMYK、色碼這些文字仍然可以選取複製；連結、按鈕照常可以點）
    document.addEventListener("dragstart", function (e) { e.preventDefault(); });
    const SELECTABLE = "p, t, a, input, textarea, " + UI_SELECTOR;
    document.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest(SELECTABLE)) return;
        e.preventDefault(); // 不開始拖曳、不反白選字
    });
    window.addEventListener("pointercancel", touchEnd, { passive: true });
    document.addEventListener("mouseout", function (e) {
        if (!e.relatedTarget) mouseInside = false; // 滑鼠離開視窗
    });

    function pointerActive(t) {
        return lastPointer === "mouse" ? mouseInside : (touchDown || t < touchUntil);
    }

    // ===== 魚鉤與釣線狀態 =====
    let tipX = boatCX + CFG.rodTip.x, tipY = boatCY + CFG.rodTip.y;
    let hx = tipX + 6, hy = tipY + 70, hvx = 0, hvy = 0;   // 魚鉤位置與速度（頁面座標）
    let rope = 70;                                          // 目前放出的線長
    let yankT = 0;                                          // 空鉤彈起剩餘時間
    let hookAng = 0;                                        // 魚鉤目前的旋轉角 (rad)
    // 彎鉤（色球掛的位置）在魚鉤本地座標約 (-3.5, 8)，要跟著魚鉤一起旋轉，
    // 否則線往上甩、魚鉤翻過來時，色球會跟鉤子分開
    const BEND_X = -3.5, BEND_Y = 8;
    const bendDX = () => Math.cos(hookAng) * BEND_X - Math.sin(hookAng) * BEND_Y;
    const bendDY = () => Math.sin(hookAng) * BEND_X + Math.cos(hookAng) * BEND_Y;
    let waterTilt = 0;                                      // 瓶中水面傾斜
    let waterRipple = 0;                                    // 瓶中水面波動強度（色球落入時變大）
    let airYanks = 0;
    let flyRose = false;                                    // 這次甩竿色球是否已經升到甲板以上                                       // 這次出水已經彈了幾次
    let recoverT = 0;                                       // 慢慢回到游標的剩餘時間

    // 釣線 = 一串質點（Verlet 繩索）。第 0 點釘在竿尖，最後一點釘在魚鉤。
    // 每點只記「現在位置」和「上一幀位置」，速度 = 兩者相減，不用另存。
    const RN = CFG.ropeSegments;
    const rx = new Float32Array(RN + 1), ry = new Float32Array(RN + 1);
    const rpx = new Float32Array(RN + 1), rpy = new Float32Array(RN + 1);
    for (let i = 0; i <= RN; i++) {
        const p = i / RN;
        rx[i] = rpx[i] = tipX + (hx - tipX) * p;
        ry[i] = rpy[i] = tipY + (hy - tipY) * p;
    }

    let state = "idle";  // idle | fly | land | cooldown
    let st = 0;          // 進入目前狀態後經過的時間
    let caught = null;
    const setState = (s) => { state = s; st = 0; };

    // ===== 色球動作 =====
    function swim(f, t, dt) {
        // 群游中的隊員：跟著帶頭的魚游（見下方「群游」）
        if (f.sch && f.sch.leader !== f) { followSwim(f, f.sch, t, dt); return; }
        let turn;
        if (f.sch) {
            // 帶頭的魚：有目的地游——挑一個前方的目標點，平順地轉過去；到了（或太久）再挑下一個
            const s = f.sch;
            if (!s.tgt || Math.hypot(s.tgt.x - f.x, s.tgt.y - f.y) < 50 || t > s.tgtUntil) pickTarget(s, f, t);
            turn = angleDiff(Math.atan2(s.tgt.y - f.y, s.tgt.x - f.x), f.h) * 1.1;
            turn += 0.2 * Math.sin(t * f.f1 + f.p1);  // 一點點自然的擺動
        } else {
            turn = 0.9 * Math.sin(t * f.f1 + f.p1) + 0.55 * Math.sin(t * f.f2 + f.p2);
            turn -= 0.45 * Math.sin(2 * f.h);       // 偏好水平游（h=0 或 π 是穩定點）
        }

        // 靠近邊界就轉向內側
        const m = 60;
        let wx = 0, wy = 0;
        const fromBottom = f.goal && f.side === "bottom";      // 往下游出去／從下面游上來
        if (f.goal) {
            // 要游出畫面（out）或剛游進來（in）：朝目標方向游，那個方向不受邊界限制
            const aim = f.goal === "out" ? SIDE_ANGLE[f.side] : IN_ANGLE[f.side];
            turn += angleDiff(aim, f.h) * 1.6;
            if (!fromBottom) { if (f.y < B.t + m * 0.5) wy = 1; else if (f.y > B.b - m * 0.5) wy = -1; }
            else if (f.y < B.t + m * 0.5) wy = 1;
        } else if (f.sch) {
            // 帶頭的魚：左右和下面不會被邊界擋住（可以游出畫面再轉回來），只有海面擋著
            if (f.y < B.t + m * 0.5) wy = 1;
        } else {
            if (f.x < B.l + m) wx = 1; else if (f.x > B.r - m) wx = -1;
            if (f.y < B.t + m * 0.5) wy = 1; else if (f.y > B.b - m * 0.5) wy = -1;
        }
        if (wx || wy) turn += angleDiff(Math.atan2(wy, wx), f.h) * 2.2;
        f.h += turn * dt;

        // 擺尾：sin^4 讓速度一陣一陣的，像魚在「划一下、滑一段」
        const s = Math.max(0, Math.sin(t * f.fb + f.pb));
        f.kick = s * s * s * s;
        let speed = CFG.fishSpeed * (0.45 + 1.5 * f.kick) * (f.sch ? CFG.schoolSpeed : 1);
        if (f.flee > 0) { f.flee -= dt; speed += 120 * f.flee; f.kick = Math.max(f.kick, f.flee); }
        f.x += Math.cos(f.h) * speed * dt;
        f.y += Math.sin(f.h) * speed * dt;
        if (f.sch) clampSchool(f);
        else {
            if (!f.goal) f.x = clamp(f.x, B.l, B.r);
            f.y = fromBottom ? Math.max(B.t, f.y) : clamp(f.y, B.t, B.b);
        }

        if (f.goal === "out" && (f.x < -30 || f.x > vw + 30 || f.y > vh + 30)) {
            leaveScreen(f, t);
        } else if (f.goal === "in" && (f.side === "bottom" ? f.y < B.b - 30 : f.x > B.l + 40 && f.x < B.r - 40)) {
            f.goal = null;                                      // 進到畫面裡，恢復平常游動
        }
    }

    // ===== 游出畫面／游回來 =====
    // side：left | right | bottom。游出去朝 SIDE_ANGLE 的方向，從那一邊游進來朝 IN_ANGLE 的方向
    const SIDE_ANGLE = { left: Math.PI, right: 0, bottom: Math.PI / 2 };
    const IN_ANGLE = { left: 0, right: Math.PI, bottom: -Math.PI / 2 };
    // 往哪一邊游出去：約 1/3 往下，其餘往左右比較近的那一邊（偶爾往遠的那邊）
    // （海面不高，用距離決定的話幾乎都會往下出去）
    function pickExitSide(f) {
        if (Math.random() < 0.33) return "bottom";
        const nearLeft = f.x < (B.l + B.r) / 2;
        return (Math.random() < 0.8) === nearLeft ? "left" : "right";
    }
    function sendOut(f, opts) {
        f.goal = "out";
        f.side = pickExitSide(f);
        f.recolor = !!(opts && opts.recolor);
    }
    // 游出畫面了：要換色的就換色；然後在畫面外待一下
    function leaveScreen(f, t) {
        if (f.recolor) recolor(f);
        f.recolor = false;
        f.goal = null;
        f.mode = "away";
        f.backAt = t + rand(CFG.awayTime[0], CFG.awayTime[1]);
    }
    // 從某一邊游進來
    function enterFrom(f, side) {
        f.mode = "swim";
        f.goal = "in";
        f.side = side;
        if (side === "bottom") {
            f.x = rand(B.l + 60, B.r - 60);
            f.y = vh + 25;
            f.h = -Math.PI / 2 + rand(-0.15, 0.15);
        } else {
            f.x = side === "left" ? -25 : vw + 25;
            f.y = rand(B.t + 25, B.b - 25);
            f.h = (side === "left" ? 0 : Math.PI) + rand(-0.15, 0.15);
        }
    }
    function randomSide() { const r = Math.random(); return r < 0.4 ? "left" : r < 0.8 ? "right" : "bottom"; }

    // 在畫面外的魚：時間到就從隨機一邊游回來
    function updateAway(t) {
        for (const f of fish) {
            if (f.mode === "away" && t >= f.backAt) enterFrom(f, randomSide());
        }
    }

    // 偶爾讓一隻魚自己游出去晃一下
    let nextWander = 0;
    const isFree = (f) => f.mode === "swim" && !f.goal && !f.sch && f !== autoTarget;
    function scheduleWander(t) {
        if (!nextWander) nextWander = t + rand(CFG.wanderEvery[0], CFG.wanderEvery[1]);
        if (t < nextWander) return;
        nextWander = t + rand(CFG.wanderEvery[0], CFG.wanderEvery[1]);
        const outCount = fish.filter((f) => f.goal === "out" || f.mode === "away").length;
        const c = fish.filter(isFree);
        if (c.length && outCount < CFG.maxAway) sendOut(c[Math.floor(Math.random() * c.length)]);
    }

    // ===== 群游 =====
    // 偶爾有一隻魚當帶頭的，附近幾隻跟上來組成一群：
    //   - 隊員各自有一個「位置」（帶頭魚的後方、左右散開），離位置遠就加速游過去，近了就跟著帶頭魚的方向
    //   - 方向用帶頭魚「幾分之一秒前」的方向 → 每隻轉彎有一點點時差，一波一波跟上
    //   - 擺尾節奏跟帶頭魚對齊（也帶一點時差），再加一點各自的小擺動，不會整齊得像機器
    //   - 游的途中偶爾會拉到附近的新隊員，偶爾有隊員脫隊；時間到了就各自散開
    const schools = [];
    let nextSchool = 0;    function joinSchool(g, s) {
        g.sch = s;
        s.members.push(g);
        assignSlot(g, s, s.members.length - 1);
    }
    // 隊員的擺尾節奏與反應狀態；rank = 第幾個加入（越後面擺尾越晚一點）
    function assignSlot(g, s, rank) {
        const L = s.leader;
        g.fb = L.fb;                                // 擺尾頻率跟帶頭的一樣
        g.pb = L.pb - rank * 0.5 + rand(-0.3, 0.3); // 越後面的擺尾越晚一點
        g.wob = rand(0.01, 0.035);                  // 各自的小擺動幅度（很小：整群方向才整齊）
        g.reactAt = 0;
        g.lane = rand(-CFG.flockWidth, CFG.flockWidth); // 在帶子裡偏左或偏右多少                              // 正在反應中：什麼時候轉
        g.bS = -1; g.bD = 0.2; g.bStr = 0; g.bCool = 0; // 衝刺（擺尾一下）的開始時間、長度、力道、冷卻
    }
    function leaveSchool(g, scatter) {
        const s = g.sch;
        if (!s) return;
        g.sch = null;
        s.members = s.members.filter((m) => m !== g);
        if (scatter) { g.h += (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.2); g.flee = 0.25; } // 轉個彎游走
        // 離開隊伍時如果在畫面外，就自己游回來（不會突然跳回畫面裡）
        if (g.mode === "swim" && !g.goal && (g.x < B.l || g.x > B.r || g.y > B.b)) {
            g.goal = "in";
            g.side = g.y > B.b ? "bottom" : g.x < B.l ? "left" : "right";
        }
    }
    function disband(s) {
        s.members.slice().forEach((g) => leaveSchool(g, g !== s.leader));
        s.members = [];
    }
    function nearestFree(x, y, r, n) {
        return fish.filter(isFree)
            .map((g) => [g, Math.hypot(g.x - x, g.y - y)])
            .filter((p) => p[1] < r)
            .sort((a, b) => a[1] - b[1])
            .slice(0, n)
            .map((p) => p[0]);
    }
    const schooledCount = () => fish.filter((g) => g.sch).length;
    const schoolRoom = () => Math.floor(fish.length * CFG.schoolShare) - schooledCount(); // 還能再拉幾隻進群
    function formSchool(t) {
        const free = fish.filter(isFree);
        if (schoolRoom() < 3) return;
        for (let tries = 0; tries < 4 && free.length >= 2; tries++) {
            const L = free[Math.floor(Math.random() * free.length)];
            const size = Math.min(schoolRoom(), Math.round(rand(CFG.schoolSize[0], CFG.schoolSize[1])));
            const mates = nearestFree(L.x, L.y, CFG.schoolRecruit * 1.5, size).filter((g) => g !== L).slice(0, size - 1);
            if (!mates.length) continue;
            const s = { leader: L, members: [L], end: t + rand(CFG.schoolLife[0], CFG.schoolLife[1]), nextRecruit: t + rand(2, 5),
                        tgt: null, tgtUntil: 0, nextLeader: t + rand(CFG.leaderSwap[0], CFG.leaderSwap[1]) };
            L.sch = s;
            mates.forEach((g) => joinSchool(g, s));
            schools.push(s);
            return;
        }
    }
    // 帶頭魚的下一個目標點：大多是「橫越海面」——在左半邊就游到右側、在右半邊就游到左側，
    // 整群做長距離的左右移動；偶爾（CFG.crossChance 以外）挑一個附近前方的點，路線才不會太單調。
    // 到了另一側要折返時，轉向有上限，會畫一個圓弧掉頭，不會原地急轉。
    function pickTarget(s, L, t) {
        const m = 70, W = B.r - B.l;
        // 目標離上下邊緣遠一點：整群（帶子有寬度）才不會被擠扁在海底或海面
        const yLo = B.t + Math.min(45, (B.b - B.t) * 0.25), yHi = B.b - Math.min(55, (B.b - B.t) * 0.3);
        const y = rand(yLo, Math.max(yLo, yHi));
        if (Math.random() < CFG.crossChance) {
            const goRight = L.x < (B.l + B.r) / 2;
            // 目標有時在畫面外：整群會游出邊界、轉個彎再回來（不會撞到邊就停）
            const o = CFG.schoolOvershoot;
            const x = Math.random() < 0.6
                ? (goRight ? B.r + rand(o * 0.3, o * 0.8) : B.l - rand(o * 0.3, o * 0.8))
                : (goRight ? rand(B.r - m - W * 0.12, B.r - m) : rand(B.l + m, B.l + m + W * 0.12));
            s.tgt = { x: x, y: y };
        } else {
            let best = null, bestScore = Infinity;
            for (let i = 0; i < 10; i++) {
                const x = rand(B.l + m, B.r - m), yy = rand(yLo, Math.max(yLo, yHi));
                if (Math.hypot(x - L.x, yy - L.y) < 180) continue;
                const score = Math.abs(angleDiff(Math.atan2(yy - L.y, x - L.x), L.h)) + rand(0, 0.6);
                if (score < bestScore) { bestScore = score; best = { x: x, y: yy }; }
            }
            s.tgt = best || { x: (B.l + B.r) / 2, y: y };
        }
        // 最久花多少時間到目標（橫越整個畫面要比較久）
        s.tgtUntil = t + 8 + Math.hypot(s.tgt.x - L.x, s.tgt.y - L.y) / (CFG.fishSpeed * CFG.schoolSpeed * 0.8);
    }
    // 換帶頭：通常是游在最前面的那隻接手（像是超車），原本帶頭的退到隊伍裡
    function swapLeader(s) {
        const L = s.leader, c = Math.cos(L.h), sn = Math.sin(L.h);
        let best = null, bestAhead = -Infinity;
        for (const g of s.members) {
            if (g === L) continue;
            const ahead = (g.x - L.x) * c + (g.y - L.y) * sn + rand(0, 25);
            if (ahead > bestAhead) { bestAhead = ahead; best = g; }
        }
        if (!best) return;
        const i = s.members.indexOf(best), j = s.members.indexOf(L);
        s.members[i] = L; s.members[j] = best;      // 交換順序：新帶頭排第一
        s.leader = best;
        assignSlot(L, s, Math.max(1, i));
        // 新帶頭沿用同一個目標，隊伍方向不會突然改變
    }
    function updateSchools(t, dt) {
        if (!nextSchool) nextSchool = t + rand(3, 8);
        if (t >= nextSchool) {
            nextSchool = t + rand(CFG.schoolEvery[0], CFG.schoolEvery[1]);
            if (schools.length < CFG.schoolMax) formSchool(t);
        }
        for (let i = schools.length - 1; i >= 0; i--) {
            const s = schools[i];
            // 被釣走、要游出去的就不算隊員了
            s.members.slice().forEach((g) => { if (g.sch !== s || g.mode !== "swim" || g.goal) leaveSchool(g, false); });
            if (!s.members.includes(s.leader) && s.members.length >= 2) {
                // 帶頭的離開了：由最早加入的隊員接手
                s.leader = s.members[0];
            }
            if (s.members.length < 2 || !s.members.includes(s.leader) || t > s.end) {
                disband(s); schools.splice(i, 1); continue;
            }
            // 偶爾拉到附近的新隊員
            if (t >= s.nextRecruit) {
                s.nextRecruit = t + rand(0.8, 2.5);
                if (s.members.length < CFG.schoolSize[1] && schoolRoom() > 0 && Math.random() < 0.7) {
                    const g = nearestFree(s.leader.x, s.leader.y, CFG.schoolRecruit, 1)[0];
                    if (g) joinSchool(g, s);
                }
            }
            // 偶爾換一隻魚帶頭
            if (t >= s.nextLeader) {
                s.nextLeader = t + rand(CFG.leaderSwap[0], CFG.leaderSwap[1]);
                swapLeader(s);
            }
            // 偶爾有隊員脫隊
            s.members.slice().forEach((g) => {
                if (g !== s.leader && Math.random() < dt / CFG.schoolLeaveEvery) leaveSchool(g, true);
            });
        }
    }
    // 衝刺一下（快速擺尾）：短短 0.2 秒左右的加速＋急轉，之後滑行；有冷卻，不會連續衝
    function startBurst(f, t, strength) {
        if (t < f.bCool) return;
        f.bS = t;
        f.bD = rand(0.16, 0.28);
        f.bStr = strength;
        f.bCool = t + f.bD + rand(0.15, 0.35);
    }
    // 隊員的游法：群聚（像真的魚群）——每隻只看身邊的隊友：
    //   對齊：跟附近隊友的方向一致（帶頭魚的份量比較重）
    //   聚攏：往附近隊友的中心靠
    //   分開：太近就推開，不疊在一起
    //   跟隨：離帶頭魚太遠就往牠游
    // 所以整群會像一條流動的帶子：轉彎時拉長、變形，再慢慢收攏。
    // 方向差太多時：短暫反應（reactTime）→ 擺尾急轉；落後太多就衝一下追上，其餘時間滑行微調。
    function followSwim(f, s, t, dt) {
        const L = s.leader;
        let ax = 0, ay = 0, cx = 0, cy = 0, n = 0, sx = 0, sy = 0;
        const R = CFG.flockRadius, gap = CFG.flockSpacing;
        for (const g of s.members) {
            if (g === f) continue;
            const ex = g.x - f.x, ey = g.y - f.y, d = Math.hypot(ex, ey);
            if (d > R) continue;
            const wgt = g === L ? 3 : 1;
            ax += Math.cos(g.h) * wgt; ay += Math.sin(g.h) * wgt;
            cx += g.x * wgt; cy += g.y * wgt; n += wgt;
            if (d < gap && d > 0.01) { sx -= ex / d * (gap - d) / gap; sy -= ey / d * (gap - d) / gap; }
        }
        let vx = 0, vy = 0;
        if (n) {
            const al = Math.hypot(ax, ay) || 1;
            vx += ax / al * CFG.flockAlign; vy += ay / al * CFG.flockAlign;
            cx /= n; cy /= n;
            const cdx = cx - f.x, cdy = cy - f.y, cd = Math.hypot(cdx, cdy) || 1;
            const coh = CFG.flockCohesion * clamp(cd / 50, 0, 1);
            vx += cdx / cd * coh; vy += cdy / cd * coh;
        }
        vx += sx * CFG.flockSeparate; vy += sy * CFG.flockSeparate;
        // 跟隨：往帶頭魚後方「自己那一段」靠（越晚加入的越後面、左右各偏一點）→ 整群沿著游的方向拉長成一條帶子
        const idx = Math.max(1, s.members.indexOf(f));
        const back = 18 + idx * CFG.flockStretch;
        const c = Math.cos(L.h), sn = Math.sin(L.h);
        const bx = L.x - c * back - sn * f.lane, by = L.y - sn * back + c * f.lane;
        const lx = bx - f.x, ly = by - f.y, ld = Math.hypot(lx, ly) || 1;
        const pull = clamp((ld - 25) / 100, 0, 1.5);
        vx += lx / ld * pull + Math.cos(L.h) * 0.4;
        vy += ly / ld * pull + Math.sin(L.h) * 0.4;

        const want = Math.atan2(vy, vx) + f.wob * Math.sin(t * f.f2 + f.p2);
        const diff = angleDiff(want, f.h);
        // 反應：方向差太多 → 等一下下 → 急轉
        if (!f.reactAt && Math.abs(diff) > CFG.reactAngle && t >= f.bCool) f.reactAt = t + rand(CFG.reactTime[0], CFG.reactTime[1]);
        if (f.reactAt && t >= f.reactAt) { f.reactAt = 0; startBurst(f, t, 0.7); }
        if (ld > CFG.followSnap * 3) startBurst(f, t, 1.2);   // 離自己那一段太遠：衝一下追上
        const bp = t - f.bS;
        const b = bp >= 0 && bp < f.bD ? Math.sin(Math.PI * bp / f.bD) : 0; // 衝刺力道曲線 0→1→0
        f.h += diff * Math.min(1, CFG.followTurn * (b > 0 ? 1.6 : 0.6) * dt);

        // 速度：平常滑行（照擺尾節奏），在帶頭魚後面太遠就快一點，衝刺時再加速
        const k = Math.max(0, Math.sin(t * f.fb + f.pb));
        const glide = k * k * k * k;
        f.kick = Math.max(glide * 0.8, b * f.bStr);  // 衝刺時身體也會拉長
        const ahead = lx * Math.cos(f.h) + ly * Math.sin(f.h);
        let speed = CFG.fishSpeed * CFG.schoolSpeed * (0.55 + 1.1 * glide) * clamp(1 + ahead / (CFG.followChase * 4), 0.7, 1.5);
        speed += CFG.fishSpeed * CFG.schoolSpeed * CFG.burstBoost * b * f.bStr;
        if (f.flee > 0) { f.flee -= dt; speed += 120 * f.flee; }
        f.x += Math.cos(f.h) * speed * dt;
        f.y += Math.sin(f.h) * speed * dt;
        clampSchool(f);
    }
    // 群游中的魚可以超出畫面左右與下方（最多 CFG.schoolOvershoot），只有海面擋著
    function clampSchool(f) {
        const o = CFG.schoolOvershoot;
        f.x = clamp(f.x, B.l - o, B.r + o);
        f.y = clamp(f.y, B.t, B.b);   // 往下不超出：魚才不會沉到畫面下面看不見（左右可以超出）
    }

    // ===== 色球游出去換色 =====
    const FAMILY_MAPS = {
        yellow: typeof yellowButtonTextMap !== "undefined" ? yellowButtonTextMap : null,
        orange: typeof orangeButtonTextMap !== "undefined" ? orangeButtonTextMap : null,
        red:    typeof redButtonTextMap    !== "undefined" ? redButtonTextMap    : null,
        purple: typeof purpleButtonTextMap !== "undefined" ? purpleButtonTextMap : null,
        blue:   typeof blueButtonTextMap   !== "undefined" ? blueButtonTextMap   : null,
        green:  typeof greenButtonTextMap  !== "undefined" ? greenButtonTextMap  : null,
    };
    const isTheme = (f) => (f.el.dataset.color || "").indexOf("theme") === 0; // 主題色永遠不換
    function recolor(f) {
        const m = (f.el.dataset.color || "").match(/^([a-zA-Z]+)(\d+)$/);
        if (!m || !FAMILY_MAPS[m[1]]) return;
        const fam = m[1], map = FAMILY_MAPS[fam];
        const onScreen = new Set(fish.map((g) => g.el.dataset.color));
        const choices = Object.keys(map).filter((k) => !onScreen.has(fam + k));
        if (!choices.length) return;
        const k = choices[Math.floor(Math.random() * choices.length)];
        f.el.dataset.color = fam + k;
        f.el.style.backgroundColor = map[k].hexText;
    }
    let nextSwap = 0;
    function scheduleSwap(t) {
        if (!nextSwap) { nextSwap = t + rand(CFG.swapEvery[0], CFG.swapEvery[1]); return; }
        if (t < nextSwap) return;
        if (fish.some((f) => f.recolor)) return;                // 一次只換一顆
        const candidates = fish.filter((f) => isFree(f) && !isTheme(f));
        if (candidates.length) {
            // 往比較近的那一邊（左、右或下面）游出去，換色後再從隨機一邊游回來
            sendOut(candidates[Math.floor(Math.random() * candidates.length)], { recolor: true });
        }
        nextSwap = t + rand(CFG.swapEvery[0], CFG.swapEvery[1]);
    }

    function startArc(f, toX, toY, T, H) {
        f.ax = f.x; f.ay = f.y; f.bx = toX; f.by = toY; f.at = 0; f.aT = T; f.aH = H;
    }
    function stepArc(f, dt) {
        f.at += dt;
        const p = Math.min(1, f.at / f.aT);
        f.x = f.ax + (f.bx - f.ax) * p;
        f.y = f.ay + (f.by - f.ay) * p - arc(p, f.aH);
        return p >= 1;
    }

    function tossBack(f) {
        // 船上原本的顏色丟回水裡：往空間比較大的那一側拋
        const side = boatCX < vw / 2 ? 1 : -1;
        const dir = Math.random() < 0.7 ? side : -side;
        const tx = clamp(f.x + dir * rand(120, 260), B.l + 20, B.r - 20);
        const ty = clamp(B.t + rand(40, 120), B.t, B.b);
        f.mode = "toss";
        f.splashEnd = true;
        f.el.classList.remove("active");
        startArc(f, tx, ty, 0.8, 70);
        f.h = dir > 0 ? 0 : Math.PI;
    }

    function dropBack(f) {
        // 沒掉進船：色球掉回水裡、沉下去後游走
        f.mode = "toss";
        f.splashEnd = false;
        startArc(f, clamp(f.x, B.l, B.r), clamp(B.t + rand(20, 60), B.t, B.b), 0.45, 0);
        f.h = rand(0, TAU);
    }

    // 提竿時鉤子底下（或手機點的位置）有沒有色球
    function fishAt(x, y, r) {
        let best = null, bd = r;
        for (let i = 0; i < fish.length; i++) {
            const f = fish[i];
            if (f.mode !== "swim") continue;
            const d = Math.hypot(x - swayX - f.x, y - swayY - f.y);
            if (d < bd) { bd = d; best = f; }
        }
        return best;
    }

    // 手機：算出拋向船的水平速度。
    // 色球落到甲板高度的時間 t：y + vy·t + ½g·t² = 甲板 → t = (−vy + √(vy² + 2g·(甲板 − y))) / g
    // 水平速度 = (瓶子的 x − 色球的 x) / t，剛好在落到甲板時到達瓶子上方
    function aimAtBoat() {
        const g = CFG.flyGravity;
        const fishX = hx + bendDX(), fishY = hy + bendDY();
        const deck = boatCY + CFG.holdSpot.y + swayY;
        const disc = hvy * hvy + 2 * g * (deck - fishY);
        if (disc <= 0) return;
        const t = (-hvy + Math.sqrt(disc)) / g;
        if (t <= 0.05) return;
        const targetX = boatCX + CFG.holdSpot.x + swayX;
        hvx = (targetX - fishX) / t;
    }

    function drawFish(f, rot, sx, sy) {
        f.el.style.transform =
            "translate3d(" + (f.x - originX - fishR).toFixed(1) + "px," +
            (f.y - originY - fishR).toFixed(1) + "px,0) rotate(" +
            rot.toFixed(3) + "rad) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
    }

    // ===== 主迴圈 =====
    let last = performance.now();
    const phX = rand(0, TAU), phY = rand(0, TAU);

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = now / 1000;
        st += dt;

        // --- 船晃動（原本 boatanimation.js 的公式，改用時間計算） ---
        swayX = CFG.swayAmpX * Math.sin(t * CFG.swayOmega + phX);
        swayY = CFG.swayAmpY * Math.cos(t * CFG.swayOmega + phY);
        window.boatSway.x = swayX; window.boatSway.y = swayY;
        const swayT = "translate3d(" + swayX.toFixed(2) + "px," + swayY.toFixed(2) + "px,0)";
        for (let i = 0; i < swayEls.length; i++) swayEls[i].style.transform = swayT;

        tipX = boatCX + CFG.rodTip.x + swayX;
        tipY = boatCY + CFG.rodTip.y + swayY;
        const holdX = boatCX + CFG.holdSpot.x, holdY = boatCY + CFG.holdSpot.y; // 基準座標
        const deckY = holdY + swayY;                                             // 頁面座標
        const waterTop = tipY + 18;
        const active = pointerActive(t);

        // --- 提竿 ---
        // 鉤子回到水裡就重新計算彈跳次數
        if ((state === "idle" || state === "cooldown") && yankT <= 0 && hy > waterTop) airYanks = 0;

        if (clickPending) {
            clickPending = false;
            if (state === "fly") {
                // 色球在空中：再點一下往上再彈一次（設定速度、不疊加，才不會越彈越高）
                if (airYanks < CFG.maxYanks) {
                    airYanks++;
                    hvy = Math.min(hvy, -Math.sqrt(2 * CFG.flyGravity * CFG.flyReboost));
                    if (autoAim) aimAtBoat(); // 彈高了，重新算一次水平速度，還是落進船裡
                }
            } else if ((state === "idle" || state === "cooldown") && airYanks > 0) {
                // 空鉤還在空中：再彈一次
                if (airYanks < CFG.maxYanks) {
                    airYanks++;
                    hvy = Math.min(hvy, -CFG.reYankImpulse);
                    yankT = 0.4;
                    recoverT = 0;
                }
            } else if (state === "idle" || state === "cooldown") {
                // 鉤子的彎鉤在綁線點下方約 7px
                const f = fishAt(hx + bendDX(), hy + bendDY(), clickTouch ? CFG.touchCatchRadius : CFG.catchRadius);
                if (f) {
                    // 鉤到了：初速 v = √(2gh)，剛好甩到竿尖上方 flyApex 的高度
                    const h = Math.max(120, hy - (tipY - CFG.flyApex));
                    hvy = -Math.sqrt(2 * CFG.flyGravity * h);
                    hvx *= 0.3;
                    yankT = 0;
                    recoverT = 0;
                    airYanks = 1;
                    caught = f;
                    f.goal = null;          // 正在游出去／游進來的被釣到了，就不換色了
                    f.recolor = false;
                    leaveSchool(f, false);  // 也離開群游的隊伍
                    flyRose = false;
                    touchSteerX = hx;       // 手機：空中從目前位置開始滑動操控
                    autoAim = clickTouch;   // 手機：自動拋向船
                    if (autoAim) aimAtBoat();
                    buzz(15);               // 手機震動：鉤到了
                    if (window.sfx) window.sfx.play("catch"); // 釣起來的音效（sfx.js）
                    f.mode = "hooked";
                    splash(hx + bendDX(), hy + bendDY());
                    setState("fly");
                } else {
                    // 空鉤：照樣往上（略往竿尖）彈，附近的魚被嚇跑
                    hvy = Math.min(hvy, 0) - CFG.yankImpulse;
                    hvx += (tipX - hx) * 0.6;
                    yankT = 0.5; // 約等於彈到最高點的時間
                    recoverT = 0;
                    airYanks = 1;
                    for (let i = 0; i < fish.length; i++) {
                        const g = fish[i];
                        if (g.mode !== "swim") continue;
                        const ddx = g.x - (hx - swayX), ddy = g.y - (hy - swayY);
                        if (ddx * ddx + ddy * ddy < 80 * 80) { g.h = Math.atan2(ddy, ddx); g.flee = 0.5; }
                    }
                }
            }
        }

        // --- 魚鉤 ---
        if (state === "fly") {
            // 垂直：拋體運動；水平：玩家控制（臨界阻尼彈簧追游標 x）
            const steerX = lastPointer === "mouse"
                ? (active ? clamp(px, 8, vw - 8) : hx)
                : touchSteerX;              // 手機：照滑動量移動，手指不必跟著色球
            const w = CFG.steerOmega;
            if (!autoAim) hvx += (w * w * (steerX - hx) - 2 * 0.9 * w * hvx) * dt; // 自動拋向船時，水平速度固定
            hvy += CFG.flyGravity * dt;
            hx += hvx * dt;
            hy += hvy * dt;
            if (hy < CFG.topMargin) { hy = CFG.topMargin; hvy = Math.max(hvy, 0); } // 天花板
            const fishY = hy + bendDY();
            const fishX = hx + bendDX();
            if (fishY < deckY) flyRose = true; // 這一甩已經升到甲板以上

            // 升過甲板、正在往下掉、而且已經到甲板高度：判斷有沒有落在船上。
            // （不能只抓「剛好穿過」的那一幀：彎鉤位置會隨鉤子旋轉跳動，
            //   可能直接跳過那一幀，色球就會一直往下掉。）
            // 保險：萬一掉出畫面還沒判定，也當作沒釣到。
            if ((flyRose && hvy > 0 && fishY >= deckY) || fishY > vh + 40) {
                const boatX = boatCX + CFG.boatCatch.x + swayX;
                caught.x = fishX - swayX; caught.y = fishY - swayY;
                const half = CFG.boatCatch.halfWidth + (lastPointer === "mouse" ? 0 : CFG.touchBoatBonus);
                if (flyRose && Math.abs(fishX - boatX) < half) {
                    // 成功：輕輕彈一下落到船上的位置
                    // 先拋到瓶口上方再落進瓶子
                    startArc(caught, holdX, holdY, 0.4, 34);
                    setState("land");
                } else {
                    // 失敗：掉回水裡
                    splash(fishX, fishY);
                    dropBack(caught);
                    caught = null;
                    hvy *= 0.3; // 入水減速
                    recoverT = CFG.recoverTime;
                    setState("cooldown");
                }
            }
        } else if (state === "land") {
            // 魚鉤跟著色球落進船
            const done = stepArc(caught, dt);
            hx = caught.x + swayX - bendDX(); hy = caught.y + swayY - bendDY();
            hvx = 0; hvy = 0;
            if (done) {
                const prev = held;
                held = caught;
                held.mode = "held";
                caught = null;
                held.el.click();     // 觸發原本的換色流程（背景、文字、船燈）
                // 顏色資訊淡入：第一次釣到時從隱藏變成顯示，之後每次換色也重新淡入
                document.body.classList.remove("awaiting-catch", "color-info-reveal");
                void document.body.offsetWidth; // 讓淡入動畫重新開始
                document.body.classList.add("color-info-reveal");
                setLineColor(window.getComputedStyle(held.el).backgroundColor);
                if (prev && prev !== held) tossBack(prev);
                waterRipple = 1;     // 落進瓶子：水面晃一下
                buzz([20, 40, 20]);  // 手機震動：落進船裡
                recoverT = CFG.recoverTime;
                setState("cooldown");
            }
        } else if (yankT > 0) {
            // 空鉤彈起中：暫時不受游標牽引，只有阻力和重力，鉤子才彈得高
            yankT -= dt;
            const k = Math.exp(-3 * dt);
            hvx *= k;
            hvy = hvy * k + 1100 * dt;
            hx += hvx * dt;
            hy += hvy * dt;
            if (hy < CFG.topMargin) { hy = CFG.topMargin; hvy = Math.max(hvy, 0); } // 天花板
            if (yankT <= 0) recoverT = CFG.recoverTime; // 彈到頂，接著慢慢回去
        } else {
            let tx, ty;
            if (autoTarget && autoTarget.mode !== "swim") autoTarget = null; // 目標被別人拿走了
            if (autoTarget) {
                // 手機：魚鉤自己游向點到的色球（色球在游，就一路跟著）
                tx = autoTarget.x + swayX - bendDX();
                ty = autoTarget.y + swayY - bendDY();
            } else if (active) {
                tx = clamp(px, 8, vw - 8);
                // 手機拖曳時：鉤子停在手指上方，手指才不會擋住
                ty = clamp(py - (lastPointer !== "mouse" && touchDown ? CFG.touchHookLift : 0), waterTop, vh - 12);
            } else {
                // 沒人操作：鉤子垂在竿下輕輕晃
                tx = tipX + 6;
                ty = tipY + 70 + 3 * Math.sin(t * 1.3);
            }
            // 阻尼彈簧：a = ω²(目標−位置) − 2ζω·速度
            let w = CFG.hookOmega, z = CFG.hookZeta;
            if (autoTarget) {
                w = CFG.autoOmega; z = 0.9; recoverT = 0;   // 快、不晃，直直游過去
                autoT += dt;
                const d = Math.hypot(hx + bendDX() - (autoTarget.x + swayX), hy + bendDY() - (autoTarget.y + swayY));
                if (d < CFG.touchCatchRadius) {
                    // 追到手機鉤到範圍內 → 鉤子貼上色球、提竿鉤起來
                    // （色球在游，追的鉤子總會落後一點，等到完全重疊可能永遠等不到）
                    hx = autoTarget.x + swayX - bendDX();
                    hy = autoTarget.y + swayY - bendDY();
                    autoTarget = null; clickPending = true; clickTouch = true;
                } else if (autoT > CFG.autoTimeout) {
                    autoTarget = null;                                          // 追不到就算了
                }
            } else if (recoverT > 0) {
                // 彈完的回程：先用很軟、不會過衝的彈簧（ζ=1），
                // 再隨時間（p² 緩入）慢慢變回平常的跟手程度
                recoverT -= dt;
                const p = 1 - Math.max(0, recoverT) / CFG.recoverTime;
                w = CFG.recoverOmega + (CFG.hookOmega - CFG.recoverOmega) * p * p;
                z = 1;
                // 剛開始時也把上一段殘留的速度慢慢吃掉，免得被甩回去
                const k = Math.exp(-2 * dt);
                hvx *= k; hvy *= k;
            }
            hvx += (w * w * (tx - hx) - 2 * z * w * hvx) * dt;
            hvy += (w * w * (ty - hy) - 2 * z * w * hvy) * dt;
            hx += hvx * dt;
            hy += hvy * dt;
        }

        if (state === "cooldown" && st > 0.4) setState("idle");

        // 保險：鉤子永遠留在畫面附近，釣線（虛線點點）才不會無限變長拖慢效能
        if (hx < -60 || hx > vw + 60) { hx = clamp(hx, -60, vw + 60); hvx = 0; }
        if (hy > vh + 60) { hy = vh + 60; hvy = Math.min(hvy, 0); }

        // --- 瓶中的水 ---
        // 水面往船晃動速度的反方向傾斜（慣性），再慢慢跟上；平時有細小波紋，色球落入時波紋變大後平息
        const boatVX = CFG.swayAmpX * CFG.swayOmega * Math.cos(t * CFG.swayOmega + phX);
        waterTilt += (-boatVX * 0.012 - waterTilt) * (1 - Math.exp(-3 * dt));
        waterRipple *= Math.exp(-1.6 * dt);
        {
            const L = CFG.bottle.waterLevel;
            const amp = 0.35 + waterRipple * 2.2;
            const spd = 2.2 + waterRipple * 4;
            let surf = "";
            for (let x = 0; x <= BOTTLE_W + 0.01; x += BOTTLE_W / 15) {
                const y = L + waterTilt * (x - BOTTLE_CX) + amp * Math.sin(x * 0.55 + t * spd);
                surf += (surf ? " L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
            }
            waterLine.setAttribute("d", surf);
            waterBody.setAttribute("d", surf + " L" + BOTTLE_W + "," + BOTTLE_H + " L0," + BOTTLE_H + " Z");
        }

        // --- 色球 ---
        scheduleSwap(t);
        scheduleWander(t);
        updateAway(t);
        updateSchools(t, dt);
        for (let i = 0; i < fish.length; i++) {
            const f = fish[i];
            let rot = f.h, sx = 1, sy = 1;
            switch (f.mode) {
                case "away":
                    continue;           // 在畫面外等著游回來，不用畫
                case "swim":
                    swim(f, t, dt);
                    // 群游中：固定沿著游的方向稍微拉長，不跟著擺尾一伸一縮（不然一抽一抽像蟲）
                    //（加入／離開群時慢慢變形，不會突然跳）
                    f.str = (f.str || 1) + ((f.sch ? CFG.schoolStretch : 1) - (f.str || 1)) * Math.min(1, 1.2 * dt);
                    const inSchool = (f.str - 1) / Math.max(0.001, CFG.schoolStretch - 1); // 0 = 散魚、1 = 群游中
                    const pulse = 1 - clamp(inSchool, 0, 1);                               // 群游時擺尾變形漸漸消失
                    rot = f.h; sx = 1 + 0.18 * f.kick * pulse; sy = 1 - 0.12 * f.kick * pulse;
                    sx *= f.str; sy /= Math.sqrt(f.str);
                    break;
                case "hooked":
                    // 飛行中的位置等這一幀魚鉤角度算好後再放（見下方「魚鉤」之後）
                    if (state === "fly") continue;
                    rot = -Math.PI / 2 + 0.5 * Math.sin(t * 26); // 掛在鉤上掙扎
                    sx = 1.15; sy = 0.9;
                    break;
                case "held":
                    // 在瓶子的水裡輕輕漂浮
                    f.x = holdX + 1.2 * Math.sin(t * 0.8 + 1) + waterTilt * 6;
                    f.y = holdY - 2 + 1.4 * Math.sin(t * 1.6);
                    rot = 0;
                    break;
                case "toss":
                    if (stepArc(f, dt)) {
                        f.mode = "swim";
                        f.flee = 0.5;
                        if (f.splashEnd) splash(f.x + swayX, f.y + swayY);
                    }
                    rot = f.at * 9;
                    break;
            }
            drawFish(f, rot, sx, sy);
        }

        // --- 釣線：Verlet 繩索 ---
        const d = Math.hypot(hx - tipX, hy - tipY);
        // 平常保留一點點鬆弛，線才不會像尺一樣直
        const wantL = d * 1.04 + 10;
        if (state === "fly" || state === "land") {
            rope = d * 1.01 + 2; // 甩竿時線是繃緊的
        } else if (wantL > rope) {
            rope = wantL;        // 鉤子被拉遠就立刻放線
        } else {
            rope += (wantL - rope) * (1 - Math.exp(-0.7 * dt)); // 靠近時慢慢收線，多出來的就是鬆弛
        }
        const seg = rope / RN;

        // 1) 慣性 + 水阻力 + 重力：x新 = x + (x − x舊)·阻力 + g·dt²
        const drag = Math.exp(-CFG.ropeDrag * dt);
        const g = CFG.ropeGravity * dt * dt;
        for (let i = 1; i < RN; i++) {
            const vx = (rx[i] - rpx[i]) * drag, vy = (ry[i] - rpy[i]) * drag;
            rpx[i] = rx[i]; rpy[i] = ry[i];
            rx[i] += vx; ry[i] += vy + g;
        }
        rx[0] = tipX; ry[0] = tipY;   // 兩端釘住
        rx[RN] = hx; ry[RN] = hy;

        // 2) 繩長約束：相鄰兩點距離「超過」一節才拉回（可以變短 = 鬆弛）
        for (let k = 0; k < CFG.ropeIterations; k++) {
            for (let i = 0; i < RN; i++) {
                const ex = rx[i + 1] - rx[i], ey = ry[i + 1] - ry[i];
                const dist = Math.sqrt(ex * ex + ey * ey);
                if (dist <= seg || dist === 0) continue;
                const wa = i === 0 ? 0 : 1, wb = i + 1 === RN ? 0 : 1; // 釘住的端點不動
                if (wa + wb === 0) continue;
                const corr = (dist - seg) / dist / (wa + wb);
                rx[i] += ex * corr * wa; ry[i] += ey * corr * wa;
                rx[i + 1] -= ex * corr * wb; ry[i + 1] -= ey * corr * wb;
            }
        }

        // 3) 畫成平滑曲線：以每個質點當控制點、相鄰中點當端點串二次貝茲
        let dStr = "M" + rx[0].toFixed(1) + "," + ry[0].toFixed(1);
        for (let i = 1; i < RN; i++) {
            dStr += " Q" + rx[i].toFixed(1) + "," + ry[i].toFixed(1) + " " +
                ((rx[i] + rx[i + 1]) / 2).toFixed(1) + "," + ((ry[i] + ry[i + 1]) / 2).toFixed(1);
        }
        dStr += " L" + hx.toFixed(1) + "," + hy.toFixed(1);
        linePath.setAttribute("d", dStr);
        // 魚鉤沿著最後一節線的方向
        // 平滑轉向：線方向急轉時（例如甩過竿尖上方）鉤子不會瞬間翻面
        const targetAng = Math.atan2(hy - ry[RN - 1], hx - rx[RN - 1]) - Math.PI / 2;
        hookAng += angleDiff(targetAng, hookAng) * (1 - Math.exp(-18 * dt));
        hookAng = Math.atan2(Math.sin(hookAng), Math.cos(hookAng)); // 保持在 ±π，不讓角度一直累加
        const hookAngle = hookAng * 180 / Math.PI;
        hookPath.setAttribute("transform",
            "translate(" + hx.toFixed(1) + "," + hy.toFixed(1) + ") rotate(" + hookAngle.toFixed(1) + ")");
        // 飛行中的色球：用這一幀的魚鉤角度掛在彎鉤上（可以蓋住鉤子）
        if (caught && state === "fly") {
            caught.x = hx + bendDX() - swayX;
            caught.y = hy + bendDY() - swayY;
            drawFish(caught, -Math.PI / 2 + 0.5 * Math.sin(t * 26), 1.15, 0.9);
        }

        // --- 水花 ---
        for (let i = 0; i < splashes.length; i++) {
            const s = splashes[i];
            if (s.t < 0) continue;
            s.t += dt;
            const p = s.t / 0.6;
            if (p >= 1) { s.t = -1; s.el.setAttribute("r", "0"); continue; }
            s.el.setAttribute("cx", s.x.toFixed(1));
            s.el.setAttribute("cy", s.y.toFixed(1));
            s.el.setAttribute("r", (3 + 16 * p).toFixed(1));
            s.el.style.opacity = (0.7 * (1 - p)).toFixed(2);
        }

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
});
