document.addEventListener("DOMContentLoaded", function () {
    let isFogActive = false; // 初始狀態為霧活動

    function createFog(moveDirection) {
        if (isFogActive) {
            const container = document.getElementById("foggycontainer");
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const fog = document.createElement("div");
            fog.classList.add("fog");

            // 隨機選擇霧的影像
            const randomFogImage = `image/fog_${Math.floor(Math.random() * 5) + 1}.png`;
            fog.style.backgroundImage = `url('${randomFogImage}')`;
            fog.style.backgroundSize = "cover"; // 設定背景大小為 cover，保持完整顯示圖片
            fog.style.position = "absolute";
            const randomSize = 100 + Math.random() * 600; // 隨機大小在 200 到 800 之間
            fog.style.width = `${randomSize}px`; // 設定寬度
            fog.style.height = `${randomSize}px`; // 設定高度

            let left, top;
            if (moveDirection === "left") {
                left = `${containerWidth}px`;
                top = `${-randomSize / 2 + Math.random() * (containerHeight - randomSize / 2)}px`; // 限制在容器高度範圍內，但不超過一半
            } else if (moveDirection === "right") {
                left = `${-randomSize}px`;
                top = `${-randomSize / 2 + Math.random() * (containerHeight - randomSize / 2)}px`; // 限制在容器高度範圍內，但不超過一半
            }

            fog.style.left = left;
            fog.style.top = top;

            // 隨機旋轉角度（0到360度）
            const randomRotation = Math.random() * 360;
            fog.style.transform = `rotate(${randomRotation}deg)`;

            // 隨機旋轉速率（0.1到1）
            const randomRotationSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.1); // 隨機順時針或逆時針

            function animateFog() {
                

                if (moveDirection === "left") {
                    left = parseFloat(left) - 1.4; // 向左移動
                } else if (moveDirection === "right") {
                    left = parseFloat(left) + 1.4; // 向右移動
                }
                fog.style.left = `${left}px`;

                // 更新旋轉角度
                const currentRotation = parseFloat(fog.style.transform.replace('rotate(', '').replace('deg)', ''));
                const newRotation = currentRotation + randomRotationSpeed;
                fog.style.transform = `rotate(${newRotation}deg)`;

                if ((moveDirection === "left" && left < -randomSize) ||
                    (moveDirection === "right" && left > containerWidth)) {
                    // 霧超出容器後移除
                    fog.remove();
                } else {
                    requestAnimationFrame(animateFog);
                }
            }

            // 啟動霧的動畫
            animateFog();

            container.appendChild(fog);
        }
    }

    const fogInterval = 500; // 每150毫秒建立一個霧效果

    // 定期建立從左到右的霧
    setInterval(() => createFog("left"), fogInterval);

    // 定期建立從右到左的霧
    setInterval(() => createFog("right"), fogInterval);

    document.getElementById("foggyButton").addEventListener("click", () => {
        isFogActive = !isFogActive;
    });
});
