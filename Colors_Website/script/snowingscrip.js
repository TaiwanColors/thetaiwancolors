document.addEventListener("DOMContentLoaded", function () {
    let isSnowActive = false; // 初始狀態為雨滴活動

    function createSnow() {
        if (isSnowActive) {
            const snowflake = document.createElement("div");
            snowflake.classList.add("snowflake");

            const snowflakeImage = `image/snowflake_${Math.floor(Math.random() * 10) + 1}.png`;

            snowflake.style.backgroundImage = `url('${snowflakeImage}')`;
            snowflake.style.backgroundSize = "cover"; // 設定背景大小為 cover，保持完整顯示圖片
            snowflake.style.position = "absolute";
            
            snowflake.style.width = "8px"; // 設定寬度
            snowflake.style.height = "8px"; // 設定高度

            const fallSpeed = 1 + Math.random() * 1; // 隨機下落速度 (2-5)
            const maxOffset = Math.random() * 1 - 5; // 隨機生成最大水平偏移

    
            
            snowflake.style.left = `${Math.random() * 100}%`;

            snowflake.dataset.maxOffset = maxOffset; // 將最大水平偏移儲存在資料屬性中

            document.getElementById("snowingcontainer").appendChild(snowflake);

            let topPosition = -20; // 初始位置在容器上方

            function snowfall() {
                topPosition += fallSpeed;
                snowflake.style.top = `${topPosition}px`;

                // 使用資料屬性中的最大水平偏移值來控制左右偏移
                const horizontalOffset = parseFloat(snowflake.dataset.maxOffset) * Math.sin(topPosition / 30);
                snowflake.style.transform = `translateX(${horizontalOffset}px)`;

                if (topPosition >= snowingcontainer.clientHeight) {
                    // 雪花超出容器後移除
                    snowflake.remove();
                } else {
                    requestAnimationFrame(snowfall);
                }
            }

            // 雪花下落
            snowfall();
        }
    }

    const snowdropInterval = 200; // 每100毫秒建立一個雪花

    // 定期建立雪花
    setInterval(createSnow, snowdropInterval);

    document.getElementById("snowButton").addEventListener("click", () => {
        isSnowActive = !isSnowActive;
    });
});
