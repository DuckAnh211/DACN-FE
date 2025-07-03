document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("forgotPassForm");
    const messageDiv = document.getElementById("message");
    const teacherOption = document.getElementById("teacherOption");
    const studentOption = document.getElementById("studentOption");
    const switchSlider = document.getElementById("switchSlider");

    // Base API URL
    const BASE_API_URL = "http://localhost:8080/v1/api";

    // API endpoints
    const API_ENDPOINTS = {
        student: `${BASE_API_URL}/forgot-password`,
        teacher: `${BASE_API_URL}/teacher/forgot-password`
    };

    // Default mode
    let userType = "teacher";

    // Switch event
    teacherOption.addEventListener("click", function() {
        userType = "teacher";
        teacherOption.classList.add("active");
        studentOption.classList.remove("active");
        switchSlider.className = "switch-slider teacher";
    });
    studentOption.addEventListener("click", function() {
        userType = "student";
        studentOption.classList.add("active");
        teacherOption.classList.remove("active");
        switchSlider.className = "switch-slider student";
    });

    function showMessage(message, type = "success") {
        messageDiv.innerHTML = `<div class="alert ${type === "success" ? "alert-success" : "alert-error"}">${message}</div>`;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        messageDiv.innerHTML = "";
        const email = document.getElementById("email").value.trim();
        if (!email) {
            showMessage("Vui lòng nhập email!", "error");
            return;
        }
        const submitBtn = form.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang gửi...";

        try {
            const response = await fetch(API_ENDPOINTS[userType], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (data.success) {
                showMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư!", "success");
            } else {
                showMessage("Không thể gửi email. Vui lòng kiểm tra lại email!", "error");
            }
        } catch (err) {
            showMessage("Có lỗi xảy ra. Vui lòng thử lại sau!", "error");
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "Gửi email đặt lại mật khẩu";
    });
});