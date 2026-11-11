document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('starryskyButton');
    let isStarrySkyActive = false;
    let stopMeteorCreation = false; // 新增一個變數用於控制是否停止生成流星

    const starryskyButton = document.getElementById('starryskyButton');
    starryskyButton.addEventListener('click', () => {
        isStarrySkyActive = !isStarrySkyActive; // 切換活動狀態

        if (isStarrySkyActive) {
            startCreatingMeteor(); // 開始生成流星
        } else {
            stopCreatingMeteor(); // 停止生成流星
        }
    });

    // 建立流星的函式
    function createMeteorB() {
        // 隨機生成1到3的整數，用於設定流星的類別
        if (stopMeteorCreation) return; // 如果停止生成流星標誌為 true，則不再生成流星

        // 建立流星元素
        const meteorB = document.createElement('div');
        meteorB.classList.add("meteorB_4");

        // 設定初始位置（隨機位置）
        const randomX = Math.random() * (container.clientWidth);
        const randomY = Math.random() * (container.clientHeight - 10); // 減去 100 以上移流星位置

        const pseudoElementWidth = Math.random() * (30 - 10) + 10;

        // 設定流星的內聯樣式，包括偽元素的寬度
        meteorB.style.setProperty('--pseudo-element-width', `${pseudoElementWidth}px`);

        meteorB.style.left = `${randomX}px`;
        meteorB.style.top = `${randomY}px`;

        // 計算目標位置（隨機位置）
        const targetX = Math.random() * (container.clientWidth);
        const targetY = Math.random() * (container.clientHeight);

        // 新增流星動畫類，並設定目標位置
        meteorB.classList.add('meteorBAnimation');
        meteorB.style.animation = `meteorBAnimation 0.6s linear`;
        meteorB.style.transform = `translate(${targetX - randomX}px, ${targetY - randomY}px)`;

        // 等待動畫完成後減少寬度和高度為0
        setTimeout(() => {
            meteorB.style.setProperty('--pseudo-element-width', '0');
            meteorB.style.width = '0';
            meteorB.style.height = '0';
            meteorB.style.transition = 'width 0.5s, height 0.5s'; // 新增過渡效果
        }, 500); // 0.5秒後減少寬度和高度

        // 在動畫結束後移除流星元素以結束其生命週期
        meteorB.addEventListener('animationend', () => {
            meteorB.remove();
        });

        // 將流星新增到容器中
        container.appendChild(meteorB);

        // 隨機生成下一顆流星的等待時間（0.5到1.5秒）
        const nextMeteorDelay = Math.random() * 300 + 500; // 1000毫秒=1秒
        setTimeout(createMeteorB, nextMeteorDelay);
    }

    // 建立流星的函式
    function startCreatingMeteor() {
        stopMeteorCreation = false; // 啟用生成流星標誌
        // 第一顆流星立即生成
        createMeteorB();

        // 隨機生成下一顆流星的等待時間（0.5到1.5秒）
        const nextMeteorDelay = Math.random() * 300 + 500; // 1000毫秒=1秒
        setTimeout(createMeteorB, nextMeteorDelay);
    }

    // 停止生成流星的函式
    function stopCreatingMeteor() {
        stopMeteorCreation = true; // 停止生成流星
    }
});