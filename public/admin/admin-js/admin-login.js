document.addEventListener("DOMContentLoaded", function () {
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (!adminLoginForm) {
        console.error("Không tìm thấy phần tử adminLoginForm!");
        return;
    }

    adminLoginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("Vui lòng không để trống!");
            return;
        }

        // Kiểm tra tài khoản admin cố định
        if (username === "admin" && password === "123") {
            // Lưu thông tin đăng nhập admin vào localStorage
            localStorage.setItem("adminLoggedIn", "true");
            
            // Chuyển hướng đến trang quản trị
            window.location.href = "./admin-dashboard.html";
        } else {
            alert("Tên đăng nhập hoặc mật khẩu không đúng!");
        }
    });
});