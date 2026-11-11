window.addEventListener("load", function() {
    
    // 獲取所有按鈕元素
    var buttons = document.querySelectorAll(".circle-button");
    
    //好用偵測
   //console.log("Selected Color:", buttons);
    
    // 初始底色固定為 #4C4C4C（原本是隨機挑一顆色球的顏色）
    // 還沒釣到魚之前，瓶子是空的、顏色資訊也先不顯示（fishing.js）
    var randomColor = "rgb(76, 76, 76)";

    var backgrounds = document.querySelectorAll(".square");
    
    backgrounds.forEach(function(square) {
        square.style.backgroundColor = randomColor;
    });

    (function() {

    //獲取包含 SVG 的 <object> 元素
    var objectElement = document.getElementById("boat_soft_light");

    // 獲取內部的 SVG 文件
    var svgDoc = objectElement.contentDocument;

    // 獲取要更改顏色的路徑元素
    var pathElement = svgDoc.querySelector("path"); // 請確保選擇正確的路徑元素

    // 更改填充顏色
    pathElement.style.fill = randomColor; // 設定填充顏色

    })();

    // （原本會把隨機挑中的色球設成目前的顏色，並填上它的色名、CMYK、RGB；
    //   現在初始是固定底色，第一次釣到魚時才會有顏色資訊）

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
    
    (function() {
       
        // 獲取按鈕的背景顏色
        var buttonColor = randomColor;

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

        var HexIntText = document.getElementById("HexintText-link");

        var rainButton = document.getElementById("rainButton");
            var snowButton = document.getElementById("snowButton");
            var foggyButton = document.getElementById("foggyButton");
            var starryskyButton = document.getElementById("starryskyButton");

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
            bIntText.style.color = "rgba(255, 255, 255, 0.4)";
            HexIntText.style.color = "rgba(255, 255, 255, 1)";

            rainButton.style.background = "rgba(0, 0, 0, 0)";
            snowButton.style.background = "rgba(0, 0, 0, 0)";
            foggyButton.style.background = "rgba(0, 0, 0, 0)";
            starryskyButton.style.background = "rgba(0, 0, 0, 0)";
        }
    })();


    (function() {
        
            // 獲取按鈕的背景顏色
            var buttonColor = randomColor;

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
     
        })();
    
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
