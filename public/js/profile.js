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
    const enrolledClassesContainer = document.getElementById('enrolledClasses');

    // Input elements
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const dobInput = document.getElementById('dobInput');
    const genderInput = document.getElementById('genderInput');
    const addressInput = document.getElementById('addressInput');

    // Display elements
    const userNameElement = document.getElementById('userName');
    const nameDisplay = document.getElementById('nameDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const dobDisplay = document.getElementById('dobDisplay');
    const genderDisplay = document.getElementById('genderDisplay');
    const addressDisplay = document.getElementById('addressDisplay');

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

    // Fetch and display user data
    // Các biến và hằng số
    const BASE_API_URL = 'http://localhost:8080/v1/api'; //'https://dacn-be-hh2q.onrender.com/v1/api';
    const API_ENDPOINTS = {
        GET_USER: `${BASE_API_URL}/username`,
        UPDATE_USER: `${BASE_API_URL}/update-user`,
        GET_ENROLLED_CLASSES: `${BASE_API_URL}/enrolled-classrooms`
    };
    
    function fetchUserData() {
        fetch(`${API_ENDPOINTS.GET_USER}?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update display view
                    userNameElement.textContent = data.name || 'Không có tên';
                    nameDisplay.textContent = data.name || 'Chưa cập nhật';
                    emailDisplay.textContent = data.email || userEmail;
                    phoneDisplay.textContent = data.phone || 'Chưa cập nhật';
                    dobDisplay.textContent = formatDate(data.dateOfBirth) || 'Chưa cập nhật';
                    genderDisplay.textContent = translateGender(data.gender) || 'Chưa cập nhật';
                    addressDisplay.textContent = data.address || 'Chưa cập nhật';

                    // Lưu tên người dùng vào localStorage để sử dụng trong meeting.html
                    localStorage.setItem('userName', data.name || 'Học viên');

                    // Update form inputs
                    nameInput.value = data.name || '';
                    emailInput.value = data.email || userEmail;
                    phoneInput.value = data.phone || '';
                    dobInput.value = data.dateOfBirth || '';
                    genderInput.value = data.gender || 'unknown';
                    addressInput.value = data.address || '';
                }
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
                alert('Có lỗi xảy ra khi tải thông tin');
            });
    }

    // Lấy danh sách lớp học đã tham gia từ API
    function fetchEnrolledClasses() {
        if (!enrolledClassesContainer) return;

        // Hiển thị loading
        enrolledClassesContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách lớp học...</p>
            </div>
        `;

        // Gọi API để lấy danh sách lớp học đã tham gia
        fetch(`${API_ENDPOINTS.GET_ENROLLED_CLASSES}?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                console.log('Enrolled classes data:', data);
                
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    // Hiển thị danh sách lớp học
                    displayEnrolledClasses(data.data);
                    
                    // Lưu danh sách mã lớp học vào localStorage
                    const classCodeList = data.data.map(classItem => classItem.classCode);
                    localStorage.setItem('joinedClasses', JSON.stringify(classCodeList));
                    
                    // Lưu thông tin chi tiết của từng lớp học vào localStorage
                    data.data.forEach(classItem => {
                        localStorage.setItem(`class_${classItem.classCode}`, JSON.stringify(classItem));
                    });
                } else {
                    // Hiển thị thông báo nếu không có lớp học nào
                    enrolledClassesContainer.innerHTML = `
                        <div class="text-center py-4">
                            <div class="text-gray-500">
                                <i class="fas fa-school text-4xl mb-2"></i>
                                <p>Bạn chưa tham gia lớp học nào</p>
                            </div>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error fetching enrolled classes:', error);
                
                // Thử lấy từ localStorage nếu API lỗi
                const joinedClassCodes = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
                
                if (joinedClassCodes.length > 0) {
                    // Lấy thông tin chi tiết của từng lớp học từ localStorage
                    const enrolledClasses = joinedClassCodes.map(code => {
                        const cachedClass = localStorage.getItem(`class_${code}`);
                        if (cachedClass) {
                            return JSON.parse(cachedClass);
                        }
                        return { classCode: code, className: `Lớp học ${code}` };
                    });
                    
                    displayEnrolledClasses(enrolledClasses);
                } else {
                    // Hiển thị thông báo nếu không có lớp học nào
                    enrolledClassesContainer.innerHTML = `
                        <div class="text-center py-4">
                            <div class="text-gray-500">
                                <i class="fas fa-school text-4xl mb-2"></i>
                                <p>Bạn chưa tham gia lớp học nào</p>
                            </div>
                        </div>
                    `;
                }
            });
    }

    // Hiển thị danh sách lớp học đã tham gia
    function displayEnrolledClasses(classes) {
        if (!enrolledClassesContainer) return;
        
        if (!classes || classes.length === 0) {
            enrolledClassesContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-gray-500">
                        <i class="fas fa-school text-4xl mb-2"></i>
                        <p>Bạn chưa tham gia lớp học nào</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Xóa nội dung cũ
        enrolledClassesContainer.innerHTML = '';
        
        // Hiển thị danh sách lớp học
        classes.forEach(classItem => {
            // Xác định màu và biểu tượng dựa trên môn học
            let bgColor = 'bg-blue-100';
            let textColor = 'text-blue-600';
            let iconClass = 'fas fa-language';
            
            if (classItem.subject) {
                const subject = classItem.subject.toLowerCase();
                if (subject.includes('toán')) {
                    bgColor = 'bg-pink-100';
                    textColor = 'text-pink-600';
                    iconClass = 'fas fa-calculator';
                } else if (subject.includes('văn') || subject.includes('ngữ văn')) {
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-600';
                    iconClass = 'fas fa-book';
                } else if (subject.includes('tiếng anh') || subject.includes('anh văn')) {
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-600';
                    iconClass = 'fas fa-globe';
                }
            }
            
            // Lấy thông tin giáo viên
            const teacherName = classItem.teacherName || 
                               (classItem.teacher ? classItem.teacher.name : 'Chưa phân công');
            
            // Tạo phần tử hiển thị lớp học
            const classElement = document.createElement('div');
            classElement.className = `flex items-center p-3 ${bgColor} rounded-lg hover:shadow-md transition-shadow mb-3`;
            classElement.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                    <i class="${iconClass} ${textColor}"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="font-medium">${classItem.className || `Lớp học ${classItem.classCode}`}</h4>
                    <div class="flex flex-col text-sm">
                        <span class="text-gray-600">Mã lớp: ${classItem.classCode}</span>
                        <span class="text-gray-600">GV: ${teacherName}</span>
                    </div>
                </div>
                <a href="./classroom.html?code=${classItem.classCode}" 
                   class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors">
                    <i class="fas fa-door-open mr-1"></i>Vào lớp
                </a>
            `;
            
            enrolledClassesContainer.appendChild(classElement);
        });
    }

    // Switch to edit mode
    editProfileBtn.addEventListener('click', () => {
        profileView.classList.add('hidden');
        profileEdit.classList.remove('hidden');
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', () => {
        profileView.classList.remove('hidden');
        profileEdit.classList.add('hidden');
        fetchUserData(); // Reset form data
    });

    // Save profile changes
    saveProfileBtn.addEventListener('click', () => {
        const updatedData = {
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            dateOfBirth: dobInput.value,
            gender: genderInput.value,
            address: addressInput.value
        };

        fetch(API_ENDPOINTS.UPDATE_USER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Thông tin tài khoản đã được cập nhật thành công.") {
                alert('Cập nhật thông tin thành công!');
                profileView.classList.remove('hidden');
                profileEdit.classList.add('hidden');
                fetchUserData(); // Refresh displayed data
            } else {
                alert('Có lỗi xảy ra khi cập nhật thông tin');
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin');
        });
    });

    // Khởi tạo
    fetchUserData();
    fetchEnrolledClasses();
});
