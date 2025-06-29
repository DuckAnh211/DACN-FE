
document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api'; //'https://dacn-be-hh2q.onrender.com/v1/api';
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
            // Lấy email người dùng từ localStorage
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                console.error('Không tìm thấy email người dùng');
                displayJoinedClasses(); // Hiển thị thông báo chưa tham gia lớp nào
                return;
            }
            
            console.log('Đang lấy danh sách lớp học đã tham gia cho:', userEmail);
            
            // Sử dụng API endpoint tương tự như trong profile.js
            const response = await fetch(`${BASE_API_URL}/enrolled-classrooms?email=${userEmail}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dữ liệu lớp học đã tham gia:', data);
            
            // Xử lý dữ liệu tương tự như trong profile.js
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                // Lưu danh sách lớp học đã tham gia
                allClasses = data.data.map(classItem => {
                    classItem.joined = true;
                    return classItem;
                });
                
                // Lưu danh sách mã lớp học vào localStorage
                const classCodeList = allClasses.map(classItem => classItem.classCode);
                localStorage.setItem('joinedClasses', JSON.stringify(classCodeList));
                
                // Lưu thông tin chi tiết của từng lớp học vào localStorage
                allClasses.forEach(classItem => {
                    localStorage.setItem(`class_${classItem.classCode}`, JSON.stringify(classItem));
                });
            } else {
                // Không có lớp học nào
                allClasses = [];
                localStorage.setItem('joinedClasses', JSON.stringify([]));
            }
            
            console.log('Danh sách lớp học đã xử lý:', allClasses);
            
            // Hiển thị các lớp học đã tham gia
            displayJoinedClasses();
        } catch (error) {
            console.error('Lỗi khi lấy danh sách lớp học:', error);
            
            // Thử lấy từ localStorage nếu API lỗi
            const joinedClassCodes = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
            
            if (joinedClassCodes.length > 0) {
                // Lấy thông tin chi tiết của từng lớp học từ localStorage
                allClasses = joinedClassCodes.map(code => {
                    const cachedClass = localStorage.getItem(`class_${code}`);
                    if (cachedClass) {
                        const classData = JSON.parse(cachedClass);
                        classData.joined = true;
                        return classData;
                    }
                    return { 
                        classCode: code, 
                        className: `Lớp học ${code}`,
                        subject: 'Chưa xác định',
                        teacher: { name: 'Chưa phân công' },
                        joined: true
                    };
                });
            } else {
                // Không có lớp học nào
                allClasses = [];
            }
            
            console.log('Sử dụng dữ liệu từ localStorage:', allClasses);
            
            // Hiển thị các lớp học đã tham gia
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
                <div class="col-span-1 md:col-span-2 lg:col-span-3">
                    <div class="text-center py-8">
                        <div class="text-gray-500 mb-4">
                            <i class="fas fa-school text-5xl mb-3"></i>
                            <p class="text-lg">Bạn chưa tham gia lớp học nào</p>
                        </div>
                        <p class="text-sm text-gray-400">Sử dụng mã lớp để tham gia lớp học</p>
                    </div>
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
    async function searchClassByCode(classCode) {
        const searchTerm = classCode.toLowerCase().trim();
        console.log('Đang tìm kiếm lớp học với mã:', searchTerm);
        
        if (!searchTerm) {
            console.log('Từ khóa tìm kiếm trống');
            searchResultContainer.classList.add('hidden');
            return null;
        }
        
        try {
            // Hiển thị loading
            searchResultContent.innerHTML = `
                <div class="flex justify-center items-center p-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p class="ml-2 text-gray-600">Đang tìm kiếm...</p>
                </div>
            `;
            searchResultContainer.classList.remove('hidden');
            
            // Lấy danh sách tất cả các lớp học từ API
            const response = await fetch(`${BASE_API_URL}/classrooms`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dữ liệu lớp học từ API:', data);
            
            // Lấy danh sách lớp học từ response
            let allClasses = [];
            if (data.success && Array.isArray(data.data)) {
                allClasses = data.data;
            } else if (Array.isArray(data)) {
                allClasses = data;
            }
            
            console.log('Danh sách lớp học:', allClasses);
            
            // Tìm lớp học có mã lớp khớp với từ khóa tìm kiếm
            const classData = allClasses.find(classItem => 
                classItem.classCode && classItem.classCode.toLowerCase() === searchTerm
            );
            
            console.log('Kết quả tìm kiếm:', classData);
            
            if (!classData) {
                console.log('Không tìm thấy lớp học với mã:', searchTerm);
                searchResultContainer.classList.add('hidden');
                alert('Không tìm thấy lớp học với mã: ' + searchTerm);
                return null;
            }
            
            // Kiểm tra xem người dùng đã tham gia lớp học này chưa
            const joinedClassCodes = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
            if (joinedClassCodes.includes(classData.classCode)) {
                classData.joined = true;
            } else {
                classData.joined = false;
            }
            
            // Hiển thị thẻ lớp học tìm thấy
            displaySearchResult(classData);
            return classData;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm lớp học:', error);
            searchResultContainer.classList.add('hidden');
            alert('Có lỗi xảy ra khi tìm kiếm lớp học. Vui lòng thử lại sau.');
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
        
        // Kiểm tra xem người dùng đã tham gia lớp học này chưa
        if (classData.joined) {
            // Nếu đã tham gia, hiển thị nút "Vào lớp"
            classCard.innerHTML = `
                <div class="bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center">
                    <i class="${iconClass} text-white text-5xl"></i>
                </div>
                <div class="p-6 flex flex-col justify-between h-[calc(100%-8rem)]">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-xl font-bold text-gray-800">${classData.className || 'Không có tên'}</h3> 
                            <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đã tham gia</span>
                        </div>
                        <div class="text-sm text-gray-600 mb-1">
                            <i class="fas fa-chalkboard-teacher mr-1"></i> GV: ${teacherName}
                        </div>
                        <div class="text-sm text-gray-600 mb-4">
                            <i class="fas fa-fingerprint mr-1"></i> Mã lớp: ${classData.classCode}
                        </div>
                    </div>
                    <div class="flex justify-center items-center">                           
                        <a href="./classroom.html?code=${classData.classCode}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors w-full text-center">
                            <i class="fas fa-door-open mr-1"></i> Vào lớp
                        </a>
                    </div>
                </div>
            `;
        } else {
            // Nếu chưa tham gia, hiển thị nút "Tham gia lớp học"
            classCard.innerHTML = `
                <div class="bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center">
                    <i class="${iconClass} text-white text-5xl"></i>
                </div>
                <div class="p-6 flex flex-col justify-between h-[calc(100%-8rem)]">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-xl font-bold text-gray-800">${classData.className || 'Không có tên'}</h3> 
                            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Chưa tham gia</span>
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
        }
        
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
document.addEventListener('DOMContentLoaded', () => {
  const joinBtn = document.getElementById('joinRoomBtn');
  const roomInput = document.getElementById('roomIdInput');
  if (joinBtn && roomInput) {
    joinBtn.addEventListener('click', () => {
      const roomId = roomInput.value.trim();
      if (!roomId) {
        alert('Vui lòng nhập Room ID!');
        roomInput.focus();
        return;
      }
      // Chuyển sang trang phòng họp, truyền Room ID trên URL
      window.location.href = `videomeeting.html?id=${encodeURIComponent(roomId)}`;
    });
    // Nhấn Enter cũng submit
    roomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinBtn.click();
    });
  }
});








