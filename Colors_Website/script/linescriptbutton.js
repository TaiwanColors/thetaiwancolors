window.addEventListener("load", function () {
    // 建立滑鼠點
    const mousePoint = document.createElement("div");
    mousePoint.id = "mousePoint";
    
  
// 隱藏初始狀態下的點
   
    //
    const points2 = [];
    const numPoints2 = 30;
    for (let i = 1; i <= numPoints2; i++) {
        const point2 = document.createElement("div");
        point2.classList.add("point2");
        point2.id = `point2${i}`;
        points2.push(point2);
    }

   

    // 將點新增到頁面中
    points2.forEach((point2) => {
        document.body.appendChild(point2);
        point2.style.zIndex = "0";
    
        point2.style.display = "none";

        
    });
    
    
    
    const gravity = 10; // 重力的強度

    // 標誌變數，用於控制是否更新端點的位置
    let followMouse = true; // 修改為true

    // 當前跟隨的按鈕
    let currentButton = null;

    // 隱藏釣魚線和點的元素
    
    
    // 顯示釣魚線和點的元素
  

    // 更新端點位置的函式
    function updatePoints() {
        
        if (followMouse && currentButton) {
            // 獲取當前按鈕的位置
            const buttonRect = currentButton.getBoundingClientRect();
            const buttonX = buttonRect.left + buttonRect.width / 2;
            const buttonY = buttonRect.top + buttonRect.height / 2;

            // 獲取 boat_container_from 的位置
            const boatContainerFrom = document.getElementById("boat_container_from");
            const boatContainerFromRect = boatContainerFrom.getBoundingClientRect();
            const boatContainerFromX = boatContainerFromRect.left + boatContainerFromRect.width / 2-39;
            const boatContainerFromY = boatContainerFromRect.top + boatContainerFromRect.height / 2-8;

            // 計算中央點與按鈕之間的座標差
            const dx = boatContainerFromX - buttonX;
            const dy = boatContainerFromY - buttonY;

            // 計算線段的長度
            const lineLength = Math.sqrt(dx * dx + dy * dy);

            // 計算單位向量
            const unitVectorX = dx / lineLength;
            const unitVectorY = dy / lineLength;

            // 根據座標差，設定每個點的位置，根據離端點的距離來計算重力強度
            for (let i = 0; i < numPoints2; i++) {
                const distance = (i ) * (lineLength / (numPoints2 - 1)); // 每個點到中央點的距離
                const gravityStrength = (numPoints2 - i) / numPoints2; // 重力強度，離端點愈近愈小
    
                // 計算點的位置
                const point2X = buttonX + distance * unitVectorX+(i);
                let point2Y = buttonY + distance * unitVectorY + gravityStrength * gravity * (i );
    
                // 設定點的位置
                points2[i].style.left = `${point2X}px`;
                points2[i].style.top = `${point2Y}px`;
            }
        }

        // 使用 requestAnimationFrame 來持續更新點的位置
        if (followMouse) {
            requestAnimationFrame(updatePoints);
        }
    }

    // 新增點選事件監聽器以在點選 .circle-button 按鈕時啟用更新端點的位置
    const circleButtons = document.querySelectorAll(".circle-button");
    circleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            followMouse = true;
            currentButton = button;

            // 顯示所有點
            
            points2.forEach((point2) => {
                point2.style.display = "block";
            });
            // 開始持續更新點的位置
            updatePoints();
        });
    });

    // 隱藏初始狀態下的釣魚線和點的元素
 


});
