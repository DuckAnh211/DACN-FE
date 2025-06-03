// Định nghĩa BASE_API_URL
const BASE_API_URL = 'http://localhost:8080/v1/api';

// Định nghĩa API_ENDPOINTS
const API_ENDPOINTS = {
    GET_CLASS: `${BASE_API_URL}/classrooms`,
    GET_CLASSES: `${BASE_API_URL}/classrooms`,
    GET_LESSONS: `${BASE_API_URL}/lessons/classroom`,
    DELETE_LESSON: `${BASE_API_URL}/lessons`
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
