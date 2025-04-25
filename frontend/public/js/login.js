document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) {
        console.error("Không tìm thấy phần tử loginForm!");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Vui lòng không để trống!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/v1/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", email);
                window.location.href = "intro.html"; // Changed back to dashboard.html
            } else {
                alert(data.message || "Đăng nhập thất bại!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi kết nối đến server!");
        }
    });
});
