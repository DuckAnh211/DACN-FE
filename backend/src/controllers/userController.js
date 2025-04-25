const { createResetToken, createUserService, loginService, getUserService, sendResetEmail, findUserByEmail, updateUserPassword } = require("../services/userService");
const jwt = require('jsonwebtoken');

const createUser = async (req, res) => {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;
    
    // Kiểm tra độ phức tạp của mật khẩu
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái in hoa, chữ cái thường, và ký tự đặc biệt.'
        });
    }
    
    // Pass all user profile data to the service
    const data = await createUserService(name, email, password, phone, dateOfBirth, gender, address);
    return res.status(200).json(data);
};

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    const data = await loginService(email, password);
    return res.status(200).json(data);
};

const getUser = async (req, res) => {
    const data = await getUserService();
    return res.status(200).json(data);
};

// Controller cho quên mật khẩu
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false});
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false});
        }

        const token = createResetToken(user.id);
        const emailSent = await sendResetEmail(email, token);

        if (emailSent) {
            return res.status(200).json({ success: true});
        } else {
            return res.status(500).json({ success: false});
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false});
    }
};

// Controller cho đặt lại mật khẩu
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
// Kiểm tra độ phức tạp của mật khẩu mới
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
if (!passwordRegex.test(newPassword)) {
    return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thông báo</title>
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                    background-color: #f2f2f2;
                    margin: 0;
                }
                .table {
                    border: 1px solid #ddd;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    width: 300px;
                    text-align: center;
                }
                .table h2 {
                    color: #FF0000;
                    margin: 0 0 10px;
                }
                .table p {
                    color: #333;
                    font-size: 14px;
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="table">
                <h2>Thông báo</h2>
                <p>Mật khẩu phải có ít nhất 6 ký tự, bao gồm: chữ cái in hoa, chữ cái thường, và ký tự đặc biệt.</p>
            </div>
        </body>
        </html>
    `);
}


try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Cập nhật mật khẩu mà không mã hóa
    const success = await updateUserPassword(userId, newPassword);
    if (success) {
        res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thông báo</title>
                <style>
                    body {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        font-family: Arial, sans-serif;
                        background-color: #f2f2f2;
                        margin: 0;
                    }
                    .table {
                        border: 1px solid #ddd;
                        padding: 10px;
                        background-color: #fff;
                        border-radius: 5px;
                        width: 300px;
                        text-align: center;
                    }
                    .table h2 {
                        color: #4CAF50;
                    }
                    .table p {
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <div class="table">
                    <h2>Thông báo</h2>
                    <p>Mật khẩu đã được cập nhật thành công.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        res.status(400).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thông báo</title>
                <style>
                    body {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        font-family: Arial, sans-serif;
                        background-color: #f2f2f2;
                        margin: 0;
                    }
                    .table {
                        border: 1px solid #ddd;
                        padding: 10px;
                        background-color: #fff;
                        border-radius: 5px;
                        width: 300px;
                        text-align: center;
                    }
                    .table h2 {
                        color: #FF0000;
                    }
                    .table p {
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <div class="table">
                    <h2>Thông báo</h2>
                    <p>Không thể cập nhật mật khẩu.</p>
                </div>
            </body>
            </html>
        `);
    }
} catch (error) {
    console.log("Error in resetPassword:", error);
    res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thông báo</title>
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                    background-color: #f2f2f2;
                    margin: 0;
                }
                .table {
                    border: 1px solid #ddd;
                    padding: 10px;
                    background-color: #fff;
                    border-radius: 5px;
                    width: 300px;
                    text-align: center;
                }
                .table h2 {
                    color: #FF0000;
                }
                .table p {
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="table">
                <h2>Thông báo</h2>
                <p>Đã có lỗi, cập nhật mật khẩu thất bại!</p>
            </div>
        </body>
        </html>
    `);
}

};

module.exports = {
    createUser,
    handleLogin,
    getUser,
    forgotPassword,
    resetPassword
};
