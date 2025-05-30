/**
 * Mở trình xem PDF khi người dùng nhấp vào nút xem bài
 * @param {string} pdfUrl - URL của tệp PDF cần hiển thị
 */
function openPDFViewer(pdfUrl) { 
    document.getElementById('pdfFrame').src = pdfUrl; 
    document.getElementById('pdfModal').classList.remove('hidden'); 
    document.getElementById('pdfModal').classList.add('flex'); 
} 

/**
 * Đóng trình xem PDF
 */
function closePDFViewer() { 
    document.getElementById('pdfModal').classList.add('hidden'); 
    document.getElementById('pdfModal').classList.remove('flex'); 
    document.getElementById('pdfFrame').src = ''; 
} 

/**
 * Khởi tạo chức năng chuyển đổi tab
 */
document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api';
    const API_ENDPOINTS = {
        GET_CLASS: `${BASE_API_URL}/classrooms`,
        GET_LESSONS: `${BASE_API_URL}/lessons`
    };

    // Lấy tham chiếu đến các phần tử DOM
    const classNameElement = document.getElementById('className');
    const teacherNameElement = document.getElementById('teacherName');
    const classCodeElement = document.getElementById('classCode');
    const classIconElement = document.getElementById('classIcon');
    const classIconTypeElement = document.getElementById('classIconType');
    const lessonsListElement = document.getElementById('lessons-list');
    const lessonsContent = document.getElementById('lessons-content');
    const assignmentsContent = document.getElementById('assignments-content');

    // Lấy mã lớp học từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (!classCode) {
        alert('Không tìm thấy thông tin lớp học');
        window.location.href = './home.html';
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
        if (!classIconElement || !classIconTypeElement) return;
        
        let iconClass = 'fas fa-language';
        let gradientClass = 'from-blue-500 to-purple-600';
        
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
            }
        }
        
        // Cập nhật biểu tượng
        classIconTypeElement.className = iconClass + ' text-white text-5xl';
        
        // Cập nhật màu nền
        classIconElement.className = `bg-gradient-to-r ${gradientClass} h-32 flex items-center justify-center`;
    }

    // Tải danh sách bài học
    async function loadLessons(classData) {
        if (!lessonsListElement) return;
        
        try {
            const classCodeToUse = classData.classCode || classCode;
            console.log('Đang tải danh sách bài học cho lớp:', classCodeToUse);
            
            // Thử lấy danh sách bài học từ API
            try {
                const response = await fetch(`${API_ENDPOINTS.GET_LESSONS}/class/${classCodeToUse}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Dữ liệu bài học từ API:', data);
                    
                    // Lấy danh sách bài học từ response
                    const lessons = data.data || data;
                    
                    if (Array.isArray(lessons) && lessons.length > 0) {
                        // Hiển thị danh sách bài học
                        displayLessons(lessons);
                        return;
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
            lessonsListElement.innerHTML = '<p class="text-center text-gray-500 py-4">Chưa có thông tin bài học</p>';
            
            // Hiển thị thông báo trong phần nội dung bài học
            if (lessonsContent) {
                lessonsContent.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-gray-500 mb-4">
                            <i class="fas fa-exclamation-circle text-5xl mb-3"></i>
                            <p class="text-lg">Không thể tải thông tin bài học</p>
                        </div>
                        <p class="text-sm text-gray-400">Vui lòng thử lại sau</p>
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
        
        lessonsListElement.innerHTML = '';
        
        lessons.forEach(lesson => {
            const lessonItem = document.createElement('div');
            lessonItem.className = 'p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer';
            lessonItem.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-book-open text-blue-500 mr-3"></i>
                    <span>${lesson.title}</span>
                </div>
            `;
            
            lessonItem.addEventListener('click', () => {
                showLessonContent(lesson);
            });
            
            lessonsListElement.appendChild(lessonItem);
        });
        
        // Mặc định hiển thị bài học đầu tiên
        if (lessons.length > 0 && lessonsContent) {
            showLessonContent(lessons[0]);
        }
    }

    // Hiển thị nội dung bài học
    function showLessonContent(lesson) {
        if (!lessonsContent) return;
        
        // Đánh dấu bài học đang được chọn
        const lessonItems = lessonsListElement.querySelectorAll('div');
        lessonItems.forEach(item => {
            item.classList.remove('bg-blue-50');
        });
        
        // Tìm và đánh dấu bài học đang được chọn
        const selectedLesson = Array.from(lessonItems).find(item => 
            item.textContent.trim().includes(lesson.title)
        );
        if (selectedLesson) {
            selectedLesson.classList.add('bg-blue-50');
        }
        
        // Hiển thị nội dung bài học
        lessonsContent.innerHTML = `
            <h3 class="text-xl font-bold mb-4">${lesson.title}</h3>
            <div class="prose max-w-none bg-white p-6 rounded-lg shadow-sm">
                ${lesson.content || 'Chưa có nội dung chi tiết cho bài học này.'}
            </div>
        `;
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
