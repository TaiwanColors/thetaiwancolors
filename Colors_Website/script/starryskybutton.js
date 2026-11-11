document.addEventListener("DOMContentLoaded", function () {
    // 獲取容器
    const container = document.getElementById("starryskyButton");
    const starBCount = 5; // 星星數量
    const shinystarBCount = 10; // 星星數量
    let starSB_3_elements = []; // 儲存 starB_3 元素的陣列
    let isStarrySkyActive = false; // 控制星星生成的開關變數

    // 新增 starB_1 和 starB_2 的程式碼...

    for (let i = 0; i < starBCount; i++) {
        const starSB_1 = document.createElement("div");
        const starSB_2 = document.createElement("div");

        // 隨機選擇星星的樣式
        const randomStyle = Math.random() < 0.5 ? "starlightSB_1" : "starlightSB_2";

        starSB_1.classList.add(randomStyle);
        starSB_2.classList.add(randomStyle);

        // 隨機生成星星的位置
        const Sx = Math.random() * 100;
        const Sy = Math.random() * 100;

        const Sx2 = Math.random() * 100;
        const Sy2 = Math.random() * 100;

        // 設定星星的位置
        starSB_1.style.left = `${Sx}%`;
        starSB_1.style.top = `${Sy}%`;

        starSB_2.style.left = `${Sx2}%`;
        starSB_2.style.top = `${Sy2}%`;

        // 將星星新增到容器中
        container.appendChild(starSB_1);
        container.appendChild(starSB_2);

        // 計算目標大小（隨機大小在 3 到 8 之間）
        const randomSize = 2 + Math.random() * 4;
     

        // 設定初始大小為1px，並以中心為基準放大
        starSB_1.style.width = `${randomSize}px`; // 新增 "px" 單位
        starSB_1.style.height = `${randomSize}px`; // 新增 "px" 單位
        starSB_1.style.opacity="0.4";
      

        starSB_2.style.width = `${randomSize}px`; // 新增 "px" 單位
    starSB_2.style.height = `${randomSize}px`; // 新增 "px" 單位
        starSB_2.style.opacity="0.4";
       

    }

    for (let i = 0; i < shinystarBCount; i++) {
        const starSB_3 = document.createElement("div");

        // 隨機選擇星星的樣式
        starSB_3.classList.add("starlightB_3");

        // 隨機生成星星的位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;

        const opacity = 0.5 + Math.random() * 0.5;

        // 設定星星的位置和閃爍效果
        starSB_3.style.left = `${x}%`;
        starSB_3.style.top = `${y}%`;
        starSB_3.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;

        starSB_3.style.animation = `twinkling ${Math.random() * 3 + 1}s ease-in-out ${Math.random() * 2}s infinite`;

        // 將星星新增到容器中
        container.appendChild(starSB_3);

        // 將 starB_3 元素新增到陣列中，以便後續控制
        starSB_3_elements.push(starSB_3);
        starSB_3.style.animationPlayState = "paused";
    }

    // 按鈕點選事件處理程式
    document.getElementById("starryskyButton").addEventListener("click", function () {
        if (!isStarrySkyActive) {
            // 開始生成星星
            isStarrySkyActive = true;
            // 啟動 starB_3 的閃爍效果
            starSB_3_elements.forEach((star) => {
                star.style.animationPlayState = "running";
            });
        } else {
            // 如果再次點選按鈕（停止生成星星），逐一收回 starB_1、starB_2 和停止 starB_3 的閃爍效果
            removeStars();
            // 停止 starB_3 的閃爍效果
            starSB_3_elements.forEach((star) => {
                star.style.animationPlayState = "paused";
            });
        }
    });

    // 定義逐一收回 starB_1 和 starB_2 的函式
    function removeStars() {
        // 逐一收回 starB_1 和 starB_2 的程式碼...
        // 停止生成新的星星
        isStarrySkyActive = false;
    }
});
