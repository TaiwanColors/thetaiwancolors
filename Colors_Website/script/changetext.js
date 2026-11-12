// ===== 換色時的顏色資訊：舊的先淡出 → 換文字 → 淡入 =====
// 第一次釣到（資訊還隱藏時）直接換，淡入交給 fishing.js；之後每次換色都先淡出再淡入。
// changeTextColor.js 的文字顏色也走這裡，才不會在舊文字上先跳色。
(function () {
    var FADE_OUT = 450; // 毫秒，要跟 styles.css 的 body.color-info-out 一致
    var queue = null, timer = 0;
    window.colorInfoSwap = function (fn) {
        var body = document.body;
        if (body.classList.contains("awaiting-catch")) { fn(); return; }
        (queue = queue || []).push(fn);
        if (timer) return; // 淡出中又換色：等淡出結束一起換成最新的
        body.classList.remove("color-info-reveal");
        body.classList.add("color-info-out");
        timer = setTimeout(function () {
            var list = queue; queue = null; timer = 0;
            list.forEach(function (f) { f(); });
            body.classList.remove("color-info-out");
            void body.offsetWidth; // 讓淡入動畫重新開始
            body.classList.add("color-info-reveal");
        }, FADE_OUT);
    };
})();

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
                case "theme":
                    buttonTextMap = themeButtonTextMap; // 主題色
                    break;
                // 可以根據需要新增更多的顏色
            }

            // 獲取對應的資料
            var data = buttonTextMap[number];

            // 呼叫更新文字內容的函式
            window.colorInfoSwap(function () { updateTextContent(data); });
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
