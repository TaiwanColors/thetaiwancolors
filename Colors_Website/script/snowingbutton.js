document.addEventListener("DOMContentLoaded", function () {
    let isSnowActive = false; // 初始狀態為雪花活動
    let existingSnowflakes = []; // 儲存已建立的雪花元素
    let snowflakeIntervalId; // 儲存定時器 ID

    document.getElementById("snowButton").addEventListener("click", () => {
        isSnowActive = !isSnowActive; // 切換雪花狀態

        if (!isSnowActive) {
            // 如果雪花被暫停，停止現有雪花的動畫
            existingSnowflakes.forEach((snowflakeB) => {
                // 獲取雪花的當前位置並設定為固定值，使其停止動畫
                const computedStyle = getComputedStyle(snowflakeB);
                const topPosition = parseFloat(computedStyle.top);
                snowflakeB.style.top = `${topPosition}px`;
            });
            clearInterval(snowflakeIntervalId); // 停止新雪花的生成
        } else {
            // 如果雪花重新啟用，恢復新雪花的生成
            snowflakeIntervalId = setInterval(createSnowflakeB, snowflakeButtonnInterval);
        }
    });

    function createSnowflakeB() {
        if (!isSnowActive) {
            return;
        }
        const snowflakeB = document.createElement("div");
        snowflakeB.classList.add("snowflakeB");

        const snowflakeImage = `image/snowflakeB_${Math.floor(Math.random() * 10) + 1}.png`;

        snowflakeB.style.backgroundImage = `url('${snowflakeImage}')`;
        snowflakeB.style.backgroundSize = "cover"; // 設定背景大小為 cover，保持完整顯示圖片
        snowflakeB.style.position = "absolute";
        snowflakeB.style.left = `${Math.random() * 100}%`; // 隨機水平位置
        const fallSpeed = 0.1 + Math.random() * 0.4; // 隨機下落速度 (2-5)
        const maxOffset = Math.random() * 1 - 4; // 隨機生成最大水平偏移
        snowflakeB.style.width = "5px"; // 設定寬度
        snowflakeB.style.height = "5px"; // 設定高度
        


        document.getElementById("snowButton").appendChild(snowflakeB);
        
        snowflakeB.dataset.maxOffset = maxOffset; // 將最大水平偏移儲存在資料屬性中
        existingSnowflakes.push(snowflakeB); // 將新建立的雪花新增到陣列

        let topPosition = -10; // 初始位置在容器上方
        

        function snowflakeBFall() {
            if (!isSnowActive) {
                // 如果雪花被暫停，不更新雪花位置
                requestAnimationFrame(snowflakeBFall);
                return;
            }

            topPosition += fallSpeed;
            snowflakeB.style.top = `${topPosition}px`;
            
            // 使用資料屬性中的最大水平偏移值來控制左右偏移
            const horizontalOffset = parseFloat(snowflakeB.dataset.maxOffset) * Math.sin(topPosition / 30);
            snowflakeB.style.transform = `translateX(${horizontalOffset}px)`;

            if (topPosition >= snowButton.clientHeight) {
                // 雪花超出容器後移除
                snowflakeB.remove();
                existingSnowflakes = existingSnowflakes.filter((snowflake) => snowflake !== snowflakeB);
 // 從陣列中移除已移除的雨滴
            } else {
                requestAnimationFrame(snowflakeBFall);
            }
        }

        // 雪花下落
        snowflakeBFall();
    }

    const snowflakeButtonnInterval = 150; // 每100毫秒建立一個雪花
    snowflakeIntervalId = setInterval(createSnowflakeB, snowflakeButtonnInterval);
});
