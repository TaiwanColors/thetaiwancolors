document.addEventListener("DOMContentLoaded", function () {
    // 獲取 visibleicon 元素
    const visibleIcon = document.getElementById('visibleIcon');
    const hideIcon = document.getElementById('hideIcon');

    // 獲取需要設定 opacity 的元素
    const logo = document.getElementById('logo');
    const instagramText = document.querySelector('.Instagram-text');
    const youtubeText = document.querySelector('.YouTube-text');
    const threadsText = document.querySelector('.Threads-text');
    const rainButton = document.getElementById('rainButton');
    const snowButton = document.getElementById('snowButton');
    const foggyButton = document.getElementById('foggyButton');
    const starryskyButton = document.getElementById('starryskyButton');

    const ColorNames = document.querySelector('.ColorNames-text');
    const enColorNames = document.querySelector('.EnColorNames-text');
    const cText = document.querySelector('.C-text');
    const mText = document.querySelector('.M-text');
    const yText = document.querySelector('.Y-text');
    const kText = document.querySelector('.K-text');
    const rText = document.querySelector('.R-text');
    const gText = document.querySelector('.G-text');
    const bText = document.querySelector('.B-text');

    const cIntText = document.querySelector('.C-int-text');
    const mIntText = document.querySelector('.M-int-text');
    const yIntText = document.querySelector('.Y-int-text');
    const kIntText = document.querySelector('.K-int-text');
    const rIntText = document.querySelector('.R-int-text');
    const gIntText = document.querySelector('.G-int-text');
    const bIntText = document.querySelector('.B-int-text');
    const hexIntText = document.querySelector('.Hex-int-text');
    // 使用變數來跟蹤當前狀態和計時器
    let isHidden = false;
    let timeoutId = null;
    let buttonsDisabled = false; // 按鈕是否被禁用

    // 點選 visibleicon 時的事件處理程式
    visibleIcon.addEventListener('click', function () {
        // 清除先前的計時器
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // 根據當前狀態切換透明度
        if (isHidden) {
            visibleIcon.style.opacity = 1;
            hideIcon.style.opacity = 0;
            logo.style.opacity = 1;
            instagramText.style.opacity = 1;
            instagramText.style.cursor= "pointer"
            youtubeText.style.opacity = 1;
            youtubeText.style.cursor= "pointer"
            threadsText.style.opacity = 1;
            threadsText.style.cursor= "pointer"
            threadsText.style.pointerEvents = 'auto';
            rainButton.style.opacity = 1;
            rainButton.style.cursor= "pointer"
            snowButton.style.opacity = 1;
            snowButton.style.cursor= "pointer"
            foggyButton.style.opacity = 1;
            foggyButton.style.cursor= "pointer"
            starryskyButton.style.opacity = 1;
            starryskyButton.style.cursor= "pointer"

            ColorNames.style.opacity = 1;
            enColorNames.style.opacity = 1;
            cText.style.opacity = 1;
            mText.style.opacity = 1;
            yText.style.opacity = 1;
            kText.style.opacity = 1;
            rText.style.opacity = 1;
            gText.style.opacity = 1;
            bText.style.opacity = 1;

            cIntText.style.opacity = 1;
            mIntText.style.opacity = 1;
            yIntText.style.opacity = 1;
            kIntText.style.opacity = 1;
            rIntText.style.opacity = 1;
            gIntText.style.opacity = 1;
            bIntText.style.opacity = 1;
            hexIntText.style.opacity = 1;
        

            buttonsDisabled = false; // 啟用按鈕

            // 啟用 Instagram-text 的互動
            instagramText.style.pointerEvents = 'auto';
            rainButton.style.pointerEvents = 'auto';
            snowButton.style.pointerEvents = 'auto';
            foggyButton.style.pointerEvents = 'auto';
            starryskyButton.style.pointerEvents = 'auto';
            
        } else {
            visibleIcon.style.transition = 'opacity ease-out 0s';
            visibleIcon.style.opacity = 0;
            hideIcon.style.opacity = 1;
            hideIcon.style.transition = 'opacity ease-out 0s';
            logo.style.opacity = 0;
            instagramText.style.opacity = 0;
            instagramText.style.cursor= "default"
            youtubeText.style.opacity = 0;
            youtubeText.style.cursor= "default"
            threadsText.style.opacity = 0;
            threadsText.style.cursor= "default"
            threadsText.style.pointerEvents = 'none';
            rainButton.style.opacity = 0;
            snowButton.style.opacity = 0;
            foggyButton.style.opacity = 0;
            starryskyButton.style.opacity = 0;

            ColorNames.style.opacity = 0;
            enColorNames.style.opacity = 0;
            cText.style.opacity = 0;
            mText.style.opacity = 0;
            yText.style.opacity = 0;
            kText.style.opacity = 0;
            rText.style.opacity = 0;
            gText.style.opacity = 0;
            bText.style.opacity = 0;

            cIntText.style.opacity = 0;
            mIntText.style.opacity = 0;
            yIntText.style.opacity = 0;
            kIntText.style.opacity = 0;
            rIntText.style.opacity = 0;
            gIntText.style.opacity = 0;
            bIntText.style.opacity = 0;
            hexIntText.style.opacity = 0;

            buttonsDisabled = true; // 禁用按鈕

            // 禁用 Instagram-text 的互動
            instagramText.style.pointerEvents = 'none';
            rainButton.style.pointerEvents = 'none';
            snowButton.style.pointerEvents = 'none';
            foggyButton.style.pointerEvents = 'none';
            starryskyButton.style.pointerEvents = 'none';

            // 兩秒後將 visibleIcon 的透明度恢復並啟用按鈕
            timeoutId = setTimeout(function () {
                hideIcon.style.transition = 'opacity ease-out 1s';
                visibleIcon.style.transition = 'opacity ease-out 1s';
                hideIcon.style.opacity = 0;
                buttonsDisabled = false; // 啟用按鈕
            }, 2000);
        }

        // 根據按鈕是否被禁用來設定按鈕的功能

        // 切換狀態
        isHidden = !isHidden;
    });

});
