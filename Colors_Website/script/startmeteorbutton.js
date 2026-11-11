document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('starryskyButton');
    let isStarrySkyActive = false;
    let meteors = []; // 儲存已生成的流星元素
    let animationPaused = false; // 用於控制動畫暫停狀態
    let meteorInterval; // 儲存定時器 ID

    const starryskyButton = document.getElementById('starryskyButton');
starryskyButton.addEventListener('click', () => {
    isStarrySkyActive = !isStarrySkyActive; // 切換活動狀態

    if (isStarrySkyActive) {
        if (animationPaused) {
            resumeMeteorAnimation(); // 恢復流星動畫
        } else {
            // 在開始新的流星生成之前，先清除之前的定時器
            if (meteorInterval) {
                clearInterval(meteorInterval);
                meteorInterval = null;
            }
            startCreatingMeteor(); // 開始生成流星
        }
    } else {
        pauseMeteorAnimation(); // 暫停流星動畫
    }
});

    // 建立流星的函式
    function createMeteorB() {
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

        // 在動畫結束後移除流星元素以結束其生命週期
        meteorB.addEventListener('animationend', () => {
            meteorB.remove();
        });

        // 將流星新增到容器中
        container.appendChild(meteorB);

        // 將已生成的流星元素新增到陣列中
        meteors.push(meteorB);
    }

    // 建立流星的函式
    function startCreatingMeteor() {
        // 恢復之前的流星動畫狀態並繼續移動
        meteors.forEach((meteor) => {
            meteor.style.animationPlayState = 'running';
        });

        // 隨機生成下一顆流星的等待時間（0.5到1.5秒）
        const nextMeteorDelay = Math.random() * 300 + 500; // 1000毫秒=1秒
        const interval = setInterval(() => {
            if (!isStarrySkyActive) {
                clearInterval(interval);
                return;
            }
            createMeteorB();
        }, nextMeteorDelay);
    }

    // 暫停流星動畫的函式
    function pauseMeteorAnimation() {
        animationPaused = true;
        meteors.forEach((meteor) => {
            meteor.style.animationPlayState = 'paused';
        });
    }

    // 恢復流星動畫的函式
    function resumeMeteorAnimation() {
        animationPaused = false;
        meteors.forEach((meteor) => {
            meteor.style.animationPlayState = 'running';
        });

        // 隨機生成下一顆流星的等待時間（0.5到1.5秒）
        const nextMeteorDelay = Math.random() * 300 + 500; // 1000毫秒=1秒
        const interval = setInterval(() => {
            if (!isStarrySkyActive) {
                clearInterval(interval);
                return;
            }
            createMeteorB();
        }, nextMeteorDelay);
    }
});
