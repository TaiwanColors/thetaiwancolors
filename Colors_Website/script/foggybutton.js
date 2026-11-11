document.addEventListener("DOMContentLoaded", function () {
    let isFogActive = false; // 初始狀態為霧活動

    function createFoggyB() {
        if (isFogActive) {
            const container = document.getElementById("foggyButton");
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const foggyB = document.createElement("div");
            foggyB.classList.add("foggyB");

            // 隨機選擇生成的方向（0表示從左邊生成，1表示從右邊生成）
            const randomDirection = Math.random() < 0.5 ? 0 : 1;
            
            // 隨機選擇霧的影像
            const randomFogImage = `image/foggyB_${Math.floor(Math.random() * 5) + 1}.png`;
            foggyB.style.backgroundImage = `url('${randomFogImage}')`;
            foggyB.style.backgroundSize = "cover"; // 設定背景大小為 cover，保持完整顯示圖片
            foggyB.style.position = "absolute";
            const randomSize = 20 + Math.random() * 20; // 隨機大小在 20 到 40 之間
            foggyB.style.width = `${randomSize}px`; // 設定寬度
            foggyB.style.height = `${randomSize}px`; // 設定高度

            let left, top;
            if (randomDirection === 0) {
                // 從左邊生成
                left = `${-randomSize}px`;
            } else {
                // 從右邊生成
                left = `${containerWidth}px`;
            }

            const maxTop = containerHeight - randomSize;
            top = `${Math.random() * maxTop}px`;
            foggyB.style.left = left;
            foggyB.style.top = top;

            // 隨機旋轉角度（0到360度）
            const randomRotation = Math.random() * 360;
            foggyB.style.transform = `rotate(${randomRotation}deg)`;

            // 隨機旋轉速率（0.1到1）
            const randomRotationSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.1); // 隨機順時針或逆時針

            function animateFoggyB() {
                if (!isFogActive) {
                    // 如果霧被暫停，不更新霧的位置
                    requestAnimationFrame(animateFoggyB);
                    return;
                }

                if (randomDirection === 0) {
                    // 從左邊生成的霧向右移動
                    left = parseFloat(left) + 0.2; // 向右移動
                } else {
                    // 從右邊生成的霧向左移動
                    left = parseFloat(left) - 0.2; // 向左移動
                }

                foggyB.style.left = `${left}px`;

                // 更新旋轉角度
                const currentRotation = parseFloat(foggyB.style.transform.replace('rotate(', '').replace('deg)', ''));
                const newRotation = currentRotation + randomRotationSpeed;
                foggyB.style.transform = `rotate(${newRotation}deg)`;

                if ((left > containerWidth && randomDirection === 0) || (left + randomSize < 0 && randomDirection === 1)) {
                    // 霧超出容器後移除
                    foggyB.remove();
                } else {
                    requestAnimationFrame(animateFoggyB);
                }
            }

            // 啟動霧的動畫
            animateFoggyB();

            container.appendChild(foggyB);
        }
    }

    const foggyBInterval = 400; // 每500毫秒建立一個霧效果

    // 定期建立霧
    setInterval(createFoggyB, foggyBInterval);

    document.getElementById("foggyButton").addEventListener("click", () => {
        isFogActive = !isFogActive;
    });
});
