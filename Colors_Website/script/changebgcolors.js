
function changeColor(button) {
    
        var bgColor = window.getComputedStyle(button).backgroundColor;
        
        //背景（用 fadeBackground 慢慢漸變，見下方說明）
        fadeBackground(bgColor);


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
    
    // ===== 背景漸變 =====
    // 原本用 CSS transition（background-color 2.5s），但瀏覽器偶爾會在漸變剛結束的那一幀
    // 畫回「舊的顏色」，整個背景閃一下。改成自己每幀算顏色、最後一幀直接設成目標色，就不會閃。
    // 速度曲線跟 CSS 的 ease 一樣，才會跟瓶子的水、船燈、釣線（仍是 CSS 2.5s ease）同步。
    var BG_FADE = 2500; // 毫秒
    var bgFadeRaf = 0;
    function parseRGB(s) {
        var m = (s || "").match(/[\d.]+/g);
        return m ? [+m[0], +m[1], +m[2]] : [76, 76, 76];
    }
    // CSS ease = cubic-bezier(0.25, 0.1, 0.25, 1)
    function cssEase(x) {
        var x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1;
        var bx = function (t) { return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t; };
        var by = function (t) { return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t; };
        var lo = 0, hi = 1, t = x;
        for (var i = 0; i < 20; i++) { t = (lo + hi) / 2; if (bx(t) < x) lo = t; else hi = t; }
        return by(t);
    }
    function fadeBackground(color) {
        var squares = document.querySelectorAll(".square");
        if (!squares.length) return;
        var from = parseRGB(squares[0].style.backgroundColor || window.getComputedStyle(squares[0]).backgroundColor);
        var to = parseRGB(color);
        var target = "rgb(" + to.map(Math.round).join(", ") + ")";
        cancelAnimationFrame(bgFadeRaf);
        var t0 = performance.now();
        function step(now) {
            var p = Math.min(1, (now - t0) / BG_FADE);
            var e = cssEase(p);
            var c = p >= 1 ? target : "rgb(" + [0, 1, 2].map(function (i) {
                return Math.round(from[i] + (to[i] - from[i]) * e);
            }).join(", ") + ")";
            squares.forEach(function (sq) { sq.style.backgroundColor = c; });
            if (p < 1) bgFadeRaf = requestAnimationFrame(step);
        }
        bgFadeRaf = requestAnimationFrame(step);
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
    
    