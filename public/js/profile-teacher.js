document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    if (!userEmail) {
        console.error('No email found in localStorage');
        window.location.href = '/login.html';
        return;
    }

    // Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');
    const teachingClassesContainer = document.getElementById('teachingClasses');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Display elements
    const userNameElement = document.getElementById('userName');
    const nameDisplay = document.getElementById('nameDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const dobDisplay = document.getElementById('dobDisplay');
    const genderDisplay = document.getElementById('genderDisplay');
    const addressDisplay = document.getElementById('addressDisplay');
    const subjectDisplay = document.getElementById('subjectDisplay');
    const qualificationDisplay = document.getElementById('qualificationDisplay');

    // Edit elements
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const dobInput = document.getElementById('dobInput');
    const genderInput = document.getElementById('genderInput');
    const addressInput = document.getElementById('addressInput');
    const subjectInput = document.getElementById('subjectInput');
    const qualificationInput = document.getElementById('qualificationInput');

    // Statistics elements
    const totalClasses = document.getElementById('totalClasses');
    const totalStudents = document.getElementById('totalStudents');
    const totalExams = document.getElementById('totalExams');
    const totalQuestions = document.getElementById('totalQuestions');

    // API Endpoints
    const BASE_API_URL = 'http://localhost:8080/v1/api';
    const API_ENDPOINTS = {
        GET_TEACHER_INFO: `${BASE_API_URL}/teacherinfo`,
        UPDATE_TEACHER: `${BASE_API_URL}/update-teacher`,
        GET_TEACHING_CLASSES: `${BASE_API_URL}/classrooms`, // Thay đổi endpoint
        CHANGE_PASSWORD: `${BASE_API_URL}/change-password`,
        GET_TEACHER_STATS: `${BASE_API_URL}/teacher-stats`
    };
    
    // Hàm chuyển đổi giới tính từ mã sang chữ
    function translateGender(gender) {
        switch(gender) {
            case 'male':
            case 'Nam':
                return 'Nam';
            case 'female':
            case 'Nữ':
                return 'Nữ';
            default:
                return 'Không xác định';
        }
    }
    
    // Hàm định dạng ngày tháng
    function formatDate(dateString) {
        if (!dateString) return '';
        
        // Kiểm tra nếu dateString đã ở định dạng dd/mm/yyyy
        if (dateString.includes('/')) return dateString;
        
        // Xử lý định dạng ISO hoặc yyyy-mm-dd
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('vi-VN');
    }
    
    // Fetch and display teacher data
    function fetchTeacherData() {
        fetch(`${API_ENDPOINTS.GET_TEACHER_INFO}?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update display view
                    if (userNameElement) userNameElement.textContent = data.name || 'Không có tên';
                    if (nameDisplay) nameDisplay.textContent = data.name || 'Chưa cập nhật';
                    if (emailDisplay) emailDisplay.textContent = data.email || userEmail;
                    if (phoneDisplay) phoneDisplay.textContent = data.phone || 'Chưa cập nhật';
                    if (dobDisplay) dobDisplay.textContent = formatDate(data.dateOfBirth) || 'Chưa cập nhật';
                    if (genderDisplay) genderDisplay.textContent = translateGender(data.gender) || 'Chưa cập nhật';
                    if (addressDisplay) addressDisplay.textContent = data.address || 'Chưa cập nhật';
                    if (subjectDisplay) subjectDisplay.textContent = data.subject || 'Chưa cập nhật';
                    if (qualificationDisplay) qualificationDisplay.textContent = data.qualification || 'Chưa cập nhật';

                    // Lưu tên giáo viên vào localStorage
                    localStorage.setItem('teacherName', data.name || 'Giáo viên');
                    localStorage.setItem('teacherSubject', data.subject || 'Chưa có thông tin');

                    // Update form inputs
                    if (nameInput) nameInput.value = data.name || '';
                    if (emailInput) emailInput.value = data.email || userEmail;
                    if (phoneInput) phoneInput.value = data.phone || '';
                    if (dobInput) dobInput.value = data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '';
                    if (genderInput) genderInput.value = data.gender || 'unknown';
                    if (addressInput) addressInput.value = data.address || '';
                    if (subjectInput) subjectInput.value = data.subject || '';
                    if (qualificationInput) qualificationInput.value = data.qualification || '';
                }
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
                alert('Có lỗi xảy ra khi tải thông tin');
            });
    }

    // Fetch teaching classes
    function fetchTeachingClasses() {
        if (!teachingClassesContainer) return;

        // Hiển thị loading
        teachingClassesContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách lớp học...</p>
            </div>
        `;

        // Lấy email giáo viên từ localStorage
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            teachingClassesContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-circle text-yellow-500 text-2xl mb-2"></i>
                    <p class="text-gray-500">Vui lòng đăng nhập để xem danh sách lớp học.</p>
                </div>
            `;
            return;
        }

        // Sử dụng API classrooms để lấy tất cả lớp học
        fetch(`${API_ENDPOINTS.GET_TEACHING_CLASSES}`)
            .then(response => response.json())
            .then(data => {
                // Kiểm tra dữ liệu trả về
                let allClasses = Array.isArray(data) ? data : (data.data || []);
                
                // Lọc chỉ những lớp học mà giáo viên này dạy
                const teachingClasses = allClasses.filter(classItem => {
                    // Kiểm tra nếu teacher là object có thuộc tính email
                    if (classItem.teacher && classItem.teacher.email) {
                        return classItem.teacher.email === userEmail;
                    }
                    // Kiểm tra nếu teacher là string email
                    if (typeof classItem.teacher === 'string') {
                        return classItem.teacher === userEmail;
                    }
                    // Kiểm tra nếu teacherEmail tồn tại
                    if (classItem.teacherEmail) {
                        return classItem.teacherEmail === userEmail;
                    }
                    return false;
                });
                
                if (teachingClasses.length === 0) {
                    teachingClassesContainer.innerHTML = `
                        <div class="text-center py-4">
                            <i class="fas fa-info-circle text-blue-500 text-2xl mb-2"></i>
                            <p class="text-gray-500">Bạn chưa được phân công lớp nào.</p>
                        </div>
                    `;
                    return;
                }

                teachingClassesContainer.innerHTML = '';
                
                teachingClasses.forEach(classItem => {
                    // Xác định màu sắc và biểu tượng dựa trên môn học
                    let bgColor, iconClass, textColor;
                    
                    const subject = classItem.subject ? classItem.subject.toLowerCase() : '';
                    
                    if (subject.includes('toán')) {
                        bgColor = 'bg-blue-100';
                        iconClass = 'fas fa-calculator';
                        textColor = 'text-blue-500';
                    } else if (subject.includes('vật lý')) {
                        bgColor = 'bg-purple-100';
                        iconClass = 'fas fa-atom';
                        textColor = 'text-purple-500';
                    } else if (subject.includes('hóa học')) {
                        bgColor = 'bg-green-100';
                        iconClass = 'fas fa-flask';
                        textColor = 'text-green-500';
                    } else if (subject.includes('văn') || subject.includes('ngữ văn')) {
                        bgColor = 'bg-yellow-100';
                        iconClass = 'fas fa-book';
                        textColor = 'text-yellow-600';
                    } else if (subject.includes('anh') || subject.includes('tiếng anh')) {
                        bgColor = 'bg-red-100';
                        iconClass = 'fas fa-globe';
                        textColor = 'text-red-500';
                    } else {
                        bgColor = 'bg-gray-100';
                        iconClass = 'fas fa-book';
                        textColor = 'text-gray-500';
                    }
                    
                    // Tạo phần tử hiển thị lớp học
                    const classElement = document.createElement('div');
                    classElement.className = `flex items-center p-3 ${bgColor} rounded-lg hover:shadow-md transition-shadow mb-3`;
                    classElement.innerHTML = `
                        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                            <i class="${iconClass} ${textColor}"></i>
                        </div>
                        <div class="flex-grow">
                            <h4 class="font-medium">${classItem.className || `Lớp ${classItem.classCode}`}</h4>
                            <div class="flex flex-col text-sm">
                                <span class="text-gray-600">Mã lớp: ${classItem.classCode}</span>
                                <span class="text-gray-600">Sĩ số: ${classItem.studentCount || 0} học sinh</span>
                            </div>
                        </div>
                        <a href="./classroom.html?code=${classItem.classCode}" 
                           class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors">
                            <i class="fas fa-door-open mr-1"></i>Vào lớp
                        </a>
                    `;
                    
                    teachingClassesContainer.appendChild(classElement);
                });
            })
            .catch(error => {
                console.error('Error fetching classes:', error);
                teachingClassesContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                        <p class="text-gray-500">Có lỗi xảy ra khi tải danh sách lớp học.</p>
                    </div>
                `;
            });
    }

    // Fetch teacher statistics
    function fetchTeacherStats() {
        if (!totalClasses || !totalStudents || !totalExams || !totalQuestions) return;
        
        fetch(`${API_ENDPOINTS.GET_TEACHER_STATS}?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    totalClasses.textContent = data.totalClasses || 0;
                    totalStudents.textContent = data.totalStudents || 0;
                    totalExams.textContent = data.totalExams || 0;
                    totalQuestions.textContent = data.totalQuestions || 0;
                }
            })
            .catch(error => {
                console.error('Error fetching stats:', error);
            });
    }

    // Switch to edit mode
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            if (profileView && profileEdit) {
                profileView.classList.add('hidden');
                profileEdit.classList.remove('hidden');
            }
        });
    }

    // Cancel edit
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            if (profileView && profileEdit) {
                profileView.classList.remove('hidden');
                profileEdit.classList.add('hidden');
                fetchTeacherData(); // Reset form data
            }
        });
    }

    // Save profile changes
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            if (!emailInput || !nameInput) {
                alert('Không thể lấy thông tin từ form');
                return;
            }
            
            const updatedData = {
                email: emailInput.value,
                name: nameInput.value,
                phone: phoneInput ? phoneInput.value : '',
                dateOfBirth: dobInput ? dobInput.value : '',
                gender: genderInput ? genderInput.value : '',
                address: addressInput ? addressInput.value : '',
                subject: subjectInput ? subjectInput.value : '',
                qualification: qualificationInput ? qualificationInput.value : ''
            };

            fetch(API_ENDPOINTS.UPDATE_TEACHER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Cập nhật thông tin thành công!');
                    if (profileView && profileEdit) {
                        profileView.classList.remove('hidden');
                        profileEdit.classList.add('hidden');
                    }
                    fetchTeacherData(); // Refresh displayed data
                } else {
                    alert(data.message || 'Có lỗi xảy ra khi cập nhật thông tin');
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                alert('Có lỗi xảy ra khi cập nhật thông tin');
            });
        });
    }

    // Change password
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const currentPassword = document.getElementById('currentPassword');
            const newPassword = document.getElementById('newPassword');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Không tìm thấy các trường mật khẩu');
                return;
            }

            if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            if (newPassword.value !== confirmPassword.value) {
                alert('Mật khẩu mới không khớp');
                return;
            }

            fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    currentPassword: currentPassword.value,
                    newPassword: newPassword.value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Đổi mật khẩu thành công!');
                    currentPassword.value = '';
                    newPassword.value = '';
                    confirmPassword.value = '';
                } else {
                    alert(data.message || 'Có lỗi xảy ra khi đổi mật khẩu');
                }
            })
            .catch(error => {
                console.error('Error changing password:', error);
                alert('Có lỗi xảy ra khi đổi mật khẩu');
            });
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userType');
                localStorage.removeItem('teacherName');
                localStorage.removeItem('teacherSubject');
                window.location.href = 'login.html';
            }
        });
    }

    // Initialize
    fetchTeacherData();
    fetchTeachingClasses();
    fetchTeacherStats();
});


