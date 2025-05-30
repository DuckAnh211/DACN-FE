// Các biến và hằng số
const BASE_API_URL = 'http://localhost:8080/v1/api';
const API_ENDPOINTS = {
    GET_USERS: `${BASE_API_URL}/user`,
    DELETE_USER: `${BASE_API_URL}/delete-user`
};
let currentStudentId = null;

// Các elements
const studentTableBody = document.getElementById('studentTableBody');
const searchInput = document.getElementById('searchInput');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');

// Biến lưu trữ danh sách học viên gốc
let allStudents = [];

// Cập nhật hàm fetchStudents để lưu danh sách học viên gốc 
async function fetchStudents() {
    try {
        const response = await fetch(API_ENDPOINTS.GET_USERS);
        const data = await response.json();
        allStudents = data; // Lưu danh sách học viên gốc
        displayStudents(data);
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Không thể tải danh sách học viên');
    }
}

// Thêm hàm tìm kiếm học viên
function searchStudents(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const filteredStudents = allStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm)
    );
    displayStudents(filteredStudents);
}

// Thêm event listener cho input tìm kiếm
searchInput.addEventListener('input', (e) => {
    searchStudents(e.target.value);
});

// Hàm hiển thị danh sách học viên
function displayStudents(students) {
    studentTableBody.innerHTML = '';
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student._id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="text-sm font-medium text-gray-900">${student.name}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.address}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(student.dateOfBirth)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="deleteStudent('${student.email}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

// Hàm format ngày tháng
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Hàm xóa học viên
async function deleteStudent(email) {
    if (confirm('Bạn có chắc chắn muốn xóa học viên này?')) {
        try {
            const response = await fetch(API_ENDPOINTS.DELETE_USER, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            const data = await response.json();
            if (response.ok) {
                fetchStudents();
                alert('Xóa học viên thành công');
            } else {
                alert(data.message || 'Không thể xóa học viên');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Không thể xóa học viên');
        }
    }
}

// Xử lý submit form
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: 'male', // Mặc định
        password: '123456' // Mặc định
    };

    try {
        const url = currentStudentId ? `${API_URL}/${currentStudentId}` : API_URL;
        const method = currentStudentId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeModalHandler();
            fetchStudents();
            alert(currentStudentId ? 'Cập nhật thành công' : 'Thêm học viên thành công');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        alert('Không thể lưu thông tin học viên');
    }
}

// Xử lý tìm kiếm
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = studentTableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', fetchStudents);
addStudentBtn.addEventListener('click', () => openModal(false));
closeModal.addEventListener('click', closeModalHandler);
studentForm.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', handleSearch);