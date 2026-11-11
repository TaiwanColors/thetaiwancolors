document.addEventListener("DOMContentLoaded", function () {
    // 獲取容器
    const container = document.getElementById("starryskycontainer");
    let starCount = calculateStarCount(); // 初始星星數量
    let starsAdded = 0; // 新增的星星數量
    let shinystarCount = 100; // 明亮星星的數量
    let shinystarsAdded = 0; // 新增的明亮星星數量

    let lastTimestamp = 0;

    // 控制星星生成的開關變數
    let isStarrySkyActive = false;

    // 視窗大小改變時重新計算星星數量
    window.addEventListener("resize", function () {
        starCount = calculateStarCount();
    });


    // 按鈕點選事件處理程式
    document.getElementById("starryskyButton").addEventListener("click", function () {
        if (!isStarrySkyActive) {
            // 重置計數器
            starsAdded = 0;
            shinystarsAdded = 0;

            // 開始生成星星
            isStarrySkyActive = true;
            requestAnimationFrame(addStar);
            requestAnimationFrame(() => addShinyStar(container));
        } else {
            // 如果再次點選按鈕（停止生成星星），逐一收回 star_1、star_2 和 star_3
            removeStars();
        }
    });

    function calculateStarCount() {
        const windowWidth = window.innerWidth;
        // 根據視窗寬度計算星星數量，可以根據需要調整數量和比例
        return Math.round((windowWidth / 1920) * 50);
    }
    // 定義新增星星的函式
    function addStar(timestamp) {
        // 控制新增星星的速度，這裡設定為每秒新增一次
        if (timestamp - lastTimestamp >= 10) {
            for (let i = 0; i < 10; i++) {
                const star_1 = document.createElement("div");
                const star_2 = document.createElement("div");
    
                // 隨機選擇星星的樣式
                const randomStyle = Math.random() < 0.5 ? "starlight_1" : "starlight_2";
    
                star_1.classList.add(randomStyle);
                star_2.classList.add(randomStyle);
    
                // 隨機生成星星的位置
                const x = Math.random() * 100;
                const y = Math.random() * 100;

                const x2 = Math.random() * 100;
                const y2 = Math.random() * 100;
                
                // 設定星星的位置
                star_1.style.left = `${x}%`;
                star_1.style.top = `${y}%`;
    
                star_2.style.left = `${x2}%`;
                star_2.style.top = `${y2}%`;
    
                // 將星星新增到容器中（初始大小為1px，以自身中心為基準放大）
                container.appendChild(star_1);
                container.appendChild(star_2);
    
                // 計算目標大小（隨機大小在 3 到 8 之間）
                const randomSize = 3 + Math.random() * 5;
                const targetSize = randomSize;
    
                // 設定初始大小為1px，並以中心為基準放大
                star_1.style.width = "1px";
                star_1.style.height = "1px";
                star_1.style.transformOrigin = "center center";
    
                star_2.style.width = "1px";
                star_2.style.height = "1px";
                star_2.style.transformOrigin = "center center";
    
                // 使用 requestAnimationFrame 在下一幀應用過渡效果和大小
                requestAnimationFrame(() => {
                    star_1.style.transition = "transform 2s, width 2s, height 2s";
                    star_1.style.transform = "scale(" + targetSize + ")";
    
                    star_2.style.transition = "transform 2s, width 2s, height 2s";
                    star_2.style.transform = "scale(" + targetSize + ")";
                });
            }
    
            starsAdded += 10;
            lastTimestamp = timestamp;
        }
    
        // 繼續新增下一批星星或停止
        if (starsAdded < starCount && isStarrySkyActive) {
            requestAnimationFrame(addStar);
        }
    }

    // 定義逐一收回 star_1 和 star_2 的函式
    function removeStars() {
        const star_1_elements = container.getElementsByClassName("starlight_1");
        const star_2_elements = container.getElementsByClassName("starlight_2");
        const star_3_elements = container.getElementsByClassName("starlight_3");
        // 逐一收回 star_1
        for (const star_1 of star_1_elements) {
            star_1.style.transition = "transform 2s, opacity 2s"; // 只使用 transform 和 opacity 過渡
            star_1.style.transform = "scale(0)";
            star_1.style.opacity = "0";
            star_1.style.transformOrigin = "center center"; // 設定縮放的中心點為星星的中心

            // 在完成過渡後，從容器中移除 star_1 元素
            star_1.addEventListener("transitionend", () => {
                star_1.remove();
            });
        }

        // 逐一收回 star_2
        for (const star_2 of star_2_elements) {
            star_2.style.transition = "transform 2s, opacity 2s"; // 只使用 transform 和 opacity 過渡
            star_2.style.transform = "scale(0)";
            star_2.style.opacity = "0";
            star_2.style.transformOrigin = "center center"; // 設定縮放的中心點為星星的中心

            // 在完成過渡後，從容器中移除 star_2 元素
            star_2.addEventListener("transitionend", () => {
                star_2.remove();
            });
        }

        for (const star_3 of star_3_elements) {
            star_3.style.transition = "transform 2s, opacity 2s"; // 只使用 transform 和 opacity 過渡
            star_3.style.transform = "scale(0)";
            star_3.style.opacity = "0";
            star_3.style.transformOrigin = "center center"; // 設定縮放的中心點為星星的中心

            // 在完成過渡後，從容器中移除 star_2 元素
            star_3.addEventListener("transitionend", () => {
                star_3.remove();
            });
        }

        // 停止生成新的星星
        isStarrySkyActive = false;
    }

    // 繼續新增下一批星星或停止
    if (starsAdded < starCount && isStarrySkyActive) {
        requestAnimationFrame(addStar);
    }

    // 開始新增星星
    // requestAnimationFrame(addStar);

    function addShinyStar(container) {
        if (!isStarrySkyActive) {
            // 如果停止生成星星，不再繼續新增
            return;
        }

        for (let i = 0; i < 10; i++) {
            const star_3 = document.createElement("div");
            star_3.classList.add("starlight_3");

            // 隨機生成星星的位置
            const x = Math.random() * 100;
            const y = Math.random() * 100;

            // 隨機生成星星的顏色（使用 HSL 表示，隨機色調）
            const hue = Math.random() * 360; // 隨機色調
            const saturation = 100; // 飽和度
            const lightness = Math.random() * 50 + 50; // 亮度

            // 隨機生成星星的透明度（範圍從 0.5 到 1）
            const opacity = 0.5 + Math.random() * 0.5;

            // 初始大小設定為0px
            star_3.style.width = "0px";
            star_3.style.height = "0px";

            // 設定星星的樣式，包括顏色和透明度
            star_3.style.left = `${x}%`;
            star_3.style.top = `${y}%`;
            star_3.style.backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;

            // 隨機設定動畫延遲，以使星星的閃爍效果看起來不同
            star_3.style.animation = `twinkling ${Math.random() * 3 + 1}s ease-in-out ${Math.random() * 2}s infinite`;
            star_3.style.transition = 'width 0.5s, height 0.5s';
            container.appendChild(star_3);

            // 使用 setTimeout 在2秒後將大小設定為2px x 2px
            setTimeout(() => {
                if (isStarrySkyActive) {
                    star_3.style.width = "2px";
                    star_3.style.height = "2px";
                }
            }, 2000);
        }

        shinystarsAdded += 10;

        if (shinystarsAdded < shinystarCount && isStarrySkyActive) {
            // 在一定延遲後再次呼叫 addShinyStar，實現逐一出現的效果
            setTimeout(() => {
                requestAnimationFrame(() => addShinyStar(container));
            }, 200);
        }
    }
});
