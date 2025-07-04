// Định nghĩa BASE_API_URL
const BASE_API_URL = 'http://localhost:8080/v1/api'; //'https://dacn-be-hh2q.onrender.com/v1/api';

// Cấu hình API
const API_ENDPOINTS = {
    GET_CLASS: `${BASE_API_URL}/classrooms`,
    GET_CLASSES: `${BASE_API_URL}/classrooms`,
    GET_LESSONS: `${BASE_API_URL}/lessons/classroom`,
    DELETE_LESSON: `${BASE_API_URL}/lessons`,
    GET_NOTIFICATIONS: `${BASE_API_URL}/notifications/classroom`,
    GET_ASSIGNMENTS: `${BASE_API_URL}/assignments/class`,
    SUBMIT_ASSIGNMENT: `${BASE_API_URL}/submissions`,
    VIEW_ASSIGNMENT: `${BASE_API_URL}/assignments`,
    GET_SUBMISSION_STATUS: `${BASE_API_URL}/submissions/status`,
    GET_QUIZZES: `${BASE_API_URL}/quizzes/class`
};

// Hàm lấy danh sách lớp học
async function fetchClasses() {
    try {
        console.log('Đang lấy danh sách lớp học từ API');
        
        // Lấy thông tin người dùng từ localStorage
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        
        if (!userEmail) {
            console.error('Không tìm thấy thông tin người dùng');
            return [];
        }
        
        let apiUrl = API_ENDPOINTS.GET_CLASSES;
        
        // Thêm tham số query tùy thuộc vào vai trò người dùng
        if (userRole === 'teacher') {
            apiUrl += `?teacher=${encodeURIComponent(userEmail)}`;
        } else if (userRole === 'student') {
            apiUrl += `?student=${encodeURIComponent(userEmail)}`;
        }
        
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dữ liệu lớp học từ API:', data);
        
        // Kiểm tra cấu trúc dữ liệu trả về
        let classes = [];
        
        if (data.success && Array.isArray(data.data)) {
            classes = data.data;
        } else if (Array.isArray(data)) {
            classes = data;
        } else if (data.data && Array.isArray(data.data)) {
            classes = data.data;
        }
        
        return classes;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách lớp học:', error);
        return [];
    }
}

// Tìm kiếm lớp học theo mã lớp
async function searchClassByCode(classCode) {
    const searchTerm = classCode.toLowerCase().trim();
    console.log('Đang tìm kiếm lớp học với mã:', searchTerm);
    
    if (!searchTerm) {
        console.log('Từ khóa tìm kiếm trống');
        return null;
    }
    
    try {
        // Lấy danh sách lớp học từ API
        const allClasses = await fetchClasses();
        console.log('Danh sách lớp học hiện tại:', allClasses);
        
        // Tìm lớp học có mã lớp khớp với từ khóa tìm kiếm
        const matchedClass = allClasses.find(classItem => 
            classItem.classCode && classItem.classCode.toLowerCase() === searchTerm
        );
        
        console.log('Kết quả tìm kiếm:', matchedClass);
        
        if (matchedClass) {
            return matchedClass;
        } else {
            console.log('Không tìm thấy lớp học với mã:', searchTerm);
            
            // Thử tìm kiếm trực tiếp từ API bằng mã lớp
            try {
                const response = await fetch(`${API_ENDPOINTS.GET_CLASS}/code/${searchTerm}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Dữ liệu lớp học từ API theo mã:', data);
                    
                    if (data.success && data.data) {
                        return data.data;
                    } else if (data._id || data.classCode) {
                        return data;
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm lớp học theo mã từ API:', error);
            }
            
            return null;
        }
    } catch (error) {
        console.error('Lỗi khi tìm kiếm lớp học:', error);
        return null;
    }
}

// Phần còn lại của mã
document.addEventListener('DOMContentLoaded', function() {
    // Khai báo biến toàn cục
    window.lessons = [];
    window.assignments = [];
    
    // Tạo phần tử lessonsContent nếu chưa tồn tại
    let lessonsContentElement = document.getElementById('lessonsContent');
    if (!lessonsContentElement) {
        console.log('Không tìm thấy phần tử lessonsContent, đang tạo mới...');
        // Tìm phần tử container chính
        const mainContainer = document.querySelector('.container') || document.body;
        
        // Tạo phần tử lessonsContent
        const newLessonsContent = document.createElement('div');
        newLessonsContent.id = 'lessonsContent';
        newLessonsContent.className = 'mt-4';
        
        // Thêm vào container
        mainContainer.appendChild(newLessonsContent);
    }
    
    // Lưu trữ lessonsContent vào window
    window.lessonsContent = lessonsContentElement;
    
    // Lấy tham chiếu đến các phần tử DOM
    const classNameElement = document.getElementById('className');
    const teacherNameElement = document.getElementById('teacherName');
    const classCodeElement = document.getElementById('classCode');
    const classIconContainerElement = document.getElementById('classIconContainer');
    const classIconTypeElement = document.getElementById('classIconType');
    const lessonsListElement = document.getElementById('lessonsList');
    
    // Lấy tham chiếu đến các tab và nội dung
    const lessonsTab = document.getElementById('lessons-tab');
    const assignmentsTab = document.getElementById('assignments-tab');
    const testsTab = document.getElementById('tests-tab');
    const lessonsContent = document.getElementById('lessons-content');
    const assignmentsContent = document.getElementById('assignments-content');
    const testsContent = document.getElementById('tests-content');
    
    // Xử lý sự kiện chuyển tab
    lessonsTab.addEventListener('click', function() {
        // Hiển thị tab bài học, ẩn các tab khác
        lessonsContent.classList.remove('hidden');
        assignmentsContent.classList.add('hidden');
        testsContent.classList.add('hidden');
        
        // Cập nhật trạng thái active của các tab
        lessonsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        lessonsTab.classList.remove('text-gray-500');
        assignmentsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        assignmentsTab.classList.add('text-gray-500');
        testsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        testsTab.classList.add('text-gray-500');
    });
    
    assignmentsTab.addEventListener('click', function() {
        // Hiển thị tab bài tập, ẩn các tab khác
        lessonsContent.classList.add('hidden');
        assignmentsContent.classList.remove('hidden');
        testsContent.classList.add('hidden');
        
        // Cập nhật trạng thái active của các tab
        lessonsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        lessonsTab.classList.add('text-gray-500');
        assignmentsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        assignmentsTab.classList.remove('text-gray-500');
        testsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        testsTab.classList.add('text-gray-500');
    });
    
    testsTab.addEventListener('click', function() {
        // Hiển thị tab kiểm tra, ẩn các tab khác
        lessonsContent.classList.add('hidden');
        assignmentsContent.classList.add('hidden');
        testsContent.classList.remove('hidden');
        if (classCode) loadQuizzes(classCode);
        
        // Cập nhật trạng thái active của các tab
        lessonsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        lessonsTab.classList.add('text-gray-500');
        assignmentsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        assignmentsTab.classList.add('text-gray-500');
        testsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        testsTab.classList.remove('text-gray-500');
    });

    // Lấy mã lớp học từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (!classCode) {
        alert('Không tìm thấy thông tin lớp học');
        window.location.href = './teacher_home.html';
        return;
    }

    console.log('Đang tải thông tin lớp học với mã:', classCode);

    // Lấy thông tin lớp học từ API hoặc localStorage
    async function fetchClassInfo() {
        try {
            console.log('Đang lấy thông tin lớp học với mã:', classCode);
            
            // Thử lấy thông tin từ localStorage trước
            const cachedClass = localStorage.getItem(`class_${classCode}`);
            if (cachedClass) {
                const classData = JSON.parse(cachedClass);
                console.log('Lấy thông tin lớp học từ cache:', classData);
                displayClassInfo(classData);
                return classData;
            }
            
            // Nếu không có trong cache, lấy từ API theo code
            try {
                const response = await fetch(`${API_ENDPOINTS.GET_CLASS}/code/${classCode}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Dữ liệu lớp học từ API:', data);
                    
                    // Lấy dữ liệu lớp học từ response
                    const classData = data.data || data;
                    
                    // Lưu vào localStorage để sử dụng sau này
                    localStorage.setItem(`class_${classCode}`, JSON.stringify(classData));
                    
                    // Hiển thị thông tin lớp học
                    displayClassInfo(classData);
                    
                    return classData;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin lớp học từ API:', error);
                throw error; // Ném lỗi để xử lý ở catch bên ngoài
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin lớp học:', error);
            
            // Tạo dữ liệu mẫu nếu không lấy được từ API
            const sampleClassData = getSampleClassData(classCode);
            displayClassInfo(sampleClassData);
            
            return sampleClassData;
        }
    }

    // Hiển thị thông tin lớp học
    function displayClassInfo(classData) {
        if (!classData) {
            console.error('Không có dữ liệu lớp học để hiển thị');
            alert('Không tìm thấy thông tin lớp học');
            return;
        }
        
        console.log('Hiển thị thông tin lớp học:', classData);
        
        // Cập nhật tiêu đề trang
        document.title = `${classData.className || 'Lớp học'} - E-Learning`;
        
        // Cập nhật thông tin lớp học
        if (classNameElement) classNameElement.textContent = classData.className || 'Không có tên';
        if (teacherNameElement) teacherNameElement.textContent = classData.teacherName || (classData.teacher ? classData.teacher.name : 'Chưa phân công');
        if (classCodeElement) classCodeElement.textContent = classData.classCode || classCode;
        
        // Cập nhật màu sắc và biểu tượng dựa trên môn học
        updateClassStyle(classData);
        
        // Tải danh sách bài học
        loadLessons(classData);
    }

    // Cập nhật màu sắc và biểu tượng dựa trên môn học
    function updateClassStyle(classData) {
        if (!classIconContainerElement || !classIconTypeElement) return;
        
        let iconClass = 'fas fa-language';
        let gradientClass = 'from-blue-500 to-purple-600';
        
        // Xác định màu sắc dựa trên môn học
        if (classData.subject) {
            const subject = classData.subject.toLowerCase();
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
        
        // Cập nhật icon
        classIconTypeElement.className = `${iconClass} text-white text-2xl`;
        
        // Cập nhật màu nền
        classIconContainerElement.className = `w-16 h-16 rounded-full bg-gradient-to-r ${gradientClass} flex items-center justify-center mr-4`;
    }

    // Tải danh sách bài học
    async function loadLessons(classData) {
        if (!lessonsListElement) return;
        
        try {
            const classCodeToUse = classData.classCode || classCode;
            console.log('Đang tải danh sách bài học cho lớp:', classCodeToUse);
            
            // Hiển thị trạng thái đang tải
            lessonsListElement.innerHTML = `
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p class="text-gray-500">Đang tải danh sách bài học...</p>
                </div>
            `;
            
            // Thử lấy danh sách bài học từ API với endpoint đúng
            try {
                // Sử dụng endpoint đúng: /lessons/classroom/{classCode}
                const response = await fetch(`${API_ENDPOINTS.GET_LESSONS}/${classCodeToUse}`);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Dữ liệu bài học từ API:', result);
                    
                    // Kiểm tra cấu trúc dữ liệu trả về
                    if (result.success && Array.isArray(result.data)) {
                        const lessons = result.data;
                        
                        if (lessons.length > 0) {
                            // Hiển thị danh sách bài học
                            displayLessons(lessons);
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách bài học từ API:', error);
            }
            
            // Nếu không lấy được từ API hoặc không có bài học nào, hiển thị thông báo
            lessonsListElement.innerHTML = '<p class="text-center text-gray-500 py-4">Chưa có thông tin bài học</p>';
            
            // Hiển thị thông báo trong phần nội dung bài học
            if (lessonsContent) {
                lessonsContent.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-gray-500 mb-4">
                            <i class="fas fa-book text-5xl mb-3"></i>
                            <p class="text-lg">Chưa có thông tin bài học</p>
                        </div>
                        <p class="text-sm text-gray-400">Giáo viên sẽ cập nhật bài học trong thời gian tới</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài học:', error);
            
            if (lessonsListElement) {
                lessonsListElement.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài học</p>
                        <button class="mt-2 text-blue-500 hover:text-blue-700" onclick="location.reload()">
                            <i class="fas fa-sync-alt mr-1"></i> Thử lại
                        </button>
                    </div>
                `;
            }
        }
    }

    // Hiển thị danh sách bài học
    function displayLessons(lessons) {
        if (!lessonsListElement) return;
        
        if (!lessons || lessons.length === 0) {
            lessonsListElement.innerHTML = '<p class="text-center text-gray-500 py-4">Chưa có thông tin bài học</p>';
            
            // Hiển thị thông báo trong phần nội dung bài học
            if (lessonsContent) {
                lessonsContent.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-gray-500 mb-4">
                            <i class="fas fa-book text-5xl mb-3"></i>
                            <p class="text-lg">Chưa có thông tin bài học</p>
                        </div>
                        <p class="text-sm text-gray-400">Giáo viên sẽ cập nhật bài học trong thời gian tới</p>
                    </div>
                `;
            }
            return;
        }
        
        // Xóa nội dung cũ
        lessonsListElement.innerHTML = '';
        
        // Sắp xếp bài học theo thứ tự mới nhất trước
        lessons.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Thêm console.log để debug
        console.log(`Hiển thị ${lessons.length} bài học:`, lessons);
        
        // Tạo container cho danh sách bài học
        const lessonsContainer = document.createElement('div');
        lessonsContainer.className = 'lessons-container';
        
        lessons.forEach((lesson, index) => {
            console.log(`Đang xử lý bài học ${index + 1}:`, lesson.title);
            
            const lessonDate = lesson.createdAt ? new Date(lesson.createdAt) : null;
            const formattedDate = lessonDate ? 
                `${lessonDate.getDate()}/${lessonDate.getMonth() + 1}/${lessonDate.getFullYear()}` : 
                'Không có ngày';
            
            // Kiểm tra xem có file đính kèm không
            const hasFile = lesson.fileUrl && lesson.fileName;
            
            // Lấy tên giáo viên
            const teacherName = lesson.teacherId && lesson.teacherId.name 
                ? lesson.teacherId.name 
                : (lesson.teacherName || 'Không xác định');
            
            const lessonItem = document.createElement('div');
            lessonItem.className = 'lesson-item p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors';
            lessonItem.dataset.lessonId = lesson._id; // Thêm ID bài học vào dataset
            lessonItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-book-open text-blue-500 mr-3"></i>
                        <div>
                            <span class="font-medium">${lesson.title}</span>
                            <div class="text-xs text-gray-500 mt-1">
                                <span><i class="far fa-calendar-alt mr-1"></i>${formattedDate}</span>
                                <span class="ml-2"><i class="fas fa-user mr-1"></i>${teacherName}</span>
                                ${hasFile ? `<span class="ml-2"><i class="fas fa-paperclip mr-1"></i>1 tệp đính kèm</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="text-gray-400">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            
            lessonItem.addEventListener('click', () => {
                console.log(`Đã nhấp vào bài học: ${lesson.title}`);
                showLessonContent(lesson);
                
                // Đánh dấu bài học đang được chọn
                const allLessonItems = lessonsListElement.querySelectorAll('.lesson-item');
                allLessonItems.forEach(item => {
                    item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
                });
                lessonItem.classList.add('bg-blue-50', 'border-l-4', 'border-blue-500');
            });
            
            lessonsContainer.appendChild(lessonItem);
        });
        
        // Thêm container vào lessonsListElement
        lessonsListElement.appendChild(lessonsContainer);
        
     
    }

    // Hiển thị nội dung bài học
    function showLessonContent(lesson) {
        // Định dạng ngày tháng
        const lessonDate = lesson.createdAt ? new Date(lesson.createdAt) : null;
        const formattedDate = lessonDate ? 
            `${lessonDate.getDate()}/${lessonDate.getMonth() + 1}/${lessonDate.getFullYear()} ${lessonDate.getHours()}:${lessonDate.getMinutes().toString().padStart(2, '0')}` : 
            'Không có ngày';
        
        // Lấy tên giáo viên
        const teacherName = lesson.teacherId && lesson.teacherId.name 
            ? lesson.teacherId.name 
            : (lesson.teacherName || 'Không xác định');
        
        // Xử lý tệp đính kèm
        let fileHTML = '';
        let hasFile = lesson.fileUrl && lesson.fileUrl.trim() !== '';
        
        if (hasFile) {
            // Xác định loại tệp và biểu tượng
            const fileExtension = lesson.fileUrl.split('.').pop().toLowerCase();
            let fileIcon = 'fas fa-file';
            let isPdf = false;
            
            if (['pdf'].includes(fileExtension)) {
                fileIcon = 'fas fa-file-pdf';
                isPdf = true;
            } else if (['doc', 'docx'].includes(fileExtension)) {
                fileIcon = 'fas fa-file-word';
            } else if (['xls', 'xlsx'].includes(fileExtension)) {
                fileIcon = 'fas fa-file-excel';
            } else if (['ppt', 'pptx'].includes(fileExtension)) {
                fileIcon = 'fas fa-file-powerpoint';
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                fileIcon = 'fas fa-file-image';
            }
            
            // Tạo URL đầy đủ cho tệp
            const fileFullUrl = lesson.fileUrl.startsWith('http') ? lesson.fileUrl : `${BASE_API_URL}/${lesson.fileUrl}`;
            
            // Tạo nút xem trực tuyến dựa vào loại file
            let viewButton = '';
            if (isPdf) {
                // Sử dụng API xem PDF cho file PDF
                viewButton = `<button onclick="openPDFViewerByLessonId('${lesson._id}')" class="text-blue-500 hover:text-blue-700 p-2" title="Xem trực tuyến">
                    <i class="fas fa-eye"></i>
                </button>`;
            } else {
                // Sử dụng cách mở file thông thường cho các loại file khác
                viewButton = `<button onclick="openPDFViewer('${fileFullUrl}')" class="text-blue-500 hover:text-blue-700 p-2" title="Xem trực tuyến">
                    <i class="fas fa-eye"></i>
                </button>`;
            }
            
            fileHTML = `
                <div class="mt-6 border-t border-gray-200 pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Tệp đính kèm</h4>
                    <div class="space-y-2">
                        <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <i class="${fileIcon} text-blue-500"></i>
                            </div>
                            <div class="flex-grow">
                                <p class="font-medium text-gray-800">${lesson.fileName || 'Tài liệu đính kèm'}</p>
                                <p class="text-xs text-gray-500 block">
                                    ${formatFileSize(lesson.fileSize || 0)}
                                </p>
                            </div>
                            <div class="flex space-x-2">
                                ${viewButton}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Tạo hoặc hiển thị modal
        let lessonModal = document.getElementById('lessonDetailsModal');
        
        if (!lessonModal) {
            // Tạo modal nếu chưa tồn tại
            lessonModal = document.createElement('div');
            lessonModal.id = 'lessonDetailsModal';
            lessonModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
            lessonModal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-xl font-semibold text-gray-800">Chi tiết bài học</h3>
                        <a id="closeLessonModalBtn" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </a>
                    </div>
                    <div id="lessonModalContent" class="flex-grow p-6 overflow-y-auto">
                        <!-- Nội dung bài học sẽ được thêm vào đây -->
                    </div>
                </div>
            `;
            document.body.appendChild(lessonModal);
            
            // Thêm event listener cho nút đóng
            document.getElementById('closeLessonModalBtn').addEventListener('click', function() {
                lessonModal.classList.add('hidden');
            });
        }
        
        // Cập nhật nội dung modal
        const lessonModalContent = document.getElementById('lessonModalContent');
        lessonModalContent.innerHTML = `
            <div class="relative mb-4">
  <h2 class="text-2xl font-bold text-gray-800 text-center">
    ${lesson.title}
  </h2>
  <span class="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-500">
    <i class="far fa-clock mr-1"></i>${formattedDate}
  </span>
</div>


            <div class="flex items-center text-sm text-gray-600 mb-4">
                <span class="flex items-center">
                    <i class="fas fa-user mr-1"></i> ${teacherName}
                </span>
            </div>

            <div class="prose max-w-none">
                ${lesson.description || '<p class="text-gray-500 italic">Không có mô tả</p>'}
            </div>

            ${fileHTML}
        `;
        
        // Hiển thị modal
        lessonModal.classList.remove('hidden');
    }
    
    // Gán hàm showLessonContent vào window để có thể gọi từ bên ngoài
    window.showLessonContent = showLessonContent;
    
    // Hàm định dạng kích thước tệp
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Lấy dữ liệu lớp học mẫu
    function getSampleClassData(classCode) {
        const sampleClasses = [
            {
                classCode: 'ENG101',
                className: 'Lớp Anh Văn',
                subject: 'Tiếng Anh',
                teacherName: 'Nguyễn Văn A'
            },
            {
                classCode: 'MATH102',
                className: 'Lớp Toán',
                subject: 'Toán',
                teacherName: 'Trần Thị B'
            },
            {
                classCode: 'LIT103',
                className: 'Lớp Ngữ Văn',
                subject: 'Ngữ Văn',
                teacherName: 'Lê D'
            }
        ];
        
        // Tìm lớp học theo mã
        const foundClass = sampleClasses.find(c => c.classCode === classCode);
        
        // Nếu không tìm thấy, trả về lớp học mặc định
        if (!foundClass) {
            return {
                classCode: classCode,
                className: 'Lớp học',
                subject: 'Chưa xác định',
                teacherName: 'Chưa phân công'
            };
        }
        
        return foundClass;
    }

    // Khởi tạo: lấy thông tin lớp học
    fetchClassInfo();
});

// Hàm hiển thị lại danh sách bài học - đặt bên ngoài DOMContentLoaded để có thể gọi từ bất kỳ đâu
window.showLessonsList = function() {
    console.log('Đang thực hiện hàm showLessonsList');
    
    // Tìm hoặc tạo phần tử lessonsContent
    let lessonsContent = document.getElementById('lessonsContent');
    if (!lessonsContent) {
        console.log('Không tìm thấy phần tử lessonsContent, đang tìm kiếm phần tử thay thế...');
        
        // Tìm phần tử có thể chứa nội dung bài học
        lessonsContent = document.querySelector('.tab-content') || 
                         document.querySelector('.content-area') || 
                         document.querySelector('main');
        
        if (!lessonsContent) {
            console.error('Không tìm thấy phần tử phù hợp để hiển thị danh sách bài học');
            // Tạo thông báo lỗi
            alert('Không thể hiển thị danh sách bài học. Vui lòng tải lại trang.');
            return;
        }
    }
    
    // Lấy biến lessons từ window
    const lessons = window.lessons || [];
    console.log(`Số lượng bài học: ${lessons.length}`);
    
    // Hiển thị lại tab bài học
    const lessonsTab = document.getElementById('lessonsTab');
    if (lessonsTab) {
        lessonsTab.click();
    }
    
    // Hiển thị danh sách bài học
    lessonsContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Chi tiết bài học</h3>
            <div id="lessonsListContainer" class="space-y-2"></div>
        </div>
    `;
    
    const lessonsListContainer = document.getElementById('lessonsListContainer');
    if (!lessonsListContainer) {
        console.error('Không tìm thấy phần tử lessonsListContainer');
        return;
    }
    
    // Kiểm tra xem có bài học nào không
    if (lessons.length === 0) {
        lessonsListContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Chưa có thông tin bài học</p>';
        return;
    }
    
    // Hiển thị lại danh sách bài học
    lessons.forEach((lesson, index) => {
        const lessonDate = lesson.createdAt ? new Date(lesson.createdAt) : null;
        const formattedDate = lessonDate ? 
            `${lessonDate.getDate()}/${lessonDate.getMonth() + 1}/${lessonDate.getFullYear()}` : 
            'Không có ngày';
        
        // Kiểm tra xem có file đính kèm không
        const hasFile = lesson.fileUrl && lesson.fileName;
        
        // Lấy tên giáo viên
        const teacherName = lesson.teacherId && lesson.teacherId.name 
            ? lesson.teacherId.name 
            : (lesson.teacherName || 'Không xác định');
        
        const lessonItem = document.createElement('div');
        lessonItem.className = 'lesson-item p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors';
        lessonItem.dataset.lessonId = lesson._id;
        lessonItem.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-book-open text-blue-500 mr-3"></i>
                    <div>
                        <span class="font-medium">${lesson.title}</span>
                        <div class="text-xs text-gray-500 mt-1">
                            <span><i class="far fa-calendar-alt mr-1"></i>${formattedDate}</span>
                            <span class="ml-2"><i class="fas fa-user mr-1"></i>${teacherName}</span>
                            ${hasFile ? `<span class="ml-2"><i class="fas fa-paperclip mr-1"></i>1 tệp đính kèm</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="text-gray-400">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
        
        lessonItem.addEventListener('click', function() {
            console.log(`Đã nhấp vào bài học: ${lesson.title}`);
            window.showLessonContent(lesson);
        });
        
        lessonsListContainer.appendChild(lessonItem);
    });
    
    console.log(`Đã hiển thị ${lessons.length} bài học`);
};

// Thêm vào cuối file, bên ngoài event listener DOMContentLoaded
// Tạo modal PDF viewer nếu chưa tồn tại
document.addEventListener('DOMContentLoaded', function() {
    // Mã hiện tại...
    
    // Thêm modal PDF viewer vào trang
    if (!document.getElementById('pdfModal')) {
        const pdfModal = document.createElement('div');
        pdfModal.id = 'pdfModal';
        pdfModal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 hidden items-center justify-center';
        pdfModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-xl font-semibold text-gray-800">Xem tài liệu</h3>
                    <button onclick="closePDFViewer()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="flex-grow p-0 overflow-hidden">
                    <iframe id="pdfFrame" src="" class="w-full h-full border-0"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(pdfModal);
        
        // Thêm event listener cho nút đóng
        document.getElementById('closePdfModalBtn').addEventListener('click', closePDFViewer);
    }
});

// Định nghĩa hàm openPDFViewer ở mức global để có thể gọi từ bất kỳ đâu
window.openPDFViewer = function(pdfUrl) {
    // Đóng modal Chi tiết bài học nếu đang mở
    const lessonModal = document.getElementById('lessonDetailsModal');
    if (lessonModal && !lessonModal.classList.contains('hidden')) {
        lessonModal.classList.add('hidden');
    }
    
    // Mở modal PDF viewer
    document.getElementById('pdfFrame').src = pdfUrl;
    document.getElementById('pdfModal').classList.remove('hidden');
    document.getElementById('pdfModal').classList.add('flex');
};

// Định nghĩa hàm openPDFViewerByLessonId ở mức global
window.openPDFViewerByLessonId = function(lessonId) {
    if (!lessonId) {
        showToast('Không thể mở tài liệu: ID bài học không hợp lệ', 'error');
        return;
    }
    
    // Đóng modal Chi tiết bài học nếu đang mở
    const lessonModal = document.getElementById('lessonDetailsModal');
    if (lessonModal && !lessonModal.classList.contains('hidden')) {
        lessonModal.classList.add('hidden');
    }
    
    const pdfUrl = `${BASE_API_URL}/lessons/${lessonId}/view-pdf`;
    
    // Mở modal PDF viewer
    document.getElementById('pdfFrame').src = pdfUrl;
    document.getElementById('pdfModal').classList.remove('hidden');
    document.getElementById('pdfModal').classList.add('flex');
};

// Thêm hàm đóng PDF viewer ở mức global
window.closePDFViewer = function() {
    const pdfModal = document.getElementById('pdfModal');
    if (pdfModal) {
        pdfModal.classList.add('hidden');
        pdfModal.classList.remove('flex');
        
        // Xóa nội dung iframe để tránh tiếp tục tải tài nguyên
        const pdfFrame = document.getElementById('pdfFrame');
        if (pdfFrame) {
            pdfFrame.src = '';
        }
    }
};

// Xử lý thông báo
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsModal = document.getElementById('notificationsModal');
const closeNotificationsBtn = document.getElementById('closeNotificationsBtn');
const unreadBadge = document.getElementById('unreadBadge');

if (notificationsBtn && notificationsModal) {
    // Mở modal thông báo khi nhấn nút
    notificationsBtn.addEventListener('click', function() {
        notificationsModal.classList.remove('hidden');
        notificationsModal.classList.add('flex');
        loadNotifications();
    });
    
    // Đóng modal thông báo
    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', function() {
            notificationsModal.classList.add('hidden');
            notificationsModal.classList.remove('flex');
        });
    }
    
    // Kiểm tra thông báo chưa đọc khi trang được tải
    checkUnreadNotifications();
}

// Hàm tải danh sách thông báo
async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    // Hiển thị loading
    notificationsList.innerHTML = `
        <div class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p class="text-gray-500">Đang tải thông báo...</p>
        </div>
    `;
    
    // Lấy mã lớp từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (!classCode) {
        notificationsList.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Không tìm thấy mã lớp học</p>
            </div>
        `;
        return;
    }
    
    // Lấy email người dùng từ localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        notificationsList.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Không tìm thấy thông tin người dùng</p>
            </div>
        `;
        return;
    }
    
    try {
        // Gọi API để lấy danh sách thông báo
        const response = await fetch(`${API_ENDPOINTS.GET_NOTIFICATIONS}/${classCode}?userEmail=${userEmail}`);
        const data = await response.json();
        
        console.log('Dữ liệu thông báo nhận được:', data);
        
        // Kiểm tra cấu trúc dữ liệu và đảm bảo notifications là một mảng
        let notifications = [];
        
        if (data && data.success && Array.isArray(data.data)) {
            notifications = data.data;
        } else if (Array.isArray(data)) {
            notifications = data;
        }
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-gray-500">Chưa có thông báo nào</p>
                </div>
            `;
            return;
        }
        
        // Hiển thị danh sách thông báo
        notificationsList.innerHTML = '';
        
        notifications.forEach(notification => {
            // Kiểm tra xem người dùng đã đọc thông báo chưa
            const isRead = Array.isArray(notification.readBy) && notification.readBy.includes(userEmail);
            
            // Định dạng ngày tạo
            const createdDate = new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const notificationItem = document.createElement('div');
            notificationItem.className = `bg-white p-4 rounded-lg shadow-sm border ${isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50'} hover:shadow-md transition-shadow`;
            notificationItem.dataset.notificationId = notification._id;
            
            notificationItem.innerHTML = `
                <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                        <i class="fas fa-bell text-blue-500"></i>
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-medium text-lg">${notification.title || 'Thông báo không có tiêu đề'}</h4>
                        <div class="flex items-center text-sm text-gray-600 mt-1">
                            <span class="flex items-center mr-3">
                                <i class="fas fa-user mr-1"></i> ${notification.teacherName || 'Giáo viên'}
                            </span>
                            <span class="flex items-center">
                                <i class="far fa-calendar-alt mr-1"></i> ${createdDate}
                            </span>
                        </div>
                        ${notification.content ? `<p class="text-sm text-gray-700 mt-2">${notification.content}</p>` : ''}
                    </div>
                    ${!isRead ? `<span class="w-3 h-3 bg-blue-500 rounded-full"></span>` : ''}
                </div>
            `;
            
            // Thêm sự kiện click để đánh dấu là đã đọc
            notificationItem.addEventListener('click', () => markAsRead(notification._id));
            
            notificationsList.appendChild(notificationItem);
        });
        
        // Cập nhật số lượng thông báo chưa đọc
        updateUnreadBadge(notifications);
        
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        notificationsList.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Có lỗi xảy ra khi tải thông báo</p>
                <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md" onclick="loadNotifications()">
                    <i class="fas fa-sync-alt mr-1"></i> Thử lại
                </button>
            </div>
        `;
    }
}

// Hàm đánh dấu thông báo đã đọc
async function markAsRead(notificationId) {
    if (!notificationId) return;
    
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;
    
    try {
        // Gọi API để đánh dấu thông báo đã đọc
        const response = await fetch(`${BASE_API_URL}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userEmail: userEmail
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cập nhật giao diện
            const notificationItem = document.querySelector(`div[data-notification-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.remove('border-blue-200', 'bg-blue-50');
                notificationItem.classList.add('border-gray-200');
                
                // Xóa dấu chấm xanh
                const unreadDot = notificationItem.querySelector('.bg-blue-500.rounded-full');
                if (unreadDot) unreadDot.remove();
            }
            
            // Tải lại số lượng thông báo chưa đọc
            checkUnreadNotifications();
        }
    } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    }
}

// Hàm kiểm tra thông báo chưa đọc
async function checkUnreadNotifications() {
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!classCode || !userEmail) return;
    
    try {
        // Gọi API để lấy danh sách thông báo
        const response = await fetch(`${API_ENDPOINTS.GET_NOTIFICATIONS}/${classCode}?userEmail=${userEmail}`);
        const data = await response.json();
        
        let notifications = [];
        
        if (data && data.success && Array.isArray(data.data)) {
            notifications = data.data;
        } else if (Array.isArray(data)) {
            notifications = data;
        }
        
        // Cập nhật số lượng thông báo chưa đọc
        updateUnreadBadge(notifications);
        
    } catch (error) {
        console.error('Lỗi khi kiểm tra thông báo chưa đọc:', error);
    }
}

// Hàm cập nhật badge thông báo chưa đọc
function updateUnreadBadge(notifications) {
    if (!unreadBadge) return;
    
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;
    
    // Đếm số lượng thông báo chưa đọc
    const unreadCount = notifications.filter(notification => {
        return !(Array.isArray(notification.readBy) && notification.readBy.includes(userEmail));
    }).length;
    
    if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        unreadBadge.classList.remove('hidden');
    } else {
        unreadBadge.classList.add('hidden');
    }
}

// Đặt các hàm vào window để có thể gọi từ bất kỳ đâu
window.loadNotifications = loadNotifications;
window.markAsRead = markAsRead;
window.checkUnreadNotifications = checkUnreadNotifications;

// Thêm hàm tải danh sách bài tập
async function loadAssignments(classCode) {
    try {
        const assignmentsContent = document.getElementById('assignments-content');
        if (!assignmentsContent) return;
        
        // Hiển thị trạng thái đang tải
        assignmentsContent.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách bài tập...</p>
            </div>
        `;
        
        // Lấy trạng thái nộp bài từ API
        submissionStatusData = await fetchSubmissionStatus(classCode);
        
        // Gọi API để lấy danh sách bài tập
        const response = await fetch(`${API_ENDPOINTS.GET_ASSIGNMENTS}/${classCode}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dữ liệu bài tập từ API:', result);
        
        // Kiểm tra cấu trúc dữ liệu trả về
        let assignments = [];
        if (result.success && Array.isArray(result.data)) {
            assignments = result.data;
        } else if (Array.isArray(result)) {
            assignments = result;
        }
        
        // Nếu có dữ liệu trạng thái nộp bài, kết hợp với danh sách bài tập
        if (submissionStatusData && submissionStatusData.assignments) {
            // Tạo map từ dữ liệu trạng thái nộp bài
            const submissionMap = {};
            submissionStatusData.assignments.forEach(item => {
                submissionMap[item.assignmentId] = item.submissionStatus;
            });
            
            // Cập nhật trạng thái nộp bài cho từng bài tập
            assignments = assignments.map(assignment => {
                const assignmentId = assignment._id || assignment.id;
                if (submissionMap[assignmentId]) {
                    assignment.submissionStatus = submissionMap[assignmentId];
                }
                return assignment;
            });
        }
        
        // Hiển thị danh sách bài tập
        displayAssignments(assignments, assignmentsContent);
    } catch (error) {
        console.error('Lỗi khi tải danh sách bài tập:', error);
        const assignmentsContent = document.getElementById('assignments-content');
        if (assignmentsContent) {
            assignmentsContent.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài tập</p>
                    <button class="mt-2 text-blue-500 hover:text-blue-700" onclick="loadAssignments('${classCode}')">
                        <i class="fas fa-sync-alt mr-1"></i> Thử lại
                    </button>
                </div>
            `;
        }
    }
}

// Hàm hiển thị danh sách bài tập
function displayAssignments(assignments, container) {
    if (!container) return;
    
    if (!assignments || assignments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-500 mb-4">
                    <i class="fas fa-tasks text-5xl mb-3"></i>
                    <p class="text-lg">Chưa có bài tập nào</p>
                </div>
                <p class="text-sm text-gray-400">Giáo viên sẽ cập nhật bài tập trong thời gian tới</p>
            </div>
        `;
        return;
    }
    
    // Sắp xếp bài tập theo thứ tự mới nhất trước
    assignments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    // Tạo container cho danh sách bài tập
    const assignmentsContainer = document.createElement('div');
    assignmentsContainer.className = 'space-y-4';
    
    // Hiển thị từng bài tập
    assignments.forEach(assignment => {
        // Định dạng ngày hạn nộp
        const dueDate = new Date(assignment.dueDate);
        const formattedDueDate = dueDate.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Lấy thông tin trạng thái nộp bài
        const submissionStatus = assignment.submissionStatus || { submitted: false, isLate: false };
        
        // Tạo badge trạng thái nộp bài
        let statusBadge = '';
        if (submissionStatus.submitted) {
            if (submissionStatus.isGraded) {
                statusBadge = `<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">Đã chấm: ${submissionStatus.grade || 'N/A'}</span>`;
            } else if (submissionStatus.isLate) {
                statusBadge = '<span class="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded">Nộp trễ</span>';
            } else {
                statusBadge = '<span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Đã nộp</span>';
            }
        } else {
            const now = new Date();
            if (now > dueDate) {
                statusBadge = '<span class="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">Quá hạn</span>';
            } else {
                statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">Chưa nộp</span>';
            }
        }
        
        // Tạo thông tin thời gian nộp bài
        let submittedInfo = '';
        if (submissionStatus.submitted && submissionStatus.submittedAt) {
            const submittedDate = new Date(submissionStatus.submittedAt);
            const formattedSubmittedDate = submittedDate.toLocaleString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            submittedInfo = `<span class="mr-3"><i class="far fa-paper-plane mr-1"></i>Đã nộp: ${formattedSubmittedDate}</span>`;
        }
        
        // Kiểm tra có file đính kèm không
        const hasAttachment = assignment.fileUrl && assignment.fileName;

          // Kiểm tra quá hạn: nếu hiện tại đã sau hạn nộp thì disable nút, bất kể đã nộp hay chưa
    const now = new Date();
    const isOverdue = now > dueDate;
    const buttonDisabled = isOverdue ? 'disabled' : '';
    const buttonClass = isOverdue
        ? 'bg-gray-300 cursor-not-allowed text-white text-sm px-3 py-1 rounded-md'
        : (submissionStatus.submitted
            ? 'bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-md'
            : 'bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md');
        
        // Tạo phần tử bài tập
    const assignmentItem = document.createElement('div');
    assignmentItem.className = 'bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow';
    assignmentItem.dataset.assignmentId = assignment._id || assignment.id;
    assignmentItem.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-start">
                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <i class="fas fa-tasks text-yellow-500"></i>
                </div>
                <div>
                    <h3 class="font-medium text-gray-800">${assignment.title || 'Bài tập không có tiêu đề'}</h3>
                    <p class="text-sm text-gray-600 mt-1">${assignment.description || 'Không có mô tả'}</p>
                    <div class="flex flex-wrap items-center mt-2 text-xs text-gray-500">
                        <span class="mr-3"><i class="far fa-clock mr-1"></i>Hạn nộp: ${formattedDueDate}</span>
                        ${submittedInfo}
                        <span class="submission-status">${statusBadge}</span>
                    </div>
                </div>
            </div>
            <div>
    ${
        submissionStatus.submitted
        ? `<button class="submit-button ${buttonClass}" 
                onclick="showResubmitAssignmentModal('${assignment._id || assignment.id}', '${assignment.title.replace(/'/g, "\\'")}', '${submissionStatus.submissionId || ''}')"
                ${buttonDisabled}>
                Nộp lại
            </button>`
        : `<button class="submit-button ${buttonClass}" 
                onclick="showSubmitAssignmentModal('${assignment._id || assignment.id}', '${assignment.title.replace(/'/g, "\\'")}')"
                ${buttonDisabled}>
                Nộp bài
            </button>`
    }
</div>
        </div>
        ${hasAttachment ? `
            <div class="mt-3 p-2 bg-gray-50 rounded-md">
                <a href="${assignment.fileUrl}" target="_blank" class="flex items-center text-blue-500 hover:text-blue-700"
                onclick="viewAssignmentPdf('${assignment._id || assignment.id}')">
                    <i class="fas fa-paperclip mr-2"></i>
                    <span>${assignment.fileName}</span>
                    <span class="text-xs text-gray-500 ml-2">(${formatFileSize(assignment.fileSize)})</span>
                </a>
            </div>
        ` : ''}
        ${submissionStatus.submitted ? `
            <div class="mt-3 p-2 bg-gray-50 rounded-md">
                <div class="flex items-center text-gray-700">
                    <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                    <span>Trạng thái: ${getSubmissionStatusText(submissionStatus.status)}</span>                    
                </div>
                ${submissionStatus.feedback && submissionStatus.feedback.trim() !== '' ? `
            <div class="mt-2 flex items-start text-gray-600">
                <i class="fas fa-comment-dots mr-2 text-green-500"></i>
                <span>Nhận xét: ${submissionStatus.feedback}</span>
            </div>
        ` : ''}
            </div>
        ` : ''}
    `;

    assignmentsContainer.appendChild(assignmentItem);
});
    
    // Xóa nội dung cũ và thêm danh sách bài tập mới
    container.innerHTML = '';
    container.appendChild(assignmentsContainer);
}

// hàm xem file pdf bài tập
function viewAssignmentPdf(assignmentId) {
    if (!assignmentId) {
        showToast('Không tìm thấy assignmentId', 'error');
        return;
    }
    const url = `${API_ENDPOINTS.VIEW_ASSIGNMENT}/${assignmentId}/view-pdf`;
    window.open(url, '_blank');
}
window.viewAssignmentPdf = viewAssignmentPdf;

// Hàm nộp lại bài tập
function showResubmitAssignmentModal(assignmentId, assignmentTitle, submissionId) {
    if (!submissionId) {
        window.showToast('Không tìm thấy submissionId để nộp lại', 'error');
        return;
    }
    // Hiển thị modal như cũ, nhưng lưu submissionId vào input ẩn
    showSubmitAssignmentModal(assignmentId, assignmentTitle);
    // Sau khi modal hiện ra, thêm input ẩn submissionId
    setTimeout(() => {
        let input = document.getElementById('submissionSubmissionId');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'submissionSubmissionId';
            document.getElementById('submitAssignmentForm').appendChild(input);
        }
        input.value = submissionId;
        // Đánh dấu là nộp lại
        document.getElementById('submitModalTitle').textContent = 'Nộp lại bài tập';
    }, 100);
}
window.showResubmitAssignmentModal = showResubmitAssignmentModal;

// Hàm định dạng kích thước file
function formatFileSize(size) {
    if (!size) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let formattedSize = size;
    let unitIndex = 0;
    
    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
        formattedSize /= 1024;
        unitIndex++;
    }
    
    return `${formattedSize.toFixed(1)} ${units[unitIndex]}`;
}

// Hàm xem chi tiết bài tập
function viewAssignment(assignmentId) {
    // Chuyển hướng đến trang chi tiết bài tập
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (classCode && assignmentId) {
        window.location.href = `./assignment_detail.html?code=${classCode}&id=${assignmentId}`;
    }
}

// Hàm hiển thị modal nộp bài tập
function showSubmitAssignmentModal(assignmentId, assignmentTitle) {
    // Lấy thông tin người dùng từ localStorage
    const studentEmail = localStorage.getItem('userEmail');
    const classCode = new URLSearchParams(window.location.search).get('code');
    const oldInput = document.getElementById('submissionSubmissionId');
    if (oldInput) oldInput.remove();

    if (!studentEmail || !classCode) {
        showToast('Không thể xác định thông tin học sinh hoặc lớp học', 'error');
        return;
    }
    
    // Tạo modal nếu chưa tồn tại
    let submitModal = document.getElementById('submitAssignmentModal');
    
    if (!submitModal) {
        submitModal = document.createElement('div');
        submitModal.id = 'submitAssignmentModal';
        submitModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 hidden';
        submitModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
                <div class="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
                    <h3 class="text-lg font-medium" id="submitModalTitle">Nộp bài tập</h3>
                    <a id="closeSubmitModalBtn" class="text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </a>
                </div>
                
                <form id="submitAssignmentForm" class="p-4">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-medium mb-2">Bài tập</label>
                        <div id="assignmentTitleDisplay" class="px-3 py-2 bg-gray-100 rounded-md"></div>
                    </div>
                    
                    <div class="mb-4">
                        <label for="submissionFile" class="block text-gray-700 font-medium mb-2">Tệp đính kèm <span class="text-red-500">*</span></label>
                        <input type="file" id="submissionFile" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <p class="text-xs text-gray-500 mt-1">Tải lên tệp bài làm của bạn (PDF)</p>
                    </div>
                    
                    <input type="hidden" id="submissionAssignmentId">
                    <input type="hidden" id="submissionStudentEmail">
                    <input type="hidden" id="submissionClassCode">
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="submit" id="confirmSubmitBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-paper-plane mr-1"></i>Nộp bài
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(submitModal);
        
        // Thêm event listener cho nút đóng và nút hủy
        document.getElementById('closeSubmitModalBtn').addEventListener('click', closeSubmitAssignmentModal);
        
        // Thêm event listener cho form nộp bài
        document.getElementById('submitAssignmentForm').addEventListener('submit', handleSubmitAssignment);
    }
    
    // Cập nhật thông tin trong modal
    document.getElementById('assignmentTitleDisplay').textContent = assignmentTitle || 'Bài tập';
    document.getElementById('submissionAssignmentId').value = assignmentId;
    document.getElementById('submissionStudentEmail').value = studentEmail;
    document.getElementById('submissionClassCode').value = classCode;
    
    // Hiển thị modal
    submitModal.classList.remove('hidden');
}

// Hàm đóng modal nộp bài tập
function closeSubmitAssignmentModal() {
    const modal = document.getElementById('submitAssignmentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Hàm xử lý nộp bài tập
function handleSubmitAssignment(event) {
    event.preventDefault();
    
    // Lấy các giá trị từ form
    const assignmentId = document.getElementById('submissionAssignmentId').value;
    const studentEmail = document.getElementById('submissionStudentEmail').value;
    const classCode = document.getElementById('submissionClassCode').value;
    const fileInput = document.getElementById('submissionFile');
    const submissionId = document.getElementById('submissionSubmissionId')?.value || '';
    
    // Kiểm tra file đã được chọn chưa
    if (!fileInput.files || fileInput.files.length === 0) {
        window.showToast('Vui lòng chọn tệp bài làm để nộp', 'error');
        return;
    }
    
    // Hiển thị loading
    const submitBtn = document.getElementById('confirmSubmitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Đang nộp bài...`;
    
    // Tạo FormData để gửi dữ liệu và file
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('studentEmail', studentEmail);
    formData.append('classCode', classCode);
    formData.append('submissionFile', fileInput.files[0]);
    
    console.log('API endpoint for submission:', API_ENDPOINTS.SUBMIT_ASSIGNMENT);

    console.log('Đang gửi dữ liệu nộp bài tập:', {
        assignmentId,
        studentEmail,
        classCode,
        fileName: fileInput.files[0].name
    });

    console.log('FormData entries:');
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }
    
     const apiUrl = submissionId
        ? `${API_ENDPOINTS.SUBMIT_ASSIGNMENT}/${submissionId}`
        : API_ENDPOINTS.SUBMIT_ASSIGNMENT;
    const method = submissionId ? 'PUT' : 'POST';

    fetch(apiUrl, {
        method,
        body: formData
    })
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
})
.then(result => {
    console.log('Kết quả nộp bài tập:', result);
    
    if (result.success) {
        window.showToast('Nộp bài tập thành công!', 'success');
        closeSubmitAssignmentModal();
        updateSubmissionStatus(assignmentId, true);
        const classCode = document.getElementById('submissionClassCode').value;
        if (classCode) {
            setTimeout(() => {
                loadAssignments(classCode);
            }, 1000);
        }
    } else {
        window.showToast(`Lỗi: ${result.message || 'Không thể nộp bài tập'}`, 'error');
    }
})
.catch(error => {
    console.error('Error submitting assignment:', error);
    window.showToast('Có lỗi xảy ra khi nộp bài tập', 'error');
})
.finally(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
});
}

// Hàm cập nhật trạng thái nộp bài trong giao diện
function updateSubmissionStatus(assignmentId, isSubmitted) {
    const assignmentElement = document.querySelector(`[data-assignment-id="${assignmentId}"]`);
    if (!assignmentElement) return;
    
    const statusBadge = assignmentElement.querySelector('.submission-status');
    if (statusBadge) {
        if (isSubmitted) {
            statusBadge.innerHTML = '<span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Đã nộp</span>';
        } else {
            statusBadge.innerHTML = '<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">Chưa nộp</span>';
        }
    }
    
    // Cập nhật nút nộp bài
    const submitButton = assignmentElement.querySelector('.submit-button');
    if (submitButton) {
        if (isSubmitted) {
            submitButton.textContent = 'Nộp lại';
            submitButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            submitButton.classList.add('bg-green-500', 'hover:bg-green-600');
        }
    }
}

// Sửa lại phần xử lý sự kiện chuyển tab để tải bài tập khi chuyển đến tab bài tập
document.addEventListener('DOMContentLoaded', function() {
    // Khai báo biến toàn cục
    window.lessons = [];
    window.assignments = [];
    
    // Lấy tham chiếu đến các tab và nội dung
    const lessonsTab = document.getElementById('lessons-tab');
    const assignmentsTab = document.getElementById('assignments-tab');
    const testsTab = document.getElementById('tests-tab');
    const lessonsContent = document.getElementById('lessons-content');
    const assignmentsContent = document.getElementById('assignments-content');
    const testsContent = document.getElementById('tests-content');
    
    // Lấy mã lớp học từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    // Xử lý sự kiện chuyển tab
    if (assignmentsTab) {
        assignmentsTab.addEventListener('click', function() {
            // Hiển thị tab bài tập, ẩn các tab khác
            if (lessonsContent) lessonsContent.classList.add('hidden');
            if (assignmentsContent) assignmentsContent.classList.remove('hidden');
            if (testsContent) testsContent.classList.add('hidden');
            
            // Cập nhật trạng thái active của các tab
            if (lessonsTab) {
                lessonsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
                lessonsTab.classList.add('text-gray-500');
            }
            assignmentsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
            assignmentsTab.classList.remove('text-gray-500');
            if (testsTab) {
                testsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
                testsTab.classList.add('text-gray-500');
            }
            
            // Tải danh sách bài tập nếu chưa tải
            if (classCode && (!window.assignments || window.assignments.length === 0)) {
                loadAssignments(classCode);
            }
        });
    }
    
    // Thêm vào phần fetchClassInfo để tải bài tập khi lớp học được tải
    const originalFetchClassInfo = window.fetchClassInfo;
    window.fetchClassInfo = async function() {
        const classData = await originalFetchClassInfo();
        
        // Sau khi lấy thông tin lớp học, tải danh sách bài tập
        if (classData && classData.classCode) {
            // Tải danh sách bài tập nếu tab bài tập đang hiển thị
            if (assignmentsContent && !assignmentsContent.classList.contains('hidden')) {
                loadAssignments(classData.classCode);
            }
        }
        
        return classData;
    };
});

// Hàm hiển thị thông báo
window.showToast = function(message, type = 'info') {
    // Tạo phần tử toast nếu chưa tồn tại
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-4 right-4 z-50 transform transition-transform duration-300 translate-y-full';
        document.body.appendChild(toast);
    }
    
    // Xác định màu sắc dựa trên loại thông báo
    let bgColor, textColor, icon;
    
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = '<i class="fas fa-check-circle mr-2"></i>';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-white';
            icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
            break;
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = '<i class="fas fa-info-circle mr-2"></i>';
    }
    
    // Cập nhật nội dung và lớp CSS
    toast.className = `fixed bottom-4 right-4 z-50 ${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center transform transition-transform duration-300 translate-y-0`;
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    // Hiển thị toast
    setTimeout(() => {
        toast.classList.remove('translate-y-full');
        toast.classList.add('translate-y-0');
    }, 100);
    
    // Tự động ẩn toast sau 3 giây
    setTimeout(() => {
        toast.classList.remove('translate-y-0');
        toast.classList.add('translate-y-full');
    }, 3000);
};

// Biến lưu trữ thông tin trạng thái nộp bài
let submissionStatusData = null;

// Hàm lấy trạng thái nộp bài từ API
async function fetchSubmissionStatus(classCode) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail || !classCode) return null;
    
    try {
        const response = await fetch(`${API_ENDPOINTS.GET_SUBMISSION_STATUS}/${classCode}?studentEmail=${userEmail}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dữ liệu trạng thái nộp bài:', result);
        
        if (result.success && result.data) {
            return result.data;
        }
        
        return null;
    } catch (error) {
        console.error('Lỗi khi lấy trạng thái nộp bài:', error);
        return null;
    }
}

// Hàm chuyển đổi trạng thái nộp bài thành văn bản
function getSubmissionStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Đang chờ chấm';
        case 'graded':
            return 'Đã chấm điểm';
        case 'late':
            return 'Nộp trễ';
        case 'rejected':
            return 'Bị từ chối';
        default:
            return 'Đã nộp';
    }
}

async function loadQuizzes(classCode) {
    const testsContent = document.getElementById('tests-content');
    if (!testsContent) return;

    // Hiển thị trạng thái đang tải
    testsContent.innerHTML = `
        <div class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p class="text-gray-500">Đang tải danh sách bài kiểm tra...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_ENDPOINTS.GET_QUIZZES}/${classCode}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.quizzes) || data.quizzes.length === 0) {
            testsContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-500 mb-4">
                        <i class="fas fa-clipboard-list text-5xl mb-3"></i>
                        <p class="text-lg">Chưa có bài kiểm tra nào</p>
                    </div>
                    <p class="text-sm text-gray-400">Giáo viên sẽ cập nhật bài kiểm tra trong thời gian tới</p>
                </div>
            `;
            return;
        }

        // Hiển thị danh sách bài kiểm tra
        const quizzesContainer = document.createElement('div');
        quizzesContainer.className = 'space-y-4';

        data.quizzes.forEach(quiz => {
            const quizDiv = document.createElement('div');
            quizDiv.className = 'bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow';

            quizDiv.innerHTML = `
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="font-medium text-gray-800">${quiz.title || 'Bài kiểm tra không có tiêu đề'}</h3>
                        <p class="text-sm text-gray-600 mt-1">${quiz.description || ''}</p>
                        <div class="flex flex-wrap items-center mt-2 text-xs text-gray-500">
                            <span class="mr-3"><i class="far fa-clock mr-1"></i>Thời gian: ${quiz.timeLimit || 0} phút</span>
                            <span class="mr-3"><i class="fas fa-question mr-1"></i>Số câu hỏi: ${quiz.questions ? quiz.questions.length : 0}</span>
                        </div>
                    </div>
                    <div>
                        <button class="text-blue-500 hover:text-blue-700" onclick="viewQuizDetail('${quiz._id}')">
                            <i class="fas fa-eye"></i> Làm bài
                        </button>
                    </div>
                </div>
            `;
            quizzesContainer.appendChild(quizDiv);
        });

        testsContent.innerHTML = '';
        testsContent.appendChild(quizzesContainer);

    } catch (error) {
        console.error('Lỗi khi tải danh sách bài kiểm tra:', error);
        testsContent.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài kiểm tra</p>
                <button class="mt-2 text-blue-500 hover:text-blue-700" onclick="loadQuizzes('${classCode}')">
                    <i class="fas fa-sync-alt mr-1"></i> Thử lại
                </button>
            </div>
        `;
    }
}
window.loadQuizzes = loadQuizzes;

function viewQuizDetail(quizId) {
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    const userEmail = localStorage.getItem('userEmail'); // Lấy userEmail từ localStorage
    // Thêm userEmail vào URL nếu có
    const url = `quiz.html?id=${quizId}&code=${classCode}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
    window.open(url, '_blank');
}
window.viewQuizDetail = viewQuizDetail;