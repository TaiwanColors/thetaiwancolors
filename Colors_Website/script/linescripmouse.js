window.addEventListener("load", function () {
    // 建立中央點
    const centerPoint = document.createElement("div");
    // 建立滑鼠點
    const mousePoint = document.createElement("div");
    
    const points = [];
    const numPoints = 30;
    for (let i = 1; i <= numPoints; i++) {
        const point = document.createElement("div");
        point.classList.add("point");
       
        points.push(point);
    }

    // 將點新增到頁面中
    document.body.appendChild(centerPoint);
    points.forEach((point) => {
        document.body.appendChild(point);
        point.style.zIndex = "0";
    });

    const gravity = 10; // 重力的強度

    // 標誌變數，用於控制是否更新端點的位置和是否隱藏端點
    let followMouse = true;
    let hidePoints = false;


    // 獲取船的初始位置
    const boatContainerFrom = document.getElementById("boat_container_from");

    document.addEventListener("mousemove", function (e) {
        // 顯示所有點，包括滑鼠點
        points.forEach((point) => {
            point.style.opacity = "1";
        });

        // 移除滑鼠移動事件監聽器
        document.removeEventListener("mousemove", arguments.callee);
    });

    // 更新船的位置
    function updateBoatPosition() {
        const boatContainerFromRect = boatContainerFrom.getBoundingClientRect();
        const boatContainerFromX = boatContainerFromRect.left + boatContainerFromRect.width / 2-8;
        const boatContainerFromY = boatContainerFromRect.top + boatContainerFromRect.height / 2+13;
        return { x: boatContainerFromX, y: boatContainerFromY };
    }

    // 更新滑鼠點的位置
    function updateMousePosition(e) {
        if (followMouse && !hidePoints) {
            // 更新滑鼠點的位置為滑鼠的當前位置
            mousePoint.style.left = `${e.clientX}px`;
            mousePoint.style.top = `${e.clientY}px`;
        }
    }

    const circleButtons = document.querySelectorAll(".circle-button");
    circleButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            // 隱藏所有點，包括滑鼠點
         

            // 將所有點的樣式設定為隱藏
            points.forEach((point) => {
                point.style.display = "none";
            });

   
        });
    });

    // 更新端點的位置
    function updatePoints() {
        const boatPosition = updateBoatPosition();
        const mouseX = parseFloat(mousePoint.style.left);
        const mouseY = parseFloat(mousePoint.style.top);

        const dx = mouseX - boatPosition.x;
        const dy = mouseY - boatPosition.y;

        // 計算線段的長度
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        // 計算單位向量
        const unitVectorX = dx / lineLength;
        const unitVectorY = dy / lineLength;

        // 根據座標差，設定每個點的位置，根據離端點的距離來計算重力強度
        for (let i = 0; i < numPoints; i++) {
            const distance = (i ) * (lineLength / (numPoints -1)); // 每個點到中央點的距離
            const gravityStrength = (numPoints - i) / numPoints; // 重力強度，離端點愈近愈小

            // 計算點的位置
            const pointX = boatPosition.x + distance * unitVectorX-3;
            let pointY = boatPosition.y + distance * unitVectorY + gravityStrength * gravity * (i )-12;

            // 設定點的位置
            points[i].style.left = `${pointX}px`;
            points[i].style.top = `${pointY}px`;
        }

        // 使用 requestAnimationFrame 來持續更新點的位置
        if (followMouse) {
            requestAnimationFrame(updatePoints);
        }
    }

    // 新增滑鼠移動事件監聽器
    document.addEventListener("mousemove", updateMousePosition);

    // 開始持續更新端點的位置
    updatePoints();


});
