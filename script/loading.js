/*
 * loading.js — 載入畫面
 *
 * 網頁一打開就顯示 #loading（寫在 index.html 最前面），等整個頁面（圖片、船、字型）載入完成：
 *   - 如果瀏覽器已經允許音樂自動播放 → 直接淡出進入網站
 *   - 否則把「LOADING」換成「確定出航」，訪客點一下（或按任意鍵）就淡出，
 *     同一下點擊也讓音樂開始播放（music.js 會在第一次點擊時播放）——進到網站時就有音樂了。
 *     （瀏覽器規定：訪客沒有互動過之前，網頁不能自動播放有聲音的音樂）
 * 至少顯示 MIN_SHOW 秒，避免一閃而過；萬一載入很久，MAX_WAIT 秒後也會顯示「確定出航」。
 */
(function () {
    "use strict";

    const MIN_SHOW = 0.8;    // 至少顯示幾秒
    const MAX_WAIT = 12;     // 最多等幾秒就讓訪客可以進入
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

    function whenLoaded() {
        const wait = Math.max(0, MIN_SHOW * 1000 - (performance.now() - t0));
        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        // 多等一點點，讓 music.js 有機會先試著自動播放
        const go = function () { setTimeout(becomeReady, wait + 150); };
        fonts.then(go, go);
    }

    if (document.readyState === "complete") whenLoaded();
    else window.addEventListener("load", whenLoaded);
    setTimeout(becomeReady, MAX_WAIT * 1000);
})();
