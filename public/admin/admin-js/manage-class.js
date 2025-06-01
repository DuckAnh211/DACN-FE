// Các biến và hằng số
const BASE_API_URL = 'http://localhost:8080/v1/api';
const API_ENDPOINTS = {
    GET_CLASSES: `${BASE_API_URL}/classrooms`,
    CREATE_CLASS: `${BASE_API_URL}/create-classroom`,
    UPDATE_CLASS: `${BASE_API_URL}/update-class`,
    DELETE_CLASS: `${BASE_API_URL}/delete-classroom`,
    GET_TEACHERS: `${BASE_API_URL}/teacher`
};

// Biến lưu trữ danh sách lớp học và giáo viên
let allClasses = [];
let allTeachers = [];
let currentClassId = null;

// DOM Elements
const classTableBody = document.getElementById('classTableBody');
const searchInput = document.getElementById('searchInput');
const addClass = document.getElementById('addClass');
const classModal = document.getElementById('classModal');
const classForm = document.getElementById('classForm');
const modalTitle = document.getElementById('modalTitle');
const teacherSelect = document.getElementById('teacher');

// Hàm khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    fetchClasses();
    fetchTeachers();
    
    // Event listeners
    searchInput.addEventListener('input', handleSearch);
    addClass.addEventListener('click', () => openModal('add'));
    document.getElementById('closeModal').addEventListener('click', closeModal);
    classForm.addEventListener('submit', handleClassFormSubmit);
});

// Hàm lấy danh sách lớp học
async function fetchClasses() {
    try {
        const response = await fetch(API_ENDPOINTS.GET_CLASSES);
        const data = await response.json();
        allClasses = data.data || [];
        displayClasses(allClasses);
    } catch (error) {
        console.error('Error fetching classes:', error);
        alert('Không thể tải danh sách lớp học');
    }
}

// Hàm lấy danh sách giáo viên
async function fetchTeachers() {
    try {
        const response = await fetch(API_ENDPOINTS.GET_TEACHERS);
        const data = await response.json();
        allTeachers = data.data || [];
        populateTeacherSelect();
    } catch (error) {
        console.error('Error fetching teachers:', error);
    }
}

// Hàm hiển thị danh sách lớp học
function displayClasses(classes) {
    if (!classTableBody) return;
    
    classTableBody.innerHTML = '';
    
    if (classes.length === 0) {
        classTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">Không có lớp học nào</td>
            </tr>
        `;
        return;
    }
    
    classes.forEach(classItem => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const teacherInfo = classItem.teacher ? 
            `${classItem.teacher.name} (${classItem.teacher.email})` : 
            'Chưa phân công';
        
        row.innerHTML = `
            <td class="px-4 py-3 border-b">${classItem.classCode || ''}</td>
            <td class="px-4 py-3 border-b">${classItem.className}</td>
            <td class="px-4 py-3 border-b">${classItem.subject}</td>
            <td class="px-4 py-3 border-b">${teacherInfo}</td>
            <td class="px-4 py-3 border-b">
                <div class="flex space-x-2">
                    <button class="delete-class text-red-500 hover:text-red-700" data-id="${classItem._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        classTableBody.appendChild(row);
    });
    
    // Thêm event listeners cho các nút
    document.querySelectorAll('.edit-class').forEach(button => {
        button.addEventListener('click', () => editClass(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-class').forEach(button => {
        button.addEventListener('click', () => deleteClass(button.dataset.id));
    });
}

// Hàm điền danh sách giáo viên vào select
function populateTeacherSelect() {
    const teacherSelect = document.getElementById('teacher');
    teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>';
    
    allTeachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher._id;
        // Hiển thị tên giáo viên và môn giảng dạy
        option.textContent = `${teacher.name} (${teacher.subject})`;
        // Lưu tên giáo viên vào data attribute để dễ truy xuất
        option.dataset.teacherName = teacher.name;
        teacherSelect.appendChild(option);
    });
}

// Hàm tìm kiếm lớp học
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayClasses(allClasses);
        return;
    }
    
    const filteredClasses = allClasses.filter(classItem => 
        classItem.className.toLowerCase().includes(searchTerm) ||
        classItem.subject.toLowerCase().includes(searchTerm) ||
        (classItem.teacher && classItem.teacher.name.toLowerCase().includes(searchTerm))
    );
    
    displayClasses(filteredClasses);
}

// Hàm mở modal
function openModal(mode, classId = null) {
    modalTitle.textContent = mode === 'add' ? 'Thêm lớp học mới' : 'Cập nhật lớp học';
    classForm.reset();
    currentClassId = classId;
    
    if (mode === 'edit' && classId) {
        const classItem = allClasses.find(c => c._id === classId);
        if (classItem) {
            document.getElementById('className').value = classItem.className;
            document.getElementById('subject').value = classItem.subject;
            document.getElementById('classCode').value = classItem.classCode || '';
            
            // Tìm và chọn giáo viên trong dropdown
            if (classItem.teacher) {
                const teacherSelect = document.getElementById('teacher');
                for (let i = 0; i < teacherSelect.options.length; i++) {
                    if (teacherSelect.options[i].dataset.teacherName === classItem.teacher.name) {
                        teacherSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    } else {
        // Nếu là thêm mới, tạo mã lớp tự động sau khi nhập tên lớp
        const classNameInput = document.getElementById('className');
        classNameInput.addEventListener('blur', () => {
            const classCodeInput = document.getElementById('classCode');
            if (!classCodeInput.value && classNameInput.value) {
                classCodeInput.value = generateClassCode(classNameInput.value);
            }
        });
    }
    
    classModal.classList.remove('hidden');
}

// Hàm đóng modal
function closeModal() {
    classModal.classList.add('hidden');
    currentClassId = null;
}

// Hàm xử lý submit form thêm/sửa lớp học
async function handleClassFormSubmit(event) {
    event.preventDefault();
    
    // Lấy thông tin lớp từ form
    const className = document.getElementById('className').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const teacherSelect = document.getElementById('teacher');
    
    // Nếu không có giáo viên nào được chọn
    if (teacherSelect.selectedIndex === 0) {
        alert("Vui lòng chọn giáo viên phụ trách");
        return;
    }
    
    // Lấy tên giáo viên từ data attribute thay vì text content
    const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
    const teacherName = selectedOption.dataset.teacherName;
    const classCode = document.getElementById('classCode').value.trim() || generateClassCode(className);
    
    // Kiểm tra dữ liệu đầu vào
    if (!className || !subject || !teacherName || !classCode) {
        alert("Vui lòng cung cấp đầy đủ thông tin lớp học (tên lớp, môn học, tên giáo viên, mã lớp)");
        return;
    }
    
    // Tạo đối tượng dữ liệu
    const classData = {
        className,
        subject,
        teacherName,
        classCode
    };
    
    if (currentClassId) {
        classData._id = currentClassId;
    }
    
    try {
        console.log("Sending data to:", API_ENDPOINTS.CREATE_CLASS);
        console.log("Data:", JSON.stringify(classData));
        
        // Gọi API để tạo/cập nhật lớp học
        const response = await fetch(currentClassId ? API_ENDPOINTS.UPDATE_CLASS : API_ENDPOINTS.CREATE_CLASS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("API response:", result);
        
        if (result.success) {
            alert(result.message || 'Thao tác thành công');
            closeModal();
            fetchClasses();
        } else {
            alert(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error saving class:', error);
        alert(`Không thể lưu thông tin lớp học: ${error.message}`);
    }
}

// Hàm tạo file HTML mới cho lớp học
async function createClassroomFile(classData) {
    try {
        // Đọc template
        const template = await fetch('/templates/classroom-template.html').then(res => res.text());
        
        // Thay thế các placeholder bằng dữ liệu thực
        const content = template
            .replace(/{{className}}/g, classData.className)
            .replace(/{{teacherName}}/g, classData.teacher ? classData.teacher.name : 'Chưa phân công')
            .replace(/{{classCode}}/g, classData._id);
            
        // Gọi API để lưu file mới
        await fetch(API_ENDPOINTS.CREATE_CLASS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                className: classData.className,
                subject: classData.subject,
                teacherName: classData.teacher ? classData.teacher.name : 'Chưa phân công'
            })
        });
    } catch (error) {
        console.error('Error creating classroom file:', error);
    }
}

// Hàm tạo mã lớp học tự động
function generateClassCode(className) {
    // Tạo mã lớp từ tên lớp, ví dụ: "Ngữ Văn 10" -> "LIT10A"
    const subjectPrefix = getSubjectPrefix(className);
    const classNumber = className.match(/\d+/)?.[0] || '';
    const randomSuffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    
    return `${subjectPrefix}${classNumber}${randomSuffix}`;
}

// Hàm lấy tiền tố môn học
function getSubjectPrefix(className) {
    const lowerClassName = className.toLowerCase();
    
    if (lowerClassName.includes('văn') || lowerClassName.includes('ngữ')) return 'LIT';
    if (lowerClassName.includes('toán')) return 'MATH';
    if (lowerClassName.includes('tiếng anh') || lowerClassName.includes('anh văn') || lowerClassName.includes('anh ngữ')) return 'ENG';
    if (lowerClassName.includes('lý')) return 'PHY';
    if (lowerClassName.includes('hóa')) return 'CHEM';
    if (lowerClassName.includes('sinh')) return 'BIO';
    if (lowerClassName.includes('sử')) return 'HIST';
    if (lowerClassName.includes('địa')) return 'GEO';
    
    // Mặc định lấy 3 ký tự đầu tiên của tên lớp
    return className.substring(0, 3).toUpperCase();
}

// Hàm sửa lớp học
function editClass(classId) {
    openModal('edit', classId);
}

// Hàm xóa lớp học
async function deleteClass(classId) {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
        return;
    }
    
    try {
        // Tìm lớp học trong danh sách để lấy classCode
        const classItem = allClasses.find(c => c._id === classId);
        if (!classItem) {
            alert('Không tìm thấy thông tin lớp học');
            return;
        }
        
        const classCode = classItem.classCode || classId;
        console.log('Đang xóa lớp học với mã:', classCode);
        
        // Kiểm tra endpoint API
        console.log('API endpoint:', API_ENDPOINTS.DELETE_CLASS);
        
        // Gửi classCode trong body của request DELETE
        const response = await fetch(API_ENDPOINTS.DELETE_CLASS, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classCode })
        });
        
        // Kiểm tra response trước khi parse JSON
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Kiểm tra xem response có phải là JSON hợp lệ không
        let result;
        try {
            result = responseText ? JSON.parse(responseText) : { success: true };
        } catch (e) {
            console.error('Error parsing JSON:', e);
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.success) {
            alert(result.message || 'Xóa lớp học thành công');
            fetchClasses();
        } else {
            alert(result.message || 'Có lỗi xảy ra khi xóa lớp học');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        alert('Không thể xóa lớp học: ' + error.message);
    }
}
