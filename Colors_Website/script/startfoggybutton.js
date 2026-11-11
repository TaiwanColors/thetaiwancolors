document.addEventListener("DOMContentLoaded", function () {
    const foggyButton = document.getElementById("foggyButton");
    let isFogActive = false;

    let containerWidth;
    let containerHeight;

    createInitialFoggys();

    function createInitialFoggys() {
        containerWidth = foggyButton.clientWidth; // 移到外部以便訪問
        containerHeight = foggyButton.clientHeight; // 移到外部以便訪問

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 7; i++) {
            const foggyB = document.createElement("div");
            foggyB.classList.add("foggyB");

            const randomFogImage = `image/foggyB_${Math.floor(Math.random() * 5) + 1}.png`;
            foggyB.style.backgroundImage = `url('${randomFogImage}')`;
            foggyB.style.backgroundSize = "cover";
            foggyB.style.position = "absolute";
            const randomSize = 20 + Math.random() * 20;
            foggyB.style.width = `${randomSize}px`;
            foggyB.style.height = `${randomSize}px`;

            // 設定 left 和 top 的初始位置
            const halfRandomSize = randomSize * 0.5; // 寬度的一半
            const left = Math.random() * (containerWidth - randomSize + halfRandomSize * 2) - halfRandomSize; // 左邊界和右邊界超出一半
            const top = Math.random() * (containerHeight - randomSize);
            foggyB.style.left = `${left}px`;
            foggyB.style.top = `${top}px`;

            // 新增方向屬性
            foggyB.dataset.direction = Math.random() < 0.5 ? "left" : "right";

            fragment.appendChild(foggyB);
        }

        foggyButton.appendChild(fragment);
    }

    function animateFoggys() {
        if (isFogActive) {
            const foggyBs = document.querySelectorAll(".foggyB");

            foggyBs.forEach((foggyB) => {
                const direction = foggyB.dataset.direction;
                let left = parseFloat(foggyB.style.left);
                const randomSize = parseFloat(foggyB.style.width);

                if (direction === "left") {
                    left -= 0.1; // 向左移動
                } else {
                    left += 0.1; // 向右移動
                }

                foggyB.style.left = `${left}px`;

                // 更新旋轉角度
                const currentRotation = parseFloat(foggyB.style.transform.replace('rotate(', '').replace('deg)', ''));
                const randomRotationSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.1);
                const newRotation = currentRotation + randomRotationSpeed;
                foggyB.style.transform = `rotate(${newRotation}deg)`;

                if ((left > containerWidth && direction === "right") || (left + randomSize < 0 && direction === "left")) {
                    // 霧超出容器後移除
                    foggyB.remove();
                }
            });
        }
    }

    // 使用 requestAnimationFrame 啟動動畫
    function startAnimation() {
        animateFoggys();
        requestAnimationFrame(startAnimation);
    }

    // 霧點選事件監聽器
    foggyButton.addEventListener("click", () => {
        isFogActive = !isFogActive; // 切換霧狀態
        startAnimation(); // 呼叫 startAnimation 函式以開始或停止動畫

        if (!isFogActive) {
            foggyButton.style.border = "1px solid rgba(255, 255, 255, 0.4)";
            const foggyBs = document.querySelectorAll(".foggyB");
            foggyBs.forEach((foggyB) => {
                foggyB.style.opacity = 0.4;
            });
        } else {
            foggyButton.style.border = "1px solid rgba(255, 255, 255, 1)";
            const foggyBs = document.querySelectorAll(".foggyB");
            foggyBs.forEach((foggyB) => {
                foggyB.style.opacity = 1;
            });
        }
    });

    // 頁面載入後啟動動畫
    startAnimation();
});
