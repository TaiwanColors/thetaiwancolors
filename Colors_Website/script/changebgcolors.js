
function changeColor(button) {
    
        var bgColor = window.getComputedStyle(button).backgroundColor;
        
        //背景
        var backgrounds = document.querySelectorAll(".square");
        backgrounds.forEach(function(square) {
            square.style.backgroundColor = bgColor;
        });


        // 移除所有按鈕的 active 類
        var buttons = document.querySelectorAll(".circle-button");
        buttons.forEach(function(btn) {
            btn.classList.remove("active");
        });
        
        
        

        // 為當前點選的按鈕新增 active 類
        button.classList.add("active");



        // 檢查背景顏色的亮度（明度）
        var brightness = calculateBrightness(bgColor);
    
        // 如果亮度小於一個閾值（您可以自己調整），則將點的顏色更改為白色
        if (brightness < 190) {
            changePointColor("rgba(255, 255, 255, 0.4)");
        } else {
            changePointColor("rgba(0, 0, 0, 0.4)"); // 否則將點的顏色更改為黑色或其他顏色
        }



     }
    
    // 計算顏色的亮度（明度）
    function calculateBrightness(color) {
        var rgb = color.match(/\d+/g);
        if (rgb) {
            return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        }
        return 0;
    }
    
    // 更改點的顏色函式
    function changePointColor(color) {
        // 釣線與魚鉤（fishing.js）讀取這個 CSS 變數
        document.documentElement.style.setProperty("--fishing-line", color);
    }
    
    