document.addEventListener("DOMContentLoaded", function () {
    let isRainActive = false; // 初始狀態為雨滴活動
    let existingRaindrops = []; // 儲存已建立的雨滴元素

    // 按鈕點選事件監聽器
    document.getElementById("rainButton").addEventListener("click", () => {
        isRainActive = !isRainActive; // 切換雨滴狀態

        if (!isRainActive) {
            // 如果雨滴被暫停，停止現有雨滴的動畫
            existingRaindrops.forEach((raindrop) => {
                // 獲取雨滴的當前位置並設定為固定值，使其停止動畫
                const computedStyle = getComputedStyle(raindrop);
                const topPosition = parseFloat(computedStyle.top);
                raindrop.style.top = `${topPosition}px`;
            });
            clearInterval(raindropIntervalId); // 停止新雨滴的生成
        } else {
            // 如果雨滴重新啟用，恢復新雨滴的生成
            raindropIntervalId = setInterval(createRaindropButton, raindropbuttonInterval);
        }
    });

    function createRaindropButton() {
        if (!isRainActive) {
            // 如果雨滴被暫停，不建立新的雨滴
            return;
        }

        const raindropB = document.createElement("div");
        raindropB.classList.add("raindropB"); // 更新類名為 .raindropB
        raindropB.style.left = `${Math.random() * 100}%`; // 隨機水平位置
        raindropB.style.height = `${2 + Math.random() * 10}px`; // 隨機高度 (2-10px)
        raindropB.style.backgroundColor = "rgba(255, 255, 255, 1)";

        document.getElementById("rainButton").appendChild(raindropB);
        existingRaindrops.push(raindropB); // 將新建立的雨滴新增到陣列

        let topPosition = -5; // 初始位置在容器上方
        const fallSpeed = 1 + Math.random(); // 隨機下落速度 (2-5)

        function buttonfall() {
            if (!isRainActive) {
                // 如果雨滴被暫停，不更新雨滴位置
                requestAnimationFrame(buttonfall);
                return;
            }

            topPosition += fallSpeed;
            raindropB.style.top = `${topPosition}px`;

            if (topPosition + 20 >= rainButton.clientHeight+20) {
                // 雨滴超出容器後移除
                raindropB.remove();
                existingRaindrops = existingRaindrops.filter((raindrop) => raindrop !== raindropB); // 從陣列中移除已移除的雨滴
            } else {
                requestAnimationFrame(buttonfall);
            }
        }

        // 啟動雨滴下落
        buttonfall();
    }

    // 建立雨滴的時間間隔 (毫秒)
    const raindropbuttonInterval = 40; // 每100毫秒建立一個雨滴
    let raindropIntervalId; // 儲存定時器 ID
});
