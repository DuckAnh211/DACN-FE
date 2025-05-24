// Cấu hình API
const API_URL = 'http://localhost:8080/v1/api/user';

// Hàm lấy và hiển thị số liệu thống kê
async function fetchAndDisplayStatistics() {
    try {
        // Lấy danh sách học viên từ API
        const response = await fetch(API_URL);
        const students = await response.json();

        // Hiển thị tổng số học viên
        const totalStudentsElement = document.getElementById('totalStudents');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = Array.isArray(students) ? students.length : 0;
        }

    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        // Hiển thị dấu gạch ngang nếu có lỗi
        const totalStudentsElement = document.getElementById('totalStudents');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = '--';
        }
    }
}

// Gọi hàm khi trang được tải
document.addEventListener('DOMContentLoaded', fetchAndDisplayStatistics);