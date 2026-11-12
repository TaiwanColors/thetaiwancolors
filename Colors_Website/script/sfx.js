/*
 * sfx.js — 短音效（目前：釣起來 sfx_catch.wav）
 *
 * 用 Web Audio 播放：先把音效解碼放在記憶體裡，播放時幾乎沒有延遲，
 * 也可以同時重疊播放（連續釣起來不會被切掉）。
 * 音效檔等頁面載入完才下載，不跟圖片、字型搶網路。
 *
 * 用法：window.sfx.play("catch")
 */
(function () {
    "use strict";

    const SOUNDS = {
        catch: { src: "audio/sfx_catch.wav", volume: 0.6 },
    };

    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    const buffers = {};

    function ensureCtx() {
        if (!AC) return null;
        if (!ctx) ctx = new AC();
        if (ctx.state === "suspended") ctx.resume();   // 手機要在點擊時才能啟動聲音
        return ctx;
    }

    function load() {
        Object.keys(SOUNDS).forEach(function (name) {
            fetch(SOUNDS[name].src)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (data) {
                    const c = ensureCtx();
                    if (!c) return;
                    // 舊版 Safari 只支援 callback 寫法
                    return new Promise(function (ok, fail) { c.decodeAudioData(data, ok, fail); });
                })
                .then(function (buf) { if (buf) buffers[name] = buf; })
                .catch(function () { /* 讀不到就不播，不影響網站 */ });
        });
    }

    // 第一次點擊／觸控時啟動聲音（瀏覽器規定），之後就能隨時播放
    function unlock() { ensureCtx(); }
    ["pointerdown", "touchstart", "keydown"].forEach(function (ev) {
        window.addEventListener(ev, unlock, { capture: true, passive: true });
    });

    window.sfx = {
        play: function (name) {
            const c = ensureCtx(), buf = buffers[name], s = SOUNDS[name];
            if (!s) return;
            if (!c || !buf) {
                // 備用：Web Audio 不能用（例如直接雙擊打開 index.html，瀏覽器擋掉讀檔）就用一般的 Audio
                try { const a = new Audio(s.src); a.volume = s.volume; a.play().catch(function () {}); } catch (e) {}
                return;
            }
            const src = c.createBufferSource();
            const gain = c.createGain();
            gain.gain.value = s.volume;
            src.buffer = buf;
            src.connect(gain).connect(c.destination);
            src.start();
        },
    };

    if (document.readyState === "complete") load();
    else window.addEventListener("load", load);
})();
