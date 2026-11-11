/*
 * loading.js — 載入畫面
 *
 * 網頁一打開就顯示 #loading（寫在 index.html 最前面），
 * 等整個頁面（圖片、船、字型）載入完成後淡出；
 * 至少顯示 MIN_SHOW 秒，避免一閃而過；萬一載入很久，MAX_WAIT 秒後也會關掉。
 */
(function () {
    "use strict";

    const MIN_SHOW = 0.8;    // 至少顯示幾秒
    const MAX_WAIT = 12;     // 最多等幾秒
    const t0 = performance.now();
    let closed = false;

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

    function whenReady() {
        const wait = Math.max(0, MIN_SHOW * 1000 - (performance.now() - t0));
        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        fonts.then(function () { setTimeout(close, wait); }, function () { setTimeout(close, wait); });
    }

    if (document.readyState === "complete") whenReady();
    else window.addEventListener("load", whenReady);
    setTimeout(close, MAX_WAIT * 1000);
})();
