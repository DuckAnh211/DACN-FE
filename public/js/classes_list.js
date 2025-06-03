// DOM Elements
const classContainer = document.getElementById('classContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const subjectFilter = document.getElementById('subjectFilter');
const statusFilter = document.getElementById('statusFilter');
const searchResultContainer = document.getElementById('searchResultContainer');
const searchResultContent = document.getElementById('searchResultContent');
const btnCreateClass = document.getElementById('btnCreateClass');
const createClassModal = document.getElementById('createClassModal');
const closeCreateClassModal = document.getElementById('closeCreateClassModal');
const cancelCreateClass = document.getElementById('cancelCreateClass');
const createClassForm = document.getElementById('createClassForm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// API Endpoints
const BASE_API_URL = 'http://localhost:8080/v1/api';
const API_ENDPOINTS = {
    GET_CLASSES: `${BASE_API_URL}/classrooms`,
    CREATE_CLASS: `${BASE_API_URL}/classrooms`,
    GET_TEACHER_INFO: `${BASE_API_URL}/teacherinfo`
};

// Global Variables
let allClasses = [];
let teacherEmail = localStorage.getItem('userEmail');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    fetchClasses();
    
    // Search functionality
    searchBtn.addEventListener('click', searchClasses);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchClasses();
        }
    });
    
    // Filter functionality
    subjectFilter.addEventListener('change', filterClasses);
    statusFilter.addEventListener('change', filterClasses);
    
    // Create class modal
    btnCreateClass.addEventListener('click', openCreateClassModal);
    closeCreateClassModal.addEventListener('click', closeModal);
    cancelCreateClass.addEventListener('click', closeModal);
    createClassForm.addEventListener('submit', createNewClass);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === createClassModal) {
            closeModal();
        }
    });
});

// Fetch classes from API
function fetchClasses() {
    if (!classContainer) return;
    
    // Hiển thị loading
    classContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-500">Đang tải danh sách lớp học...</p>
        </div>
    `;
    
    // Lấy danh sách lớp học từ API
    fetch(`${API_ENDPOINTS.GET_CLASSES}?teacher=${teacherEmail}`)
        .then(response => response.json())
        .then(data => {
            // Kiểm tra dữ liệu trả về
            allClasses = Array.isArray(data) ? data : (data.data || []);
            
            // Lọc chỉ những lớp học mà giáo viên này dạy
            allClasses = allClasses.filter(classItem => {
                // Kiểm tra nếu teacher là object có thuộc tính email
                if (classItem.teacher && classItem.teacher.email) {
                    return classItem.teacher.email === teacherEmail;
                }
                // Kiểm tra nếu teacher là string email
                if (typeof classItem.teacher === 'string') {
                    return classItem.teacher === teacherEmail;
                }
                // Kiểm tra nếu teacherEmail tồn tại
                if (classItem.teacherEmail) {
                    return classItem.teacherEmail === teacherEmail;
                }
                return false;
            });
            
            displayClasses(allClasses);
        })
        .catch(error => {
            console.error('Error fetching classes:', error);
            classContainer.innerHTML = `
                <div class="col-span-3 text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-gray-500">Có lỗi xảy ra khi tải danh sách lớp học.</p>
                </div>
            `;
        });
}

// Display classes in the container
function displayClasses(classes) {
    if (!classContainer) return;
    
    // Xóa nội dung cũ
    classContainer.innerHTML = '';
    
    if (classes.length === 0) {
        classContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <i class="fas fa-info-circle text-blue-500 text-4xl mb-4"></i>
                <p class="text-gray-500">Bạn chưa được phân công lớp nào.</p>
                <button id="btnCreateFirstClass" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fas fa-plus-circle mr-1"></i> Tạo lớp học đầu tiên
                </button>
            </div>
        `;
        
        document.getElementById('btnCreateFirstClass').addEventListener('click', openCreateClassModal);
        return;
    }
    
    // Hiển thị danh sách lớp học
    classes.forEach(classItem => {
        // Xác định gradient và icon dựa trên môn học
        let gradientClass = 'from-blue-500 to-indigo-600';
        let iconClass = 'fas fa-book';
        let statusBadge = '';
        
        // Xác định màu sắc dựa trên môn học
        if (classItem.subject) {
            const subject = classItem.subject.toLowerCase();
            if (subject.includes('toán')) {
                gradientClass = 'from-pink-500 to-red-600';
                iconClass = 'fas fa-calculator';
            } else if (subject.includes('văn') || subject.includes('ngữ văn')) {
                gradientClass = 'from-green-500 to-teal-600';
                iconClass = 'fas fa-book';
            } else if (subject.includes('tiếng anh') || subject.includes('anh văn') || subject.includes('anh ngữ')) {
                gradientClass = 'from-yellow-400 to-orange-500';
                iconClass = 'fas fa-globe';
            } else if (subject.includes('vật lý')) {
                gradientClass = 'from-indigo-500 to-blue-600';
                iconClass = 'fas fa-atom';
            } else if (subject.includes('hóa học')) {
                gradientClass = 'from-purple-500 to-pink-600';
                iconClass = 'fas fa-flask';
            }
        }
        
        // Xác định trạng thái lớp học
        if (classItem.status === 'completed') {
            statusBadge = '<span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đã kết thúc</span>';
        } else {
            statusBadge = '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đang hoạt động</span>';
        }
        
        // Tạo thẻ lớp học
        const classCard = document.createElement('div');
        classCard.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        classCard.innerHTML = `
            <div class="bg-gradient-to-r ${gradientClass} h-24 flex items-center justify-center">
                <i class="${iconClass} text-white text-4xl"></i>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-gray-800 mb-1">${classItem.className || 'Không có tên'}</h3>
                <div class="text-xs text-gray-600 mb-2">
                    <i class="fas fa-fingerprint mr-1"></i> ${classItem.classCode}
                </div>
                <a href="teacher_class.html?code=${classItem.classCode}" 
                   class="block text-center bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors">
                    <i class="fas fa-door-open mr-1"></i> Vào lớp
                </a>
            </div>
        `;
        
        classContainer.appendChild(classCard);
    });
}

// Hiển thị tùy chọn cho lớp học
function showClassOptions(classCode) {
    // Tìm lớp học trong danh sách
    const classItem = allClasses.find(c => c.classCode === classCode);
    if (!classItem) return;
    
    // Hiển thị menu tùy chọn (có thể sử dụng thư viện như SweetAlert2)
    if (window.Swal) {
        Swal.fire({
            title: classItem.className,
            html: `
                <div class="text-left">
                    <p><strong>Mã lớp:</strong> ${classItem.classCode}</p>
                    <p><strong>Môn học:</strong> ${classItem.subject || 'Chưa xác định'}</p>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Chỉnh sửa',
            denyButtonText: 'Xóa lớp',
            cancelButtonText: 'Đóng'
        }).then((result) => {
            if (result.isConfirmed) {
                // Chỉnh sửa lớp học
                openEditClassModal(classItem);
            } else if (result.isDenied) {
                // Xóa lớp học
                confirmDeleteClass(classItem);
            }
        });
    } else {
        // Fallback nếu không có SweetAlert
        const action = confirm(`Bạn muốn thực hiện hành động gì với lớp ${classItem.className}?`);
        if (action) {
            openEditClassModal(classItem);
        }
    }
}

// Mở modal tạo lớp học mới
function openCreateClassModal() {
    if (!createClassModal) return;
    
    // Reset form
    createClassForm.reset();
    
    // Hiển thị modal
    createClassModal.classList.remove('hidden');
}

// Đóng modal
function closeModal() {
    if (!createClassModal) return;
    
    createClassModal.classList.add('hidden');
}

// Tạo lớp học mới
function createNewClass(event) {
    event.preventDefault();
    
    // Lấy dữ liệu từ form
    const className = document.getElementById('className').value;
    const classSubject = document.getElementById('classSubject').value;
    const classDescription = document.getElementById('classDescription').value;
    
    // Tạo đối tượng dữ liệu
    const classData = {
        className: className,
        subject: classSubject,
        description: classDescription,
        teacher: teacherEmail
    };
    
    // Gửi request tạo lớp học mới
    fetch(API_ENDPOINTS.CREATE_CLASS, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success || data._id) {
            // Hiển thị thông báo thành công
            showToast('Tạo lớp học mới thành công!');
            
            // Đóng modal
            closeModal();
            
            // Tải lại danh sách lớp học
            fetchClasses();
        } else {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
    })
    .catch(error => {
        console.error('Error creating class:', error);
        showToast('Có lỗi xảy ra khi tạo lớp học.', 'error');
    });
}

// Hiển thị lớp học trong container được chỉ định
function displayClassesInContainer(classes, container) {
    classes.forEach(classItem => {
        // Xác định gradient và icon dựa trên môn học
        let gradientClass = 'from-blue-500 to-indigo-600';
        let iconClass = 'fas fa-book';
        
        // Xác định màu sắc dựa trên môn học
        if (classItem.subject) {
            const subject = classItem.subject.toLowerCase();
            if (subject.includes('toán')) {
                gradientClass = 'from-pink-500 to-red-600';
                iconClass = 'fas fa-calculator';
            } else if (subject.includes('văn') || subject.includes('ngữ văn')) {
                gradientClass = 'from-green-500 to-teal-600';
                iconClass = 'fas fa-book';
            } else if (subject.includes('tiếng anh') || subject.includes('anh văn') || subject.includes('anh ngữ')) {
                gradientClass = 'from-yellow-400 to-orange-500';
                iconClass = 'fas fa-globe';
            }
        }
        
        // Tạo thẻ lớp học
        const classCard = document.createElement('div');
        classCard.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        classCard.innerHTML = `
            <div class="bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center">
    <i class="${iconClass} text-white text-4xl"></i>
</div>
<div class="p-4">
    <h3 class="text-lg font-bold text-gray-800 mb-1">${classItem.className || 'Không có tên'}</h3>
    <div class="text-xs text-gray-600 mb-2">
        <i class="fas fa-fingerprint mr-1"></i> ${classItem.classCode}
    </div>
    <div class="text-sm text-gray-600 mb-1">
        <i class="fas fa-chalkboard-teacher mr-1"></i> Giáo viên: ${teacherName}
    </div>
    <div class="text-sm text-gray-600 mb-1">
        <i class="fas fa-users mr-1"></i> Sĩ số: ${classItem.studentCount || 0} học sinh
    </div>
    <a href="classroom.html?code=${classItem.classCode}" 
       class="block text-center bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors">
        <i class="fas fa-door-open mr-1"></i> Vào lớp
    </a>
</div>

        `;
        
        container.appendChild(classCard);
    });
}

// Hiển thị thông báo
function showToast(message, type = 'success') {
    if (!toast || !toastMessage) return;
    
    // Đặt nội dung thông báo
    toastMessage.textContent = message;
    
    // Đặt màu sắc dựa trên loại thông báo
    if (type === 'success') {
        toast.classList.remove('bg-red-500');
        toast.classList.add('bg-green-500');
    } else {
        toast.classList.remove('bg-green-500');
        toast.classList.add('bg-red-500');
    }
    
    // Hiển thị thông báo
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}




