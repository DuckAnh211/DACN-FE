// Cấu hình API
const API_ENDPOINTS = {
    USERS: 'http://localhost:8080/v1/api/user',
    TEACHERS: 'http://localhost:8080/v1/api/teacher'
};

// Hàm lấy và hiển thị số liệu thống kê
async function fetchAndDisplayStatistics() {
    try {
        // Lấy danh sách học viên từ API
        const studentsResponse = await fetch(API_ENDPOINTS.USERS);
        const students = await studentsResponse.json();

        // Hiển thị tổng số học viên
        const totalStudentsElement = document.getElementById('totalStudents');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = Array.isArray(students) ? students.length : 0;
        }

        // Lấy danh sách giáo viên từ API
        const teachersResponse = await fetch(API_ENDPOINTS.TEACHERS);
        const teachersData = await teachersResponse.json();
        const teachers = teachersData.data; // Lấy mảng giáo viên từ response

        // Hiển thị tổng số giáo viên
        const totalTeachersElement = document.getElementById('totalTeachers');
        if (totalTeachersElement) {
            totalTeachersElement.textContent = Array.isArray(teachers) ? teachers.length : 0;
        }

    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        // Hiển thị dấu gạch ngang nếu có lỗi
        const totalStudentsElement = document.getElementById('totalStudents');
        const totalTeachersElement = document.getElementById('totalTeachers');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = '--';
        }
        if (totalTeachersElement) {
            totalTeachersElement.textContent = '--';
        }
    }
}

// Gọi hàm khi trang được tải
document.addEventListener('DOMContentLoaded', fetchAndDisplayStatistics);