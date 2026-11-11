document.addEventListener("DOMContentLoaded", function () {
    const starryskyButton = document.getElementById("starryskyButton");
    let isFogActive = false;
    
    starryskyButton.addEventListener("click", () => {
        isFogActive = !isFogActive; // 切換霧狀態

        if (!isFogActive) {
            starryskyButton.style.border = "1px solid rgba(255, 255, 255, 0.4)";
            const starlightB_1s = document.querySelectorAll(".starlightB_1");
            const starlightB_2s = document.querySelectorAll(".starlightB_2");
            const starlightB_3s = document.querySelectorAll(".starlightB_3");
            const starlightSB_1s = document.querySelectorAll(".starlightSB_1");
            const starlightSB_2s = document.querySelectorAll(".starlightSB_2");
            const starlightSB_3s = document.querySelectorAll(".starlightSB_3");
            starlightB_1s.forEach((starlightB_1) => {
            starlightB_1.style.opacity =0.4;
            });
            starlightB_2s.forEach((starlightB_2) => {
                starlightB_2.style.opacity =0.4;
            });
            
            starlightB_3s.forEach((starlightB_3) => {
                    starlightB_3.style.opacity =0.4;
            });

            starlightSB_1s.forEach((starlightSB_1) => {
                starlightSB_1.style.opacity =0.4;
                });
                starlightSB_2s.forEach((starlightSB_2) => {
                    starlightSB_2.style.opacity =0.4;
                });
                
                starlightSB_3s.forEach((starlightSB_3) => {
                        starlightSB_3.style.opacity =0.4;
                });

            const meteorBs = document.querySelectorAll(".meteorB_4");
            meteorBs.forEach((meteorB) => {
                meteorB.style.opacity = 0.4;
            });
        } else {
            starryskyButton.style.border = "1px solid rgba(255, 255, 255, 1)";
            const starlightB_1s = document.querySelectorAll(".starlightB_1");
            const starlightB_2s = document.querySelectorAll(".starlightB_2");
            const starlightB_3s = document.querySelectorAll(".starlightB_3");
            const starlightSB_1s = document.querySelectorAll(".starlightSB_1");
            const starlightSB_2s = document.querySelectorAll(".starlightSB_2");
            const starlightSB_3s = document.querySelectorAll(".starlightSB_3");
            starlightB_1s.forEach((starlightB_1) => {
            starlightB_1.style.opacity =1;
            });
            starlightB_2s.forEach((starlightB_2) => {
                starlightB_2.style.opacity =1;
            });
            
            starlightB_3s.forEach((starlightB_3) => {
                    starlightB_3.style.opacity =1;
            });

            starlightSB_1s.forEach((starlightSB_1) => {
                starlightSB_1.style.opacity =1;
                });
                starlightSB_2s.forEach((starlightSB_2) => {
                    starlightSB_2.style.opacity =1;
                });
                
                starlightSB_3s.forEach((starlightSB_3) => {
                        starlightSB_3.style.opacity =1;
                });
            const meteorBs = document.querySelectorAll(".meteorB_4");
            meteorBs.forEach((meteorB) => {
                meteorB.style.opacity = 1;
            });
        }
    });

});