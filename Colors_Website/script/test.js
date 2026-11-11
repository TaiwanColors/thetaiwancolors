function createButtons() {
    // 獲取所有按鈕池中的按鈕
    var allButtonsInPool = document.querySelectorAll(".circle-button");
    
    // 隨機排序按鈕
    var shuffledButtons = shuffleArray(Array.from(allButtonsInPool));
    
    // 選擇前25個按鈕
    var circleButton = shuffledButtons.slice(0, totalButtons);

    // 建立並新增這些按鈕到容器
    circleButton.forEach(function (circleButton) {
        circleButton.style.zIndex = "1";
        // 計算按鈕的初始位置，隨機分佈在容器內
        var randomX = Math.random() * (buttonContainer.clientWidth - button.clientWidth);
        var randomY = Math.random() * (buttonContainer.clientHeight - button.clientHeight);
        circleButton.style.left = randomX + "px";
        circleButton.style.top = randomY + "px";
        // 設定初始透明度為0
        button.style.opacity = "0";
        // 啟動按鈕的移動動畫
        moveButton(circleButton);

        buttonContainer.appendChild(button);
        buttons.push(circleButton);
    });
}