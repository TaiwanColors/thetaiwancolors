window.addEventListener("load", function() {

 // 獲取所有按鈕元素


 var boatContainerFrom = document.getElementById("boat_container_from");

 // 船的圖（同一個畫布大小 262.32×127.55，依序疊在一起）
 // 目前暫時換成企鵝船夫：boat_from_8.svg 是完整的一張（船＋企鵝）
 var imageFiles = [
     "image/boat_from_8.svg"
 ];
 // 原本的船（7 個圖層）；要換回來就把上面那組換成這組
 // var imageFiles = [
 //     "image/boat_from_3.svg",
 //     "image/boat_from_4.svg",
 //     "image/boat_from_5.svg",
 //     "image/boat_from_6.svg",
 //     "image/boat_from_7.svg",
 //     "image/boat_from_1.svg",
 //     "image/boat_from_2.svg"
 // ];

 var boatlightContainer = document.getElementById("boatlight_container");

 // 建立一個新的 Image 物件
 var image = new Image();

 // 指定要載入的影像 URL
 var imageUrl = "image/boatlight.png";

 // 設定影像的屬性
 image.src = imageUrl;
 image.id = "boatlight";

 // 將載入的影像新增到容器中
 boatlightContainer.appendChild(image);
 

 // 遍歷圖片檔名陣列，為每個檔名建立一個新的 <img> 元素並新增到容器中
 imageFiles.forEach(function(filename) {
     var imgElement = document.createElement("img");
     imgElement.src = filename;
     imgElement.id = "boat_from"; // 設定相同的 id
     boatContainerFrom.appendChild(imgElement);
     
 });
 


 


    // 船、色球容器、船燈的晃動已移到 fishing.js 的單一動畫迴圈裡，
    // 並用時間計算同一個正弦公式，好讓釣線的竿尖能直接算出位置、不必量 DOM。
    // 船燈的鐘擺改用 CSS @keyframes（styles.css 的 lantern-swing），由 GPU 合成。
var buttons = document.querySelectorAll(".circle-button");
buttons.forEach(function(button) {
    button.addEventListener("click", function() {
        // 獲取按鈕的背景顏色，包括透明度
        var bgColor = window.getComputedStyle(button).backgroundColor;

        // 獲取包含 SVG 的 <object> 元素
        var objectElement = document.getElementById("boat_soft_light");

        // 獲取內部的 SVG 文件
        var svgDoc = objectElement.contentDocument;

        // 獲取要更改顏色的路徑元素
        var pathElement = svgDoc.querySelector("path"); // 請確保選擇正確的路徑元素

        // 更改填充顏色（跟背景一樣 2.5 秒漸變；SVG 在 <object> 裡，外面的 CSS 管不到，所以在這裡設）
        pathElement.style.transition = "fill 2.5s";
        pathElement.style.fill = bgColor; // 設定填充顏色為按鈕的背景顏色
    });
});



});
