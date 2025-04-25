const express = require('express');
const bodyParser = require('body-parser');
const { createUser, handleLogin, getUser, forgotPassword, resetPassword } = require('../controllers/userController');
const { findUserByEmail, updateUser } = require('../services/userService');
const routerAPI = express.Router();

 // Middleware để parse JSON và URL-encoded data
routerAPI.use(express.json());  // Parse application/json
routerAPI.use(express.urlencoded({ extended: true }));

routerAPI.get("/", (req, res) => {
    return res.status(200).json("Hello world api");
});

routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);
routerAPI.get("/user", getUser);

// Route quên mật khẩu
routerAPI.post('/forgot-password', forgotPassword);

// Route đặt lại mật khẩu mới
routerAPI.post('/reset-password', resetPassword);
routerAPI.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: "Token is missing" });
    }
    // Hiển thị form đơn giản với token
    res.status(200).send(`
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #e2e2e2;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            text-align: center;
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            width: 300px;
        }
        .logo {
            width: 200px;
            height: 200px;
            margin-bottom: 10px;
        }
        h2 {
            color: #333;
        }
        input[type="password"] {
            width: 93%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button {
            width: 100%;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:disabled {
            background-color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.jpg" alt="Logo" class="logo" />
        <h2>Quên mật khẩu</h2>
        <form action="/v1/api/reset-password" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <input type="password" name="newPassword" placeholder="Nhập mật khẩu mới" required />
            <button type="submit">Reset Password</button>
        </form>
    </div>
</body>
</html>

    `);
});
routerAPI.get('/username', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Return all user profile information
        res.status(200).json({ 
            success: true, 
            email: user.email, 
            name: user.name,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// API POST để cập nhật username và password
routerAPI.post('/update-user', async (req, res) => {
    const { name, email, password } = req.body;

  // Kiểm tra đầu vào
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ name, email và password.' });
  }

  try {
    // Tìm người dùng theo email
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email được cung cấp.' });
    }

    // Cập nhật name và password
    const updatedUser = await updateUser(email, { name, password });

    return res.status(200).json({
      message: 'Thông tin tài khoản đã được cập nhật thành công.',
  
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật tài khoản.' });
  }
});
module.exports = routerAPI;
