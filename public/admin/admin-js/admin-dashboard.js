// Cấu hình API
const BASE_API_URL = 'http://localhost:8080/v1/api';
const API_ENDPOINTS = {
    USERS: `${BASE_API_URL}/user`,
    TEACHERS: `${BASE_API_URL}/teacher`,
    CLASSES: `${BASE_API_URL}/classrooms`
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

        // Lấy danh sách lớp học từ API
        const classesResponse = await fetch(API_ENDPOINTS.CLASSES);
        const classesData = await classesResponse.json();
        const classes = classesData.data; // Lấy mảng lớp học từ response

        // Hiển thị tổng số lớp học
        const totalClassesElement = document.getElementById('totalClasses');
        if (totalClassesElement) {
            totalClassesElement.textContent = Array.isArray(classes) ? classes.length : 0;
        }

    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        // Hiển thị dấu gạch ngang nếu có lỗi
        const totalStudentsElement = document.getElementById('totalStudents');
        const totalTeachersElement = document.getElementById('totalTeachers');
        const totalClassesElement = document.getElementById('totalClasses');
        
        if (totalStudentsElement) {
            totalStudentsElement.textContent = '--';
        }
        if (totalTeachersElement) {
            totalTeachersElement.textContent = '--';
        }
        if (totalClassesElement) {
            totalClassesElement.textContent = '--';
        }
    }
}

// Gọi hàm khi trang được tải
document.addEventListener('DOMContentLoaded', fetchAndDisplayStatistics);
