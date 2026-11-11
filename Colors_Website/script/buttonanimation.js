document.addEventListener("DOMContentLoaded", function () {
    var buttonContainer = document.querySelector(".button-container");
    var buttons = [];
    const numberOfButtonsToDisplay = 4;

    // 定義不同色域的按鈕資料
    const colorDomains = {
        yellow: Object.values(yellowButtonTextMap),
        orange: Object.values(orangeButtonTextMap),
        red: Object.values(redButtonTextMap),
        purple: Object.values(purpleButtonTextMap),
        blue: Object.values(blueButtonTextMap),
        green: Object.values(greenButtonTextMap),
        theme: Object.values(themeButtonTextMap), // 主題色：一定全部出現
    };

    createButtons();

    function createButtons() {
        for (var color in colorDomains) {
            // 主題色每次都全部放出來；其他色系照原本隨機挑 numberOfButtonsToDisplay 個
            var selectedButtonData = color === "theme"
                ? colorDomains[color].slice()
                : getRandomButtonData(colorDomains[color], numberOfButtonsToDisplay);
            selectedButtonData.forEach(function (data) {
                var circleButton = document.createElement("div");
                circleButton.classList.add("circle-button");
    
                // 獲取顏色名稱和編號
                var colorName = color;
                var itemNumber = Object.keys(colorDomains[color]).find(key => colorDomains[color][key] === data);
    
                // 將編號加1
                var buttonNumber = parseInt(itemNumber) + 1;
    
                var colorKey = colorName + buttonNumber;
                
                // 儲存顏色和編號資訊
                circleButton.setAttribute("data-color", colorKey);
                
                circleButton.onclick = (function (colorKey) {
                    return function () {
                        changeColor(this);
                        // 從按鈕的自定義屬性中獲取顏色和編號資訊
                        var [color, number] = colorKey.match(/([a-zA-Z]+)(\d+)/).slice(1);
                        //console.log("Color:", color);
                        //console.log("Number:", number);
                        
                    };
                })(colorKey);
    
                // 設定背景顏色
                circleButton.style.backgroundColor = data.hexText;
    
                // 設定圖層為1
                circleButton.style.zIndex = "1";
    
                // 設定初始透明度為0（位置與游動交給 fishing.js）
                circleButton.style.opacity = "0";
    
                buttonContainer.appendChild(circleButton);
                buttons.push(circleButton);
            });
        }
    }
    

    // 在延遲兩秒後將按鈕透明度設定為1
    setTimeout(function () {
        buttons.forEach(function (button) {
            button.style.opacity = "1";
        });
    }, 800);

    function getRandomButtonData(buttonData, number) {
        var buttonDataCopy = [...buttonData];
        var selectedData = [];

        number = Math.min(number, buttonDataCopy.length); // 色系裡的顏色不夠多時，有幾個拿幾個
        for (var i = 0; i < number; i++) {
            var randomIndex = Math.floor(Math.random() * buttonDataCopy.length);

            selectedData.push(buttonDataCopy.splice(randomIndex, 1)[0]);
        }

        return selectedData;
    }

    // 原本每顆色球各自用 setTimeout(27ms) 移動並讀取 clientWidth，
    // 24 顆同時跑很耗電；游動已改由 fishing.js 的單一動畫迴圈處理。
});
