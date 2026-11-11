document.addEventListener("DOMContentLoaded", function () {
    let isRainActive = false; // 初始狀態為雨滴活動

    function createRaindrop() {
        if (isRainActive) {
            const raindrop = document.createElement("div");
            raindrop.classList.add("raindrop");
            raindrop.style.left = `${Math.random() * 100}%`; // 隨機水平位置
            raindrop.style.height = `${2 + Math.random() * 20}px`; // 隨機高度 (2-10px)

            const button = document.querySelector(".active"); // 獲取當前啟用的按鈕
            if (button) {
                const buttonColor = getComputedStyle(button).backgroundColor;
                const brightness = calculateBrightness(buttonColor);
                const saturation = calculateSaturation(buttonColor);

                // 根據明度和彩度更改雨滴的背景顏色
                if (brightness > 100 || saturation > 80) {
                    raindrop.style.background = "rgba(0, 0, 0, 0.2)";
                } else {
                    raindrop.style.background = "rgba(255, 255, 255, 0.2)";
                }
            }

            document.getElementById("rainingcontainer").appendChild(raindrop);

            let topPosition = -10; // 初始位置在容器上方
            const fallSpeed = 9 + Math.random() * 10; // 隨機下落速度 (2-5)

            function fall() {
                topPosition += fallSpeed;
                raindrop.style.top = `${topPosition}px`;

                if (topPosition >= rainingcontainer.clientHeight) {
                    // 雨滴超出容器後移除
                    raindrop.remove();
                } else {
                    requestAnimationFrame(fall);
                }
            }

            // 啟動雨滴下落
            fall();
        }
    }

    // 建立雨滴的時間間隔 (毫秒)
    const raindropInterval = 80; // 每100毫秒建立一個雨滴

    // 定期建立雨滴
    setInterval(createRaindrop, raindropInterval);

    // 計算顏色的明度
    function calculateBrightness(color) {
        const rgb = color.match(/\d+/g);
        if (rgb) {
            return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        }
        return 0;
    }

    // 計算顏色的彩度
    function calculateSaturation(color) {
        const rgb = color.match(/\d+/g);
        if (rgb) {
            const r = parseInt(rgb[0]) / 255;
            const g = parseInt(rgb[1]) / 255;
            const b = parseInt(rgb[2]) / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            return ((max + min) / 2 > 0.5) ? delta / (2 - max - min) : delta / (max + min);
        }
        return 0;
    }

    // 點選 "rainButton" 切換雨滴生成狀態
    document.getElementById("rainButton").addEventListener("click", () => {
        isRainActive = !isRainActive;
    });
});
