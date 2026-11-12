document.addEventListener("DOMContentLoaded", function () {
    // 新增點選事件處理程式到所有按鈕
    var buttons = document.querySelectorAll(".circle-button");
    
    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            // 獲取按鈕的背景顏色
            var buttonColor = getComputedStyle(button).backgroundColor;

            // 計算按鈕背景顏色的亮度和彩度
            var brightness = calculateBrightness(buttonColor);
            var saturation = calculateSaturation(buttonColor);
            
            var instagramText = document.getElementById("instagram-link");
            var youtubeText = document.getElementById("YouTube-link");
            var threadsText = document.getElementById("threads-link");

            var ColorNamesText = document.getElementById("ColorNames-link");
            var EnColorNamesText = document.getElementById("EnColorNames-link");
            var cText = document.getElementById("Ctext-link");
            var mText = document.getElementById("Mtext-link");
            var yText = document.getElementById("Ytext-link");
            var kText = document.getElementById("Ktext-link");
            var rText = document.getElementById("Rtext-link");
            var gText = document.getElementById("Gtext-link");
            var bText = document.getElementById("Btext-link");

            var cIntText = document.getElementById("CintText-link");
            var mIntText = document.getElementById("MintText-link");
            var yIntText = document.getElementById("YintText-link");
            var kIntText = document.getElementById("KintText-link");
            var rIntText = document.getElementById("RintText-link");
            var gIntText = document.getElementById("GintText-link");
            var bIntText = document.getElementById("BintText-link");

            var rainButton = document.getElementById("rainButton");
            var snowButton = document.getElementById("snowButton");
            var foggyButton = document.getElementById("foggyButton");
            var starryskyButton = document.getElementById("starryskyButton");


            var HexIntText = document.getElementById("HexintText-link");

            // 文字顏色等舊文字淡出後才換（changetext.js 的 colorInfoSwap）
            window.colorInfoSwap(function () {
            // 如果亮度或彩度大於閾值，將 M-text 和 M-int-text 的顏色更改為黑色和帶透明度的黑色
            if (brightness > 190 || saturation > 80) {
                
                instagramText.style.color = "#c34e87";
                youtubeText.style.color = "#d06363";
                if (threadsText) threadsText.style.color = "#c99d36";

                ColorNamesText.style.color = "rgba(0, 0, 0, 0.4)";
                EnColorNamesText.style.color = "rgba(0, 0, 0, 0.2)";
                cText.style.color = "rgba(0, 0, 0, 0.4)";
                mText.style.color = "rgba(0, 0, 0, 0.4)";
                yText.style.color = "rgba(0, 0, 0, 0.4)";
                kText.style.color = "rgba(0, 0, 0, 0.4)";
                rText.style.color = "rgba(0, 0, 0, 0.4)";
                gText.style.color = "rgba(0, 0, 0, 0.4)";
                bText.style.color = "rgba(0, 0, 0, 0.4)";
                
                cIntText.style.color = "rgba(0, 0, 0, 0.2)";
                mIntText.style.color = "rgba(0, 0, 0, 0.2)";
                yIntText.style.color = "rgba(0, 0, 0, 0.2)";
                kIntText.style.color = "rgba(0, 0, 0, 0.2)";
                rIntText.style.color = "rgba(0, 0, 0, 0.2)";
                gIntText.style.color = "rgba(0, 0, 0, 0.2)";
                bIntText.style.color = "rgba(0, 0, 0, 0.2)";
                HexIntText.style.color = "rgba(0, 0, 0, 0.4)";

                rainButton.style.background = "rgba(0, 0, 0, 0.1)";
                snowButton.style.background = "rgba(0, 0, 0, 0.1)";
                foggyButton.style.background = "rgba(0, 0, 0, 0.1)";
                starryskyButton.style.background = "rgba(0, 0, 0, 0.1)";
            
            }else{
              
                instagramText.style.color = "#d38bb4";
                youtubeText.style.color = "#de8d8c";
                if (threadsText) threadsText.style.color = "#e6cf89";

                ColorNamesText.style.color = "rgb(255, 255, 255)";
                EnColorNamesText.style.color = "rgba(255, 255, 255,0.3)";
                cText.style.color = "rgb(255, 255, 255)";
                mText.style.color = "rgb(255, 255, 255)";
                yText.style.color = "rgb(255, 255, 255)";
                kText.style.color = "rgb(255, 255, 255)";
                rText.style.color = "rgb(255, 255, 255)";
                gText.style.color = "rgb(255, 255, 255)";
                bText.style.color = "rgb(255, 255, 255)";
                
                cIntText.style.color = "rgba(255, 255, 255, 0.3)";
                mIntText.style.color = "rgba(255, 255, 255, 0.3)";
                yIntText.style.color = "rgba(255, 255, 255, 0.3)";
                kIntText.style.color = "rgba(255, 255, 255, 0.3)";
                rIntText.style.color = "rgba(255, 255, 255, 0.3)";
                gIntText.style.color = "rgba(255, 255, 255, 0.3)";
                bIntText.style.color = "rgba(255, 255, 255, 0.3)";
                HexIntText.style.color = "rgba(255, 255, 255, 1)";

                rainButton.style.background = "rgba(0, 0, 0, 0)";
                snowButton.style.background = "rgba(0, 0, 0, 0)";
                foggyButton.style.background = "rgba(0, 0, 0, 0)";
                starryskyButton.style.background = "rgba(0, 0, 0, 0)";

            }
            });
        });
    });

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            // 獲取按鈕的背景顏色
            var buttonColor = getComputedStyle(button).backgroundColor;
    
            // 計算按鈕背景顏色的亮度和彩度
            var brightness = calculateBrightness(buttonColor);
            var saturation = calculateSaturation(buttonColor);
    
            var objectylogo = document.getElementById("logo");
    
            var svgDoc = objectylogo.contentDocument;
            var pathElements = svgDoc.querySelectorAll("path"); // 獲取所有路徑元素
    
            pathElements.forEach(function (pathElement) {
                // 針對每個路徑元素更改 fill 屬性
                if (brightness > 190 || saturation > 80) {
                    pathElement.style.fill = "rgba(0, 0, 0, 0.4)";
                } else {
                    pathElement.style.fill = "rgba(255, 255, 255, 1)";
                }
            });
        });
    });
    


    // 計算顏色的亮度（明度）
    function calculateBrightness(color) {
        var rgb = color.match(/\d+/g);
        if (rgb) {
            return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        }
        return 0;
    }

    // 計算顏色的彩度
    function calculateSaturation(color) {
        const rgb = color.match(/\d+/g);
        if (rgb) {
            const r = parseInt(rgb[0]) / 255;
            const g = parseInt(rgb[1]) / 255;
            const b = parseInt(rgb[2]) / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            return ((max + min) / 2 > 0.5) ? delta / (2 - max - min) : delta / (max + min);
        }
        return 0;
    }
});