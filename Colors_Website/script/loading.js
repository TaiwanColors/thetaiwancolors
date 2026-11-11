/*
 * loading.js — 載入畫面
 *
 * 網頁一打開就顯示 #loading（寫在 index.html 最前面），等整個頁面（圖片、船、字型）載入完成：
 *   - 如果瀏覽器已經允許音樂自動播放 → 直接淡出進入網站
 *   - 否則把「LOADING」換成「確定出航」，訪客點一下（或按任意鍵）就淡出，
 *     同一下點擊也讓音樂開始播放（music.js 會在第一次點擊時播放）——進到網站時就有音樂了。
 *     （瀏覽器規定：訪客沒有互動過之前，網頁不能自動播放有聲音的音樂）
 * 「載入完成」= 頁面載入、所有圖片（含船）下載完、字型就緒、音樂緩衝到可以播放（最多等 AUDIO_WAIT 秒）。
 * 至少顯示 MIN_SHOW 秒，避免一閃而過；萬一載入很久，MAX_WAIT 秒後也會顯示「確定出航」。
 */
(function () {
    "use strict";

    const MIN_SHOW = 0.8;    // 至少顯示幾秒
    const MAX_WAIT = 20;     // 最多等幾秒就讓訪客可以進入（網路很慢時的保險）
    const AUDIO_WAIT = 6;    // 最多等音樂緩衝幾秒（iPhone 在點擊前不會先下載音樂，不能一直等）
    const t0 = performance.now();
    let ready = false, closed = false;

    function close() {
        if (closed) return;
        closed = true;
        const el = document.getElementById("loading");
        if (!el) return;
        el.classList.add("loading-done");
        // 淡出結束後移除，不再佔用畫面與動畫
        el.addEventListener("transitionend", function () { el.remove(); }, { once: true });
        setTimeout(function () { if (el.parentNode) el.remove(); }, 1500);
    }

    // 載入完成：音樂已經在播就直接進入；否則等訪客點一下
    function becomeReady() {
        if (ready) return;
        ready = true;
        const music = window.music;
        if (music && music.isPlaying()) { close(); return; }
        const el = document.getElementById("loading");
        if (!el) return;
        el.classList.add("loading-ready");
        const text = el.querySelector(".loading-text");
        if (text) text.textContent = "確定出航";
        const enter = function () {
            window.removeEventListener("pointerdown", enter, true);
            window.removeEventListener("keydown", enter, true);
            if (window.music) window.music.start(); // 保險：確保音樂在這一下點擊時開始
            close();
        };
        window.addEventListener("pointerdown", enter, true);
        window.addEventListener("keydown", enter, true);
    }

    // 等頁面上所有圖片（包含 load 之後才加進來的船）都下載完
    function waitImages() {
        const pending = Array.from(document.images).filter(function (im) { return !im.complete; });
        return Promise.all(pending.map(function (im) {
            return new Promise(function (r) {
                im.addEventListener("load", r, { once: true });
                im.addEventListener("error", r, { once: true });
            });
        }));
    }
    // 等音樂緩衝到可以播放（最多 AUDIO_WAIT 秒）
    function waitAudio() {
        return new Promise(function (r) {
            const a = window.music && window.music.audio;
            if (!a || a.readyState >= 3) return r();
            a.addEventListener("canplaythrough", r, { once: true });
            a.addEventListener("canplay", r, { once: true });
            setTimeout(r, AUDIO_WAIT * 1000);
        });
    }

    function whenLoaded() {
        // 先讓其他腳本的 load 處理跑完（船的圖是那時候才加進來的），再開始等
        setTimeout(function () {
            const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
            const done = function () {
                const wait = Math.max(0, MIN_SHOW * 1000 - (performance.now() - t0));
                // 多等一點點，讓 music.js 有機會先試著自動播放
                setTimeout(becomeReady, wait + 150);
            };
            Promise.all([fonts.catch(function () {}), waitImages(), waitAudio()]).then(done, done);
        }, 0);
    }

    if (document.readyState === "complete") whenLoaded();
    else window.addEventListener("load", whenLoaded);
    setTimeout(becomeReady, MAX_WAIT * 1000);
})();
