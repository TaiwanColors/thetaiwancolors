document.addEventListener("DOMContentLoaded", function() {
    // 社群連結（點文字開新分頁）
    // 舊的連結先備註留著：
    //   Instagram: https://www.instagram.com/taiwan_colors/
    //   YouTube:   （原本沒有設定連結）
    //   Threads:   https://www.threads.com/@quill_its_too_late?igshid=NTc4MTIwNjQ2YQ==
    const LINKS = {
        "instagram-link": "https://www.instagram.com/schuanglawyer/",
        "YouTube-link":   "https://www.youtube.com/watch?v=BSJEFkm9vZM",
        "threads-link":   "https://www.threads.com/@schuanglawyer?hl=zh-tw",
    };

    Object.keys(LINKS).forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("click", function () {
            window.open(LINKS[id], "_blank");
        });
    });
});
