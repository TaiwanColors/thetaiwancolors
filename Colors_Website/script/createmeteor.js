document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById('starryskycontainer');
  let isStarrySkyActive = false;
  let meteorInterval;

  const starryskyButton = document.getElementById('starryskyButton');
  starryskyButton.addEventListener('click', () => {
      isStarrySkyActive = !isStarrySkyActive; // 切換活動狀態

      if (isStarrySkyActive) {
          startCreatingMeteor(); // 開始生成流星
      } else {
          stopCreatingMeteor(); // 停止生成流星
      }

      function startCreatingMeteor() {
          meteorInterval = setInterval(() => {
              createMeteor();
          }, 1000); // 每隔1秒生成一個流星
      }

      function stopCreatingMeteor() {
          clearInterval(meteorInterval);
      }

      function createMeteor() {
          // 隨機生成1到3的整數，用於設定流星的類別
          const randomMeteorClass = `meteor_${Math.floor(Math.random() * 3) + 1}`;

          // 建立流星元素
          const meteor = document.createElement('div');
          meteor.classList.add(randomMeteorClass);

          // 設定初始位置（隨機位置）
          const randomX = Math.random() * (container.clientWidth);
          const randomY = Math.random() * (container.clientHeight - 100); // 減去 100 以上移流星位置

          const pseudoElementWidth = Math.random() * (150 - 60) + 60;

          // 設定流星的內聯樣式，包括偽元素的寬度
          meteor.style.setProperty('--pseudo-element-width', `${pseudoElementWidth}px`);

          meteor.style.left = `${randomX}px`;
          meteor.style.top = `${randomY}px`;

          // 計算目標位置（隨機位置）
          const targetX = Math.random() * (container.clientWidth);
          const targetY = Math.random() * (container.clientHeight);

          // 新增流星動畫類，並設定目標位置
          meteor.classList.add('meteorAnimation');
          meteor.style.animation = `meteorAnimation 1.2s linear`;
          meteor.style.transform = `translate(${targetX - randomX}px, ${targetY - randomY}px)`;

          // 等待動畫完成後減少寬度和高度為0
          setTimeout(() => {
              meteor.style.setProperty('--pseudo-element-width', '0');
              meteor.style.width = '0';
              meteor.style.height = '0';
              meteor.style.transition = 'width 0.5s, height 0.5s'; // 新增過渡效果
          }, 500); // 0.5秒後減少寬度和高度

          // 在動畫結束後移除流星元素以結束其生命週期
          meteor.addEventListener('animationend', () => {
              meteor.remove();
          });

          // 將流星新增到 staryskycontainer 容器中
          container.appendChild(meteor);
      }

      // 第一顆流星立即生成
      createMeteor();
  });
});
