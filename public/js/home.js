
document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api';
    const API_ENDPOINTS = {
        GET_CLASSES: `${BASE_API_URL}/classrooms`,
        JOIN_CLASS: `${BASE_API_URL}/join-classroom`
    };

    // Lấy tham chiếu đến các phần tử DOM
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const classContainer = document.getElementById('classContainer');
    const searchResultContainer = document.getElementById('searchResultContainer');
    const searchResultContent = document.getElementById('searchResultContent');
    
    // Kiểm tra xem các phần tử có tồn tại không
    if (!searchInput || !searchButton || !searchResultContainer || !searchResultContent) {
        console.error('Không tìm thấy các phần tử DOM cần thiết');
        console.log('searchInput:', searchInput);
        console.log('searchButton:', searchButton);
        console.log('searchResultContainer:', searchResultContainer);
        console.log('searchResultContent:', searchResultContent);
        return;
    }
    
    // Biến lưu trữ danh sách lớp học
    let allClasses = [];
    
    // Lấy danh sách lớp học từ API
    async function fetchClasses() {
        try {
            console.log('Đang lấy danh sách lớp học từ:', API_ENDPOINTS.GET_CLASSES);
            const response = await fetch(API_ENDPOINTS.GET_CLASSES);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dữ liệu nhận được:', data);
            
            // Kiểm tra cấu trúc dữ liệu
            if (data && Array.isArray(data.data)) {
                allClasses = data.data;
            } else if (Array.isArray(data)) {
                allClasses = data;
            } else {
                console.error('Dữ liệu không đúng định dạng:', data);
                allClasses = [];
            }
            
            // Lấy danh sách lớp học đã tham gia từ localStorage
            const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
            
            // Đánh dấu các lớp học đã tham gia
            allClasses = allClasses.map(classItem => {
                if (joinedClasses.includes(classItem.classCode)) {
                    classItem.joined = true;
                }
                return classItem;
            });
            
            console.log('Danh sách lớp học đã xử lý:', allClasses);
            
            // Hiển thị các lớp học đã tham gia (nếu có)
            displayJoinedClasses();
        } catch (error) {
            console.error('Lỗi khi lấy danh sách lớp học:', error);
            // Tạo dữ liệu mẫu để test
            allClasses = [
                {
                    classCode: 'CS101',
                    className: 'Nhập môn lập trình',
                    subject: 'Tin học',
                    teacher: { name: 'Nguyễn Văn A' }
                },
                {
                    classCode: 'MATH101',
                    className: 'Đại số tuyến tính',
                    subject: 'Toán',
                    teacher: { name: 'Trần Thị B' }
                }
            ];
            
            // Lấy danh sách lớp học đã tham gia từ localStorage
            const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
            
            // Đánh dấu các lớp học đã tham gia
            allClasses = allClasses.map(classItem => {
                if (joinedClasses.includes(classItem.classCode)) {
                    classItem.joined = true;
                }
                return classItem;
            });
            
            console.log('Sử dụng dữ liệu mẫu:', allClasses);
            
            // Hiển thị các lớp học đã tham gia (nếu có)
            displayJoinedClasses();
        }
    }
    
    // Hiển thị các lớp học đã tham gia
    function displayJoinedClasses() {
        if (!classContainer) return;
        
        // Xóa nội dung cũ
        classContainer.innerHTML = '';
        
        // Lọc các lớp học đã tham gia
        const joinedClasses = allClasses.filter(classItem => classItem.joined);
        
        if (joinedClasses.length === 0) {
            classContainer.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-500 mb-4">
                        <i class="fas fa-school text-5xl mb-3"></i>
                        <p class="text-lg">Bạn chưa tham gia lớp học nào</p>
                    </div>
                    <p class="text-sm text-gray-400">Sử dụng mã lớp để tham gia lớp học</p>
                </div>
            `;
            return;
        }
        
        // Hiển thị các lớp học đã tham gia
        joinedClasses.forEach(classItem => {
            // Xác định màu gradient dựa trên môn học
            let gradientClass = 'from-blue-500 to-purple-600';
            let iconClass = 'fas fa-language';
            
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
            
            // Lấy thông tin giáo viên
            const teacherName = classItem.teacher ? classItem.teacher.name : 'Chưa phân công';
            
            // Tạo thẻ lớp học
            const classCard = document.createElement('div');
            classCard.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
            classCard.innerHTML = `
                <div class="bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center">
                    <i class="${iconClass} text-white text-5xl"></i>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-xl font-bold text-gray-800">${classItem.className || 'Không có tên'}</h3> 
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đang học</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-chalkboard-teacher mr-1"></i> GV: ${teacherName}
                    </div>
                    <div class="text-sm text-gray-600 mb-4">
                        <i class="fas fa-fingerprint mr-1"></i> Mã lớp: ${classItem.classCode}
                    </div>
                    <a href="./classroom.html?code=${classItem.classCode}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors block text-center">
                        <i class="fas fa-door-open mr-1"></i> Vào lớp
                    </a>
                </div>
            `;
            
            classContainer.appendChild(classCard);
        });
    }
    
    // Tìm kiếm lớp học theo mã lớp
    function searchClassByCode(classCode) {
        const searchTerm = classCode.toLowerCase().trim();
        console.log('Đang tìm kiếm lớp học với mã:', searchTerm);
        
        if (!searchTerm) {
            console.log('Từ khóa tìm kiếm trống');
            searchResultContainer.classList.add('hidden');
            return null;
        }
        
        console.log('Danh sách lớp học hiện tại:', allClasses);
        
        // Tìm lớp học có mã lớp khớp với từ khóa tìm kiếm
        const matchedClass = allClasses.find(classItem => 
            classItem.classCode && classItem.classCode.toLowerCase() === searchTerm
        );
        
        console.log('Kết quả tìm kiếm:', matchedClass);
        
        if (matchedClass) {
            // Hiển thị thẻ lớp học tìm thấy
            displaySearchResult(matchedClass);
            return matchedClass;
        } else {
            console.log('Không tìm thấy lớp học với mã:', searchTerm);
            searchResultContainer.classList.add('hidden');
            alert('Không tìm thấy lớp học với mã: ' + searchTerm);
            return null;
        }
    }
    
    // Hiển thị kết quả tìm kiếm
    function displaySearchResult(classData) {
        console.log('Hiển thị kết quả tìm kiếm:', classData);
        
        // Xóa nội dung cũ
        searchResultContent.innerHTML = '';
        
        // Tạo thẻ lớp học
        const classCard = document.createElement('div');
        classCard.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-[300px]';
        
        // Xác định màu gradient dựa trên môn học
        let gradientClass = 'from-blue-500 to-purple-600';
        let iconClass = 'fas fa-language';
        
        if (classData.subject) {
            const subject = classData.subject.toLowerCase();
            if (subject.includes('toán')) {
                gradientClass = 'from-pink-500 to-red-600';
                iconClass = 'fas fa-calculator';
            } else if (subject.includes('văn') || subject.includes('ngữ văn')) {
                gradientClass = 'from-green-500 to-teal-600';
                iconClass = 'fas fa-book';
            } else if (subject.includes('anh') || subject.includes('english')) {
                gradientClass = 'from-yellow-400 to-orange-500';
                iconClass = 'fas fa-language';
            }
        }
        
        // Lấy thông tin giáo viên
        const teacherName = classData.teacher ? classData.teacher.name : 
                            (classData.teacherName || 'Chưa phân công');
        
        classCard.innerHTML = `
            <div class="bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center">
                <i class="${iconClass} text-white text-5xl"></i>
            </div>
            <div class="p-6 flex flex-col justify-between h-[calc(100%-8rem)]">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-xl font-bold text-gray-800">${classData.className || 'Không có tên'}</h3> 
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đang học</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-chalkboard-teacher mr-1"></i> GV: ${teacherName}
                    </div>
                    <div class="text-sm text-gray-600 mb-4">
                        <i class="fas fa-fingerprint mr-1"></i> Mã lớp: ${classData.classCode}
                    </div>
                </div>
                <div class="flex justify-center items-center">                           
                    <button class="join-class-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors w-full text-center"
                            data-class-code="${classData.classCode}">
                        <i class="fas fa-sign-in-alt mr-1"></i> Tham gia lớp học
                    </button>
                </div>
            </div>
        `;
        
        // Thêm sự kiện khi nhấn nút tham gia lớp học
        classCard.querySelector('.join-class-btn').addEventListener('click', function() {
            const classCode = this.getAttribute('data-class-code');
            if (confirm(`Bạn có muốn tham gia vào lớp học ${classCode} không?`)) {
                enterClass(classCode);
            }
        });
        
        // Thêm thẻ lớp học vào kết quả tìm kiếm
        searchResultContent.appendChild(classCard);
        
        // Hiển thị container kết quả tìm kiếm
        searchResultContainer.classList.remove('hidden');
        
        // Lưu thông tin lớp học vào localStorage
        localStorage.setItem(`class_${classData.classCode}`, JSON.stringify(classData));
    }
    
    // Xử lý sự kiện khi nhấn nút tìm kiếm
    console.log('Đang thêm event listener cho nút tìm kiếm');
    searchButton.addEventListener('click', function() {
        console.log('Nút tìm kiếm được nhấn');
        searchClassByCode(searchInput.value);
    });
    
    // Xử lý sự kiện khi nhấn Enter trong ô tìm kiếm
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Phím Enter được nhấn trong ô tìm kiếm');
            searchClassByCode(this.value);
        }
    });
    
    // Hàm xử lý khi người dùng nhấn vào nút "Tham gia lớp học"
    async function enterClass(classCode) {
        try {
            // Lấy email người dùng từ localStorage
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                alert('Bạn cần đăng nhập để tham gia lớp học');
                window.location.href = './login.html';
                return;
            }
            
            console.log('Đang tham gia lớp học với mã:', classCode);
            
            // Tìm thông tin lớp học trong danh sách lớp học đã có
            const classInfo = allClasses.find(c => c.classCode === classCode);
            if (classInfo) {
                // Lưu thông tin lớp học vào localStorage
                localStorage.setItem(`class_${classCode}`, JSON.stringify(classInfo));
            }
            
            // Hiển thị thông báo đang xử lý
            const joinButton = document.querySelector(`.join-class-btn[data-class-code="${classCode}"]`);
            if (joinButton) {
                joinButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý...';
                joinButton.disabled = true;
            }
            
            // Gửi request tham gia lớp học
            const response = await fetch(API_ENDPOINTS.JOIN_CLASS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: userEmail,
                    classCode: classCode
                })
            });
            
            console.log('Response status:', response.status);
            
            // Lấy response text để debug
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            // Parse JSON nếu có thể
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : {};
                console.log('Parsed result:', result);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                result = { success: false, message: 'Invalid JSON response' };
            }
            
            if (response.ok) {
                console.log('Tham gia lớp học thành công:', result);
                
                // Đánh dấu lớp học đã tham gia
                if (classInfo) {
                    classInfo.joined = true;
                    localStorage.setItem(`class_${classCode}`, JSON.stringify(classInfo));
                    
                    // Lưu danh sách lớp học đã tham gia
                    const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
                    if (!joinedClasses.includes(classCode)) {
                        joinedClasses.push(classCode);
                        localStorage.setItem('joinedClasses', JSON.stringify(joinedClasses));
                    }
                    
                    // Cập nhật lại danh sách lớp học
                    allClasses = allClasses.map(c => {
                        if (c.classCode === classCode) {
                            c.joined = true;
                        }
                        return c;
                    });
                }
                
                // Hiển thị thông báo thành công
                alert(`Tham gia lớp học ${classCode} thành công!`);
                
                // Hiển thị lại danh sách lớp học đã tham gia
                displayJoinedClasses();
                
                // Chuyển hướng đến trang lớp học sử dụng classCode
                window.location.href = `./classroom.html?code=${classCode}`;
            } else {
                console.error('Lỗi khi tham gia lớp học:', result);
                alert(result.message || 'Không thể tham gia lớp học');
                
                // Khôi phục nút tham gia
                if (joinButton) {
                    joinButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i> Tham gia lớp học';
                    joinButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('Lỗi khi tham gia lớp học:', error);
            alert('Có lỗi xảy ra khi tham gia lớp học');
            
            // Khôi phục nút tham gia
            const joinButton = document.querySelector(`.join-class-btn[data-class-code="${classCode}"]`);
            if (joinButton) {
                joinButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i> Tham gia lớp học';
                joinButton.disabled = false;
            }
        }
    }
    
    // Khởi tạo: lấy danh sách lớp học
    console.log('Khởi tạo trang home.js');
    fetchClasses();
});

// Xử lý sự kiện khi người dùng nhấn nút "Tham gia" trong modal
document.getElementById('joinClassForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const classCodeInput = document.getElementById('classCodeInput');
    const classCode = classCodeInput.value.trim();
    
    if (!classCode) {
        alert('Vui lòng nhập mã lớp học');
        return;
    }
    
    console.log('Đang tìm kiếm lớp học với mã:', classCode);
    
    // Tìm kiếm lớp học theo mã
    const foundClass = searchClassByCode(classCode);
    
    if (foundClass) {
        // Đóng modal
        document.getElementById('joinClassModal').classList.add('hidden');
        
        // Xóa giá trị input
        classCodeInput.value = '';
        
        // Tham gia lớp học
        enterClass(classCode);
    }
});

