/*
 * music.js — 背景音樂（audio/Lakeside Afternoon.mp3，重複循環）
 *
 * 瀏覽器規定：使用者還沒跟頁面互動前，不能自動播放有聲音的音樂。
 * 所以載入時先試著播放；被擋下的話，就在第一次點擊／觸控／按鍵時開始，並慢慢淡入。
 *
 * 循環：曲子快結束時慢慢淡出，播完後從頭開始、再慢慢淡入。
 * （接點落在無聲的地方，也聽不出 mp3 循環時那一小段停頓）
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const SRC = "audio/Lakeside%20Afternoon.mp3";
    const VOLUME = 0.5;      // 音量（0~1）
    const FADE_IN = 2;       // 開始播放（含每次重新循環）時淡入的秒數
    const FADE_OUT = 4;      // 曲子結束前淡出的秒數

    const audio = new Audio(SRC);
    audio.loop = false;      // 自己控制循環：結束時淡出 → 從頭播放 → 淡入
    audio.preload = "auto";
    audio.volume = 0;

    let playing = false;
    let fadeTimer = 0;
    let fadingOut = false;

    function fadeIn() {
        clearInterval(fadeTimer);
        fadingOut = false;
        const start = performance.now();
        fadeTimer = setInterval(function () {
            const p = Math.min(1, (performance.now() - start) / 1000 / FADE_IN);
            audio.volume = VOLUME * p;
            if (p >= 1) clearInterval(fadeTimer);
        }, 50);
    }

    // 淡出：從開始淡出起算，FADE_OUT 秒內音量一定降到 0。
    // （mp3 的總長度常常估得不準、播放中還會修正，所以不用「剩下幾秒」來算；
    //   實際比估計長的話，最後只是多一小段靜音，不會被突然切斷）
    function fadeOut() {
        clearInterval(fadeTimer);
        fadingOut = true;
        const from = audio.volume;
        const start = performance.now();
        fadeTimer = setInterval(function () {
            const p = Math.min(1, (performance.now() - start) / 1000 / FADE_OUT);
            audio.volume = from * (1 - p);
            if (p >= 1 || audio.paused) clearInterval(fadeTimer);
        }, 50);
    }

    // 播放時大約每 0.25 秒檢查一次，進入最後 FADE_OUT 秒就開始淡出
    audio.addEventListener("timeupdate", function () {
        if (!fadingOut && audio.duration && audio.duration - audio.currentTime <= FADE_OUT) fadeOut();
    });

    // 播完：從頭開始，再淡入
    audio.addEventListener("ended", function () {
        clearInterval(fadeTimer);
        audio.volume = 0;
        audio.currentTime = 0;
        const p = audio.play();
        if (p && p.then) p.then(fadeIn).catch(function () { /* 播放被中斷就算了 */ });
        else fadeIn();
    });

    function tryPlay() {
        if (playing) return;
        const p = audio.play();
        if (p && p.then) {
            p.then(function () {
                playing = true;
                fadeIn();
                removeListeners();
            }).catch(function () { /* 被瀏覽器擋下：等使用者互動 */ });
        }
    }

    const EVENTS = ["pointerdown", "touchstart", "keydown"];
    function removeListeners() {
        EVENTS.forEach(function (ev) { window.removeEventListener(ev, tryPlay, true); });
    }
    EVENTS.forEach(function (ev) { window.addEventListener(ev, tryPlay, { capture: true, passive: true }); });

    // 給載入畫面用：音樂是否已經在播（瀏覽器允許自動播放時，就不用再請訪客點擊）
    window.music = { isPlaying: function () { return playing; }, start: tryPlay, audio: audio };

    tryPlay();
});
