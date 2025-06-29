document.getElementById("signupForm").addEventListener("submit", async function (event) {
    event.preventDefault();
  
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    // Add new fields
    const phone = document.getElementById("phone").value;
    const dateOfBirth = document.getElementById("dateOfBirth").value;
    const gender = document.getElementById("gender").value;
    const address = document.getElementById("address").value;
  
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8080/v1/api/register", { //"https://dacn-be-hh2q.onrender.com/v1/api/register"
        method: "POST", 
        headers: { 
            "Content-Type": "application/json"
        },
        mode: "cors", // Bật CORS
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          phone,
          dateOfBirth,
          gender,
          address 
        }),
    })
    
  
      const data = await response.json();
      if (response.ok) {
        alert("Đăng ký thành công!");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Đăng ký thất bại!");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi kết nối đến server!");
    }
  });
  
