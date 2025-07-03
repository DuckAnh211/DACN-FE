document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const teacherOption = document.getElementById("teacherOption");
    const studentOption = document.getElementById("studentOption");
    const switchSlider = document.getElementById("switchSlider");
    
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api'; //"https://dacn-be-hh2q.onrender.com/v1/api";
    const API_ENDPOINTS = {
        STUDENT_LOGIN: `${BASE_API_URL}/login`,
        TEACHER_LOGIN: `${BASE_API_URL}/teacher/login`
    };
    
    // Mặc định là giáo viên
    let userType = "teacher";
    
    // Xử lý sự kiện chuyển đổi
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
    
    if (!loginForm) {
        console.error("Không tìm thấy phần tử loginForm!");
        return;
    }

// ...existing code...
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Vui lòng không để trống!");
        return;
    }

    try {
        const apiEndpoint = userType === "teacher" ? API_ENDPOINTS.TEACHER_LOGIN : API_ENDPOINTS.STUDENT_LOGIN;
        const submitButton = this.querySelector("button[type='submit']");
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = "ĐANG XỬ LÝ...";
        submitButton.disabled = true;

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            mode: "cors",
            body: JSON.stringify({ 
                email, 
                password
            })
        });

        const data = await response.json();

        // Khôi phục trạng thái nút
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;

        // Kiểm tra trường EM trong phản hồi
        if (data.EM === "Login successful") {
            // Đăng nhập thành công
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userType", userType);

            if (userType === "teacher" && data.teacher) {
                localStorage.setItem("teacherName", data.teacher.name);
                localStorage.setItem("teacherSubject", data.teacher.subject);
            }

            if (userType === "teacher") {
                window.location.href = "classes_list.html";
            } else {
                window.location.href = "intro.html";
            }
        } else {
            alert(data.EM || "Đăng nhập thất bại!");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi kết nối đến server!");
        const submitButton = this.querySelector("button[type='submit']");
        submitButton.innerHTML = "ĐĂNG NHẬP";
        submitButton.disabled = false;
    }
});
});
