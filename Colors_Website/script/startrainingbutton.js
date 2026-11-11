document.addEventListener("DOMContentLoaded", function () {
    const rainButton = document.getElementById("rainButton");
    let isRainActive = false;

    createInitialRaindrops();

    function createInitialRaindrops() {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 20; i++) {
            const raindropB = document.createElement("div");
            raindropB.classList.add("raindropB");
            raindropB.style.left = `${Math.random() * 100}%`;
            raindropB.style.top = `${Math.random() * 10}px`;
            raindropB.style.height = `${1 + Math.random() * 6}px`;
            fragment.appendChild(raindropB);
        }

        rainButton.appendChild(fragment);
    }

    function animateRaindrop(raindropB) {
        let topPosition = parseFloat(raindropB.style.top);
        const fallSpeed = 1 + Math.random();

        function animateFrame() {
            if (!isRainActive) {
                return;
            }

            topPosition += fallSpeed;
            raindropB.style.top = `${topPosition}px`;

            if (topPosition >= rainButton.clientHeight) {
                raindropB.remove();
            } else {
                requestAnimationFrame(animateFrame);
            }
        }

        animateFrame();
    }

    // 雨滴點選事件監聽器
    rainButton.addEventListener("click", () => {
        isRainActive = !isRainActive; // 切換雨滴狀態

        const raindrops = document.querySelectorAll(".raindropB");

        raindrops.forEach((raindrop) => {
            animateRaindrop(raindrop);
        });

        if (!isRainActive) {
            rainButton.style.border = "1px solid rgba(255, 255, 255, 0.4)";
            rainButton.querySelectorAll(".raindropB").forEach((raindropB) => {
                raindropB.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
            });
        } else {
            rainButton.style.border = "1px solid rgba(255, 255, 255, 1)";
            rainButton.querySelectorAll(".raindropB").forEach((raindropB) => {
                raindropB.style.backgroundColor = "rgba(255, 255, 255, 1)";
            });
        }
    });
});
