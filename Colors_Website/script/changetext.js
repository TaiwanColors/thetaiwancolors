document.addEventListener("DOMContentLoaded", function () {
    // 新增點選事件處理程式到所有按鈕
    var buttons = document.querySelectorAll(".circle-button");

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            // 獲取按鈕的 data-color 屬性值
            var colorKey = button.getAttribute("data-color");
            var [color, number] = colorKey.match(/([a-zA-Z]+)(\d+)/).slice(1);
            console.log("Color:", color);
            console.log("Number:", number);

            // 獲取對應的文字資料
            var buttonTextMap;
            switch (color) {
                case "yellow":
                    buttonTextMap = yellowButtonTextMap;
                    break;
                case "orange":
                    buttonTextMap = orangeButtonTextMap;
                    break;
                case "red":
                    buttonTextMap = redButtonTextMap;
                    break;
                case "purple":
                    buttonTextMap = purpleButtonTextMap;
                    break;
                case "blue":
                    buttonTextMap = blueButtonTextMap;
                    break;
                case "green":
                    buttonTextMap = greenButtonTextMap;
                    break;
                // 可以根據需要新增更多的顏色
            }

            // 獲取對應的資料
            var data = buttonTextMap[number];

            // 呼叫更新文字內容的函式
            updateTextContent(data);
        });
    });

    function updateTextContent(data) {
        document.getElementById("ColorNames-link").textContent = data.colorName;
        document.getElementById("EnColorNames-link").textContent = data.enColorName;
        document.getElementById("CintText-link").textContent = data.cIntText;
        document.getElementById("MintText-link").textContent = data.mIntText;
        document.getElementById("YintText-link").textContent = data.yIntText;
        document.getElementById("KintText-link").textContent = data.kIntText;
        document.getElementById("RintText-link").textContent = data.rIntText;
        document.getElementById("GintText-link").textContent = data.gIntText;
        document.getElementById("BintText-link").textContent = data.bIntText;
        document.getElementById("HexintText-link").textContent = data.hexText;
    }
});
