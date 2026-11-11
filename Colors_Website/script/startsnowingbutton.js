document.addEventListener("DOMContentLoaded", function () {
    const snowButton = document.getElementById("snowButton");
    let isSnowActive = false;

    createInitialSnowing();

    function createInitialSnowing() {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 15; i++) {
            const snowflakeB = document.createElement("div");
            snowflakeB.classList.add("snowflakeB");


            const randomSnowflakeBImage = `image/snowflakeB_${Math.floor(Math.random() * 5) + 1}.png`;
            snowflakeB.style.backgroundImage = `url('${randomSnowflakeBImage}')`;
            snowflakeB.style.backgroundSize = "cover";
            snowflakeB.style.position = "absolute";
            snowflakeB.style.width = "5px"; // 設定寬度
            snowflakeB.style.height = "5px"; // 設定高度
            snowflakeB.style.opacity = "0.4"; // 設定高度
            
            snowflakeB.style.left = `${Math.random() * 100}%`;
            snowflakeB.dataset.maxOffset = Math.random() * 1 - 5;
            snowflakeB.style.top = `${Math.random() * 10}px`;
            

            fragment.appendChild(snowflakeB);
        }

        snowButton.appendChild(fragment);
    }

    function animateSnowflake(snowflakeB) {
        let topPosition = parseFloat(snowflakeB.style.top);
        const fallSpeed = 0.1 + Math.random() * 0.3; // 隨機下落速度 (2-5)

        function animateFrame() {
            if (!isSnowActive) {
                return;
            }

            topPosition += fallSpeed;
            snowflakeB.style.top = `${topPosition}px`;

            if (topPosition >= snowButton.clientHeight) {
                snowflakeB.remove();
            } else {
                requestAnimationFrame(animateFrame);
            }
        }

        animateFrame();
    }

    // 雪花點選事件監聽器
    snowButton.addEventListener("click", () => {
        isSnowActive = !isSnowActive;

        const snowflakes = document.querySelectorAll(".snowflakeB");

        snowflakes.forEach((snowflake) => {
            animateSnowflake(snowflake);
        });

        if (!isSnowActive) {
            snowButton.style.border = "1px solid rgba(255, 255, 255, 0.4)";
            snowButton.querySelectorAll(".snowflakeB").forEach((snowflakeB) => {
                snowflakeB.style.opacity = "0.4";
            });
        } else {
            snowButton.style.border = "1px solid rgba(255, 255, 255, 1)";
            snowButton.querySelectorAll(".snowflakeB").forEach((snowflakeB) => {
                snowflakeB.style.opacity = "1)";
            });
        }
    });
});
