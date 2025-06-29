// Các biến và hằng số
const BASE_API_URL = 'http://localhost:8080/v1/api'; //'https://dacn-be-hh2q.onrender.com/v1/api';
const API_ENDPOINTS = {
    GET_TEACHERS: `${BASE_API_URL}/teacher`,
    CREATE_TEACHER: `${BASE_API_URL}/teacher/register`,
    UPDATE_TEACHER: `${BASE_API_URL}/update-teacher`,  // Giữ nguyên endpoint này
    DELETE_TEACHER: `${BASE_API_URL}/delete-teacher`
};
let currentTeacherId = null;

// Các elements
const teacherTableBody = document.getElementById('teacherTableBody');
const searchInput = document.getElementById('searchInput');
const addTeacherBtn = document.getElementById('addTeacherBtn');
const teacherModal = document.getElementById('teacherModal');
const teacherForm = document.getElementById('teacherForm');
const modalTitle = document.getElementById('modalTitle');

// Biến lưu trữ danh sách giáo viên gốc
let allTeachers = [];

// Hàm lấy danh sách giáo viên
async function fetchTeachers() {
    try {
        const response = await fetch(API_ENDPOINTS.GET_TEACHERS);
        const data = await response.json();
        allTeachers = data.data; // Lưu danh sách giáo viên gốc
        displayTeachers(data.data);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        alert('Không thể tải danh sách giáo viên');
    }
}

// Hàm tìm kiếm giáo viên
function searchTeachers(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const filteredTeachers = allTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm) ||
        teacher.subject.toLowerCase().includes(searchTerm)
    );
    displayTeachers(filteredTeachers);
}

// Event listener cho input tìm kiếm
searchInput.addEventListener('input', (e) => {
    searchTeachers(e.target.value);
});

// Hàm hiển thị danh sách giáo viên
function displayTeachers(teachers) {
    teacherTableBody.innerHTML = '';
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="text-sm font-medium text-gray-900">${teacher.name}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${teacher.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${teacher.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${teacher.address}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${teacher.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(teacher.dateOfBirth)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTeacher('${teacher.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTeacher('${teacher.email}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        teacherTableBody.appendChild(row);
    });
}

// Hàm format ngày tháng
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Hàm xóa giáo viên
async function deleteTeacher(email) {
    if (confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
        try {
            const response = await fetch(API_ENDPOINTS.DELETE_TEACHER, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                fetchTeachers(); // Refresh danh sách sau khi xóa
                alert(data.message || 'Xóa giáo viên thành công');
            } else {
                alert(data.message || 'Không thể xóa giáo viên');
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            alert('Không thể xóa giáo viên');
        }
    }
}

// Hàm mở modal thêm/sửa giáo viên
function openModal(mode = 'add', teacherId = null) {
    currentTeacherId = teacherId;
    modalTitle.textContent = mode === 'add' ? 'Thêm giáo viên mới' : 'Cập nhật thông tin giáo viên';
    teacherModal.classList.remove('hidden');
    
    if (mode === 'edit' && teacherId) {
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (teacher) {
            document.getElementById('name').value = teacher.name;
            document.getElementById('email').value = teacher.email;
            document.getElementById('phone').value = teacher.phone;
            document.getElementById('address').value = teacher.address;
            document.getElementById('subject').value = teacher.subject;
            document.getElementById('dateOfBirth').value = teacher.dateOfBirth.split('T')[0];
            document.getElementById('gender').value = teacher.gender;
        }
    } else {
        teacherForm.reset();
    }
}

// Hàm đóng modal
function closeModal() {
    teacherModal.classList.add('hidden');
    teacherForm.reset();
    currentTeacherId = null;
}

// Hàm chỉnh sửa giáo viên
function editTeacher(teacherId) {
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (teacher) {
        document.getElementById('name').value = teacher.name;
        document.getElementById('email').value = teacher.email;
        document.getElementById('phone').value = teacher.phone;
        document.getElementById('dateOfBirth').value = teacher.dateOfBirth.split('T')[0];
        document.getElementById('gender').value = teacher.gender || 'male'; // Thêm giá trị mặc định
        document.getElementById('address').value = teacher.address;
        document.getElementById('subject').value = teacher.subject;
        document.getElementById('qualification').value = teacher.qualification || '';
        
        // Ẩn trường mật khẩu khi cập nhật
        const passwordField = document.getElementById('password');
        passwordField.value = '';
        passwordField.required = false;
        passwordField.parentElement.style.display = 'none';
        
        modalTitle.textContent = 'Cập nhật thông tin giáo viên';
        teacherModal.classList.remove('hidden');
    }
}

// Sửa lại hàm submit form để tách riêng xử lý thêm mới và cập nhật
teacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value,
        subject: document.getElementById('subject').value,
        qualification: document.getElementById('qualification').value
    };

        let response;
        if (!currentTeacherId) {
            // Kiểm tra email trùng lặp khi thêm mới
            const existingTeacher = allTeachers.find(t => t.email === formData.email);
            if (existingTeacher) {
                alert('Email này đã được sử dụng. Vui lòng chọn email khác.');
                return;
            }
            // Thêm mới giáo viên
            formData.password = document.getElementById('password').value; // Lấy mật khẩu từ input
            if (!formData.password) {
                alert('Vui lòng nhập mật khẩu cho giáo viên mới');
                return;
            }
            response = await fetch(API_ENDPOINTS.CREATE_TEACHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Cập nhật giáo viên
            formData.id = currentTeacherId;
            response = await fetch(API_ENDPOINTS.UPDATE_TEACHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Có lỗi xảy ra');
        }

        const data = await response.json();
        alert(data.message || 'Thao tác thành công');
        closeModal();
        fetchTeachers(); // Refresh danh sách
    
});

// Thêm event listener cho nút thêm giáo viên
addTeacherBtn.addEventListener('click', () => {
    // Reset form và hiển thị trường password
    teacherForm.reset();
    const passwordField = document.getElementById('passwordField');
    passwordField.style.display = 'block';
    document.getElementById('password').required = true;
    
    // Mở modal ở chế độ thêm mới
    openModal('add');
});

// Hàm chỉnh sửa giáo viên
// Sửa lại hàm editTeacher để lưu currentTeacherId
function editTeacher(teacherId) {
    currentTeacherId = teacherId; // Thêm dòng này
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (teacher) {
        document.getElementById('name').value = teacher.name;
        document.getElementById('email').value = teacher.email;
        document.getElementById('phone').value = teacher.phone;
        document.getElementById('dateOfBirth').value = teacher.dateOfBirth.split('T')[0];
        document.getElementById('gender').value = teacher.gender || 'male';
        document.getElementById('address').value = teacher.address;
        document.getElementById('subject').value = teacher.subject;
        document.getElementById('qualification').value = teacher.qualification || '';
        
        // Ẩn trường mật khẩu khi cập nhật
        const passwordField = document.getElementById('passwordField');
        passwordField.style.display = 'none';
        document.getElementById('password').required = false;
        
        modalTitle.textContent = 'Cập nhật thông tin giáo viên';
        teacherModal.classList.remove('hidden');
    }
}

// Sửa lại phần xử lý cập nhật trong event listener của form
teacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: !currentTeacherId ? document.getElementById('password').value || 'Teacher@123' : undefined,
        phone: document.getElementById('phone').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value,
        subject: document.getElementById('subject').value,
        qualification: document.getElementById('qualification').value
    };

    try {
        let response;
        if (!currentTeacherId) {
            // Thêm mới giáo viên
            response = await fetch(API_ENDPOINTS.CREATE_TEACHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || 'Tạo tài khoản giáo viên thành công');
                closeModal();
                fetchTeachers(); // Refresh danh sách
            } 
        } else {
            // Cập nhật giáo viên
            delete formData.password; // Đảm bảo không gửi password khi cập nhật
            formData.id = currentTeacherId;
            response = await fetch(API_ENDPOINTS.UPDATE_TEACHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || 'Cập nhật thông tin giáo viên thành công');
                closeModal();
                fetchTeachers(); // Refresh danh sách
            } 
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Load danh sách giáo viên khi trang được tải
document.addEventListener('DOMContentLoaded', fetchTeachers);
// Thêm event listener cho nút đóng modal
document.getElementById('closeModal').addEventListener('click', closeModal);