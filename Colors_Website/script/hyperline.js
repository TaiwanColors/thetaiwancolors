document.addEventListener("DOMContentLoaded", function() {
    // 獲取 Instagram 文字元素
    const instagramLink = document.getElementById("instagram-link");

    // 新增單擊事件監聽器
    instagramLink.addEventListener("click", function() {
        // 在此處指定外部網站的URL
        const externalUrl = "https://www.instagram.com/taiwan_colors/"; // 將此連結替換為您想要的外部網站連結

        // 使用 window.open() 開啟外部連結
        window.open(externalUrl, "_blank");
    });

    // Threads
    const threadsLink = document.getElementById("threads-link");
    if (threadsLink) {
        threadsLink.addEventListener("click", function () {
            window.open("https://www.threads.com/@quill_its_too_late?igshid=NTc4MTIwNjQ2YQ==", "_blank");
        });
    }
});
