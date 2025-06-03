document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api';
    const API_ENDPOINTS = {
        GET_CLASS: `${BASE_API_URL}/classrooms`,
        GET_STUDENTS: `${BASE_API_URL}/classroom-students`,
        GET_LESSONS: `${BASE_API_URL}/lessons/classroom`, // Cập nhật endpoint mới
        CREATE_LESSON: `${BASE_API_URL}/lessons`,
        DELETE_LESSON: `${BASE_API_URL}/lessons`, // Endpoint cơ bản, ID sẽ được thêm vào sau
        // Thêm các endpoint khác nếu cần
    };

    // Lấy tham chiếu đến các phần tử DOM
    const classNameElement = document.getElementById('className');
    const teacherNameElement = document.getElementById('teacherName');
    const classCodeElement = document.getElementById('classCode');
    const classIconContainerElement = document.getElementById('classIconContainer');
    const classIconTypeElement = document.getElementById('classIconType');
    
    // Lấy tham chiếu đến các tab và nội dung
    const overviewTab = document.getElementById('overview-tab');
    const studentsTab = document.getElementById('students-tab');
    const lessonsTab = document.getElementById('lessons-tab');
    const assignmentsTab = document.getElementById('assignments-tab');
    const testsTab = document.getElementById('tests-tab');
    
    const overviewContent = document.getElementById('overview-content');
    const studentsContent = document.getElementById('students-content');
    const lessonsContent = document.getElementById('lessons-content');
    const assignmentsContent = document.getElementById('assignments-content');
    const testsContent = document.getElementById('tests-content');
    
    // Xử lý sự kiện chuyển tab
    if (overviewTab) {
        overviewTab.addEventListener('click', function() {
            activateTab(overviewTab);
            showContent(overviewContent);
        });
    }
    
    if (studentsTab) {
        studentsTab.addEventListener('click', function() {
            activateTab(studentsTab);
            showContent(studentsContent);
            // Tải danh sách học sinh nếu cần
            loadStudents();
        });
    }
    
    if (lessonsTab) {
        lessonsTab.addEventListener('click', function() {
            activateTab(lessonsTab);
            showContent(lessonsContent);
            // Tải danh sách bài học nếu cần
            loadLessons();
        });
    }
    
    if (assignmentsTab) {
        assignmentsTab.addEventListener('click', function() {
            activateTab(assignmentsTab);
            showContent(assignmentsContent);
            // Tải danh sách bài tập nếu cần
            loadAssignments();
        });
    }
    
    if (testsTab) {
        testsTab.addEventListener('click', function() {
            activateTab(testsTab);
            showContent(testsContent);
            // Tải danh sách bài kiểm tra nếu cần
            loadTests();
        });
    }
    
    // Thêm event listener cho nút thêm bài học
    const btnAddNewLesson = document.getElementById('btnAddNewLesson');
    if (btnAddNewLesson) {
        btnAddNewLesson.addEventListener('click', openAddLessonModal);
    }
    
    const btnAddLesson = document.getElementById('btnAddLesson');
    if (btnAddLesson) {
        btnAddLesson.addEventListener('click', openAddLessonModal);
    }
    
    // Thêm event listener cho form thêm bài học
    const lessonForm = document.getElementById('lessonForm');
    if (lessonForm) {
        lessonForm.addEventListener('submit', handleLessonSubmit);
    }
    
    // Thêm event listener cho nút đóng modal
    const closeLessonModalBtn = document.getElementById('closeLessonModal');
    if (closeLessonModalBtn) {
        closeLessonModalBtn.addEventListener('click', closeLessonModal);
    }
    
    // Hàm kích hoạt tab
    function activateTab(tab) {
        // Xóa trạng thái active của tất cả các tab
        [overviewTab, studentsTab, lessonsTab, assignmentsTab, testsTab].forEach(t => {
            if (t) {
                t.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
                t.classList.add('text-gray-500');
            }
        });
        
        // Đặt trạng thái active cho tab được chọn
        tab.classList.remove('text-gray-500');
        tab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
    }
    
    // Hàm hiển thị nội dung
    function showContent(content) {
        // Ẩn tất cả các nội dung
        [overviewContent, studentsContent, lessonsContent, assignmentsContent, testsContent].forEach(c => {
            if (c) c.classList.add('hidden');
        });
        
        // Hiển thị nội dung được chọn
        if (content) content.classList.remove('hidden');
    }
    
    // Hàm tải danh sách học sinh
    function loadStudents() {
        if (!studentsContent) return;
        
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;
        
        // Kiểm tra xem đã tải danh sách học sinh chưa
        if (studentsList.dataset.loaded === 'true') return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Hiển thị loading
        studentsList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p class="text-gray-500">Đang tải danh sách học sinh...</p>
                </td>
            </tr>
        `;
        
        // Gọi API để lấy danh sách học sinh
        fetch(`${BASE_API_URL}/classroom-students/${classCode}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dữ liệu học sinh nhận được:', data);
                
                // Kiểm tra cấu trúc dữ liệu và đảm bảo students là một mảng
                let students = [];
                
                // Xử lý cấu trúc dữ liệu mới
                if (data && data.success && data.data && data.data.students) {
                    students = data.data.students;
                    
                    // Lưu thông tin lớp học nếu có
                    if (data.data.classroom) {
                        const classInfo = data.data.classroom;
                        console.log('Thông tin lớp học:', classInfo);
                        
                        // Cập nhật thông tin lớp học trên giao diện nếu cần
                        updateClassInfo(classInfo);
                    }
                } else if (data && data.data && Array.isArray(data.data)) {
                    students = data.data;
                } else if (Array.isArray(data)) {
                    students = data;
                }
                
                // Cập nhật số lượng học sinh trong phần tổng quan
                const totalStudentsElement = document.getElementById('totalStudents');
                if (totalStudentsElement) {
                    totalStudentsElement.textContent = students.length;
                }
                            

                if (!Array.isArray(students) || students.length === 0) {
                    studentsList.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4">
                                <p class="text-gray-500">Chưa có học sinh nào trong lớp</p>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Hiển thị danh sách học sinh
                studentsList.innerHTML = '';
                students.forEach((student, index) => {
                    // Kiểm tra xem student có phải là object hợp lệ không
                    if (!student || typeof student !== 'object') {
                        console.warn('Dữ liệu học sinh không hợp lệ:', student);
                        return;
                    }
                    
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';
                    
                    // Chuyển đổi giới tính từ mã sang chữ
                    let genderText = 'Không xác định';
                    if (student.gender) {
                        if (student.gender === 'male') {
                            genderText = 'Nam';
                        } else if (student.gender === 'female') {
                            genderText = 'Nữ';
                        }
                    }
                    
                    // Sử dụng _id thay vì id vì API trả về _id
                    const studentId = student._id || student.id || `student_${index}`;
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-left">
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                    <i class="fas fa-user text-blue-500"></i>
                                </div>
                                <div class="font-medium">${student.name || 'Học sinh ' + (index + 1)}</div>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-left">${student.email || 'Không có email'}</td>
                        <td class="py-3 px-4 text-left">${student.phone || 'Chưa cập nhật'}</td>
                        <td class="py-3 px-4 text-left">${genderText}</td>
                        <td class="py-3 px-4 text-left">
                            <div class="flex space-x-2">
                                <button class="text-blue-500 hover:text-blue-700" onclick="viewStudentDetails('${studentId}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700" onclick="removeStudent('${studentId}')">
                                    <i class="fas fa-user-minus"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    studentsList.appendChild(row);
                });
                
                // Đánh dấu đã tải
                studentsList.dataset.loaded = 'true';
            })
            .catch(error => {
                console.error('Error loading students:', error);
                studentsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <p class="text-red-500">Có lỗi xảy ra khi tải danh sách học sinh</p>
                        </td>
                    </tr>
                `;
            });
    }
    
    // Hàm tải danh sách bài học
    function loadLessons() {
        const lessonsList = document.getElementById('lessonsList');
        if (!lessonsList) return;
        
        // Kiểm tra xem đã tải danh sách bài học chưa
        if (lessonsList.dataset.loaded === 'true') return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Hiển thị loading
        lessonsList.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách bài học...</p>
            </div>
        `;
        
        // Gọi API để lấy danh sách bài học với endpoint mới
        fetch(`${API_ENDPOINTS.GET_LESSONS}/${classCode}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dữ liệu bài học:', data);
                
                // Kiểm tra cấu trúc dữ liệu trả về
                const lessons = data.success && Array.isArray(data.data) ? data.data : [];
                
                if (lessons.length === 0) {
                    lessonsList.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-gray-500">Chưa có bài học nào</p>
                            <button id="btnAddLesson" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                <i class="fas fa-plus mr-1"></i> Thêm bài học mới
                            </button>
                        </div>
                    `;
                    
                    // Thêm event listener cho nút thêm bài học
                    const btnAddLesson = document.getElementById('btnAddLesson');
                    if (btnAddLesson) {
                        btnAddLesson.addEventListener('click', openAddLessonModal);
                    }
                    
                    return;
                }
                
                // Hiển thị danh sách bài học
                lessonsList.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Danh sách bài học</h3>
                        <a id="btnAddNewLesson" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                            <i class="fas fa-plus mr-1"></i> Thêm bài học
                        </a>
                    </div>
                    <div id="lessonsContainer" class="space-y-3"></div>
                `;
                
                // Thêm event listener cho nút thêm bài học
                const btnAddNewLesson = document.getElementById('btnAddNewLesson');
                if (btnAddNewLesson) {
                    btnAddNewLesson.addEventListener('click', openAddLessonModal);
                }
                
                // Lấy container để thêm các bài học
                const lessonsContainer = document.getElementById('lessonsContainer');
                if (!lessonsContainer) return;
                
                // Hiển thị từng bài học
                lessons.forEach(lesson => {
                    const lessonItem = document.createElement('div');
                    lessonItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
                    
                    // Xác định nếu có file đính kèm
                    const hasAttachment = lesson.fileUrl || lesson.fileName;
                    
                    // Xác định thông tin giáo viên
                    const teacherName = lesson.teacherId && lesson.teacherId.name 
                        ? lesson.teacherId.name 
                        : (lesson.teacherName || 'Không xác định');
                    
                    // Định dạng ngày tạo
                    const createdDate = new Date(lesson.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    // Xác định loại file để hiển thị icon phù hợp
                    let fileIcon = 'fas fa-file-alt';
                    if (lesson.fileType) {
                        if (lesson.fileType.includes('pdf')) {
                            fileIcon = 'fas fa-file-pdf';
                        } else if (lesson.fileType.includes('word')) {
                            fileIcon = 'fas fa-file-word';
                        } else if (lesson.fileType.includes('presentation') || lesson.fileType.includes('powerpoint')) {
                            fileIcon = 'fas fa-file-powerpoint';
                        } else if (lesson.fileType.includes('sheet') || lesson.fileType.includes('excel')) {
                            fileIcon = 'fas fa-file-excel';
                        } else if (lesson.fileType.includes('image')) {
                            fileIcon = 'fas fa-file-image';
                        } else if (lesson.fileType.includes('video')) {
                            fileIcon = 'fas fa-file-video';
                        } else if (lesson.fileType.includes('audio')) {
                            fileIcon = 'fas fa-file-audio';
                        }
                    }
                    
                    // Tạo URL đầy đủ cho file
                    const fileFullUrl = lesson.fileUrl ? `${BASE_API_URL}${lesson.fileUrl}` : '#';
                    
                    lessonItem.innerHTML = `
                        <div class="flex items-start justify-between">
                            <div class="flex items-start">
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                                    <i class="fas fa-book-open text-green-500"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium text-lg">${lesson.title || 'Bài học không có tiêu đề'}</h4>
                                    <div class="flex items-center text-sm text-gray-600 mt-1">
                                        <span class="flex items-center mr-3">
                                            <i class="fas fa-user mr-1"></i> ${teacherName}
                                        </span>
                                        <span class="flex items-center">
                                            <i class="far fa-calendar-alt mr-1"></i> ${createdDate}
                                        </span>
                                    </div>
                                    ${lesson.description ? `<p class="text-sm text-gray-700 mt-2">${lesson.description}</p>` : ''}
                                    ${hasAttachment ? `
                                        <div class="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                                            <a href="${fileFullUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 flex items-center">
                                                <i class="${fileIcon} mr-2 text-lg"></i>
                                                <div>
                                                    <span class="font-medium">${lesson.fileName || 'Tài liệu đính kèm'}</span>
                                                    <span class="text-xs text-gray-500 block">
                                                        ${formatFileSize(lesson.fileSize || 0)}
                                                    </span>
                                                </div>
                                            </a>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="flex space-x-1">
                                <button class="text-blue-500 hover:text-blue-700 p-1" onclick="viewLesson('${lesson._id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="text-blue-500 hover:text-blue-700 p-1" onclick="editLesson('${lesson._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteLesson('${lesson._id}')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    lessonsContainer.appendChild(lessonItem);
                });
                
                // Đánh dấu đã tải
                lessonsList.dataset.loaded = 'true';
            })
            .catch(error => {
                console.error('Error loading lessons:', error);
                lessonsList.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài học</p>
                        <button id="btnRetryLoadLessons" class="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-sync-alt mr-1"></i> Thử lại
                        </button>
                    </div>
                `;
                
                // Thêm event listener cho nút thử lại
                const btnRetryLoadLessons = document.getElementById('btnRetryLoadLessons');
                if (btnRetryLoadLessons) {
                    btnRetryLoadLessons.addEventListener('click', () => {
                        lessonsList.dataset.loaded = 'false';
                        loadLessons();
                    });
                }
            });
    }

    // Hàm định dạng kích thước file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Hàm tải danh sách bài tập
    function loadAssignments() {
        if (!assignmentsContent) return;
        
        const assignmentsList = document.getElementById('assignmentsList');
        if (!assignmentsList) return;
        
        // Kiểm tra xem đã tải danh sách bài tập chưa
        if (assignmentsList.dataset.loaded === 'true') return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Hiển thị loading
        assignmentsList.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách bài tập...</p>
            </div>
        `;
        
        // Gọi API để lấy danh sách bài tập
        fetch(`${BASE_API_URL}/assignments/class/${classCode}`)
            .then(response => response.json())
            .then(data => {
                const assignments = data.data || [];
                
                if (assignments.length === 0) {
                    assignmentsList.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-gray-500">Chưa có bài tập nào</p>
                        </div>
                    `;
                    return;
                }
                
                // Hiển thị danh sách bài tập
                assignmentsList.innerHTML = '';
                assignments.forEach(assignment => {
                    const assignmentItem = document.createElement('div');
                    assignmentItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
                    assignmentItem.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                                    <i class="fas fa-tasks text-yellow-500"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium">${assignment.title || 'Bài tập không có tiêu đề'}</h4>
                                    <p class="text-sm text-gray-600">Hạn nộp: ${new Date(assignment.dueDate || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="text-blue-500 hover:text-blue-700" onclick="editAssignment('${assignment.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700" onclick="deleteAssignment('${assignment.id}')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    assignmentsList.appendChild(assignmentItem);
                });
                
                // Đánh dấu đã tải
                assignmentsList.dataset.loaded = 'true';
            })
            .catch(error => {
                console.error('Error loading assignments:', error);
                assignmentsList.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài tập</p>
                    </div>
                `;
            });
    }
    
    // Hàm tải danh sách bài kiểm tra
    function loadTests() {
        if (!testsContent) return;
        
        const testsList = document.getElementById('testsList');
        if (!testsList) return;
        
        // Kiểm tra xem đã tải danh sách bài kiểm tra chưa
        if (testsList.dataset.loaded === 'true') return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Hiển thị loading
        testsList.innerHTML = `
            <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tải danh sách bài kiểm tra...</p>
            </div>
        `;
        
        // Gọi API để lấy danh sách bài kiểm tra
        fetch(`${BASE_API_URL}/tests/class/${classCode}`)
            .then(response => response.json())
            .then(data => {
                const tests = data.data || [];
                
                if (tests.length === 0) {
                    testsList.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-gray-500">Chưa có bài kiểm tra nào</p>
                        </div>
                    `;
                    return;
                }
                
                // Hiển thị danh sách bài kiểm tra
                testsList.innerHTML = '';
                tests.forEach(test => {
                    const testItem = document.createElement('div');
                    testItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
                    testItem.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                    <i class="fas fa-clipboard-check text-purple-500"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium">${test.title || 'Bài kiểm tra không có tiêu đề'}</h4>
                                    <p class="text-sm text-gray-600">Thời gian: ${test.duration || 45} phút</p>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="text-blue-500 hover:text-blue-700" onclick="editTest('${test.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700" onclick="deleteTest('${test.id}')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    testsList.appendChild(testItem);
                });
                
                // Đánh dấu đã tải
                testsList.dataset.loaded = 'true';
            })
            .catch(error => {
                console.error('Error loading tests:', error);
                testsList.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài kiểm tra</p>
                    </div>
                `;
            });
    }
    
    // Lấy mã lớp từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentClassCode = urlParams.get('code');
    
    if (!currentClassCode) {
        window.location.href = './classes_list.html';
        return;
    }
    
    console.log('Đang tải thông tin lớp học với mã:', currentClassCode);
    
    // Tải thông tin lớp học
    fetchClassInfo();
    
    // Lấy thông tin lớp học từ API hoặc localStorage
    async function fetchClassInfo() {
        try {
            console.log('Đang lấy thông tin lớp học với mã:', currentClassCode);
            
            // Thử lấy thông tin từ localStorage trước
            const cachedClass = localStorage.getItem(`class_${currentClassCode}`);
            if (cachedClass) {
                const classData = JSON.parse(cachedClass);
                console.log('Lấy thông tin lớp học từ cache:', classData);
                displayClassInfo(classData);
                return classData;
            }
            
            // Nếu không có trong cache, lấy từ API theo code
            try {
                const response = await fetch(`${API_ENDPOINTS.GET_CLASS}/code/${currentClassCode}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Dữ liệu lớp học từ API:', data);
                    
                    // Lấy dữ liệu lớp học từ response
                    const classData = data.data || data;
                    
                    // Lưu vào localStorage để sử dụng sau này
                    localStorage.setItem(`class_${currentClassCode}`, JSON.stringify(classData));
                    
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
            const sampleClassData = getSampleClassData(currentClassCode);
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
        if (classCodeElement) classCodeElement.textContent = classData.classCode || currentClassCode;
        
        // Cập nhật màu sắc và biểu tượng dựa trên môn học
        updateClassStyle(classData);
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
                className: 'Lớp học mẫu',
                subject: 'Chưa xác định',
                teacherName: 'Giáo viên mẫu'
            };
        }
        
        return foundClass;
    }

    // Hàm xem chi tiết học sinh
    function viewStudentDetails(studentId) {
        if (!studentId) return;
        
        // Hiển thị modal chi tiết học sinh
        const modal = document.getElementById('studentDetailsModal');
        if (!modal) return;
        
        // Hiển thị loading
        const modalContent = document.getElementById('studentDetailsContent');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p class="text-gray-500">Đang tải thông tin học sinh...</p>
                </div>
            `;
        }
        
        // Hiển thị modal
        modal.classList.remove('hidden');
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Gọi API để lấy thông tin chi tiết học sinh
        fetch(`${BASE_API_URL}/students/${studentId}?classCode=${classCode}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dữ liệu chi tiết học sinh:', data);
                
                // Xử lý cấu trúc dữ liệu
                let student = null;
                
                if (data && data.success && data.data) {
                    student = data.data;
                } else if (data && data._id) {
                    student = data;
                }
                
                if (!student) {
                    if (modalContent) {
                        modalContent.innerHTML = `
                            <div class="text-center py-4">
                                <p class="text-red-500">Không tìm thấy thông tin học sinh</p>
                            </div>
                        `;
                    }
                    return;
                }
                
                // Chuyển đổi giới tính từ mã sang chữ
                let genderText = 'Không xác định';
                if (student.gender) {
                    if (student.gender === 'male') {
                        genderText = 'Nam';
                    } else if (student.gender === 'female') {
                        genderText = 'Nữ';
                    }
                }
                
                // Hiển thị thông tin chi tiết học sinh
                if (modalContent) {
                    modalContent.innerHTML = `
                        <div class="bg-white p-6 rounded-lg">
                            <div class="flex items-center mb-4">
                                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                    <i class="fas fa-user text-blue-500 text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold">${student.name || 'Không có tên'}</h3>
                                    <p class="text-gray-600">${student.email || 'Không có email'}</p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p class="text-sm text-gray-500">Mã học sinh</p>
                                    <p class="font-medium">${student.studentId || student._id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Ngày sinh</p>
                                    <p class="font-medium">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Giới tính</p>
                                    <p class="font-medium">${genderText}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Số điện thoại</p>
                                    <p class="font-medium">${student.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h4 class="font-medium mb-2">Thông tin liên hệ</h4>
                                <div>
                                    <p class="text-sm text-gray-500">Địa chỉ</p>
                                    <p class="font-medium">${student.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-2">
                                <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onclick="closeStudentDetailsModal()">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading student details:', error);
                if (modalContent) {
                    modalContent.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-red-500">Có lỗi xảy ra khi tải thông tin học sinh</p>
                        </div>
                    `;
                }
            });
    }

    // Hàm đóng modal chi tiết học sinh
    function closeStudentDetailsModal() {
        const modal = document.getElementById('studentDetailsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Hàm xóa học sinh khỏi lớp
    function removeStudent(studentId) {
        if (!studentId || !confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Gọi API để xóa học sinh khỏi lớp
        fetch(`${BASE_API_URL}/remove-student-from-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                classCode: classCode,
                studentId: studentId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Kết quả xóa học sinh:', data);
            
            if (data && data.success) {
                alert('Đã xóa học sinh khỏi lớp thành công!');
                
                // Tải lại danh sách học sinh
                const studentsList = document.getElementById('studentsList');
                if (studentsList) {
                    studentsList.dataset.loaded = 'false';
                    loadStudents();
                }
            } else {
                alert('Có lỗi xảy ra khi xóa học sinh khỏi lớp: ' + (data.message || 'Không rõ lỗi'));
            }
        })
        .catch(error => {
            console.error('Error removing student:', error);
            alert('Có lỗi xảy ra khi xóa học sinh khỏi lớp');
        });
    }

    // Hàm cập nhật thông tin lớp học
    function updateClassInfo(classInfo) {
        // Cập nhật tên lớp
        const classNameElement = document.getElementById('className');
        if (classNameElement && classInfo.className) {
            classNameElement.textContent = classInfo.className;
        }
        
        // Cập nhật tên giáo viên
        const teacherNameElement = document.getElementById('teacherName');
        if (teacherNameElement && classInfo.teacherName) {
            teacherNameElement.textContent = classInfo.teacherName;
        }
        
        // Cập nhật mã lớp
        const classCodeElement = document.getElementById('classCode');
        if (classCodeElement && classInfo.classCode) {
            classCodeElement.textContent = classInfo.classCode;
        }
        
        // Cập nhật icon môn học
        const classIconTypeElement = document.getElementById('classIconType');
        if (classIconTypeElement && classInfo.subject) {
            // Xác định icon dựa trên môn học
            let iconClass = 'fas fa-book';
            
            if (classInfo.subject.toLowerCase().includes('toán')) {
                iconClass = 'fas fa-calculator';
            } else if (classInfo.subject.toLowerCase().includes('anh') || 
                      classInfo.subject.toLowerCase().includes('english')) {
                iconClass = 'fas fa-language';
            } else if (classInfo.subject.toLowerCase().includes('văn') || 
                      classInfo.subject.toLowerCase().includes('ngữ')) {
                iconClass = 'fas fa-feather-alt';
            } else if (classInfo.subject.toLowerCase().includes('sử') || 
                      classInfo.subject.toLowerCase().includes('history')) {
                iconClass = 'fas fa-landmark';
            } else if (classInfo.subject.toLowerCase().includes('địa') || 
                      classInfo.subject.toLowerCase().includes('geo')) {
                iconClass = 'fas fa-globe-asia';
            } else if (classInfo.subject.toLowerCase().includes('lý') || 
                      classInfo.subject.toLowerCase().includes('physics')) {
                iconClass = 'fas fa-atom';
            } else if (classInfo.subject.toLowerCase().includes('hóa') || 
                      classInfo.subject.toLowerCase().includes('chemistry')) {
                iconClass = 'fas fa-flask';
            } else if (classInfo.subject.toLowerCase().includes('sinh') || 
                      classInfo.subject.toLowerCase().includes('biology')) {
                iconClass = 'fas fa-dna';
            }
            
            classIconTypeElement.className = iconClass;
        }
    }

    // Hàm mở modal thêm bài học
    function openAddLessonModal() {
        const modal = document.getElementById('addLessonModal');
        if (!modal) {
            // Nếu modal chưa tồn tại, tạo mới và thêm vào DOM
            createAddLessonModal();
        } else {
            // Reset form
            const lessonForm = document.getElementById('lessonForm');
            if (lessonForm) lessonForm.reset();
            
            // Hiển thị modal
            modal.classList.remove('hidden');
        }
    }

    // Hàm tạo modal thêm bài học
    function createAddLessonModal() {
        // Tạo element cho modal
        const modal = document.createElement('div');
        modal.id = 'addLessonModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        const teacherEmail = localStorage.getItem('userEmail');
        
        // Tạo nội dung modal
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
                <div class="flex justify-between items-center border-b px-6 py-4">
                    <h3 class="text-xl font-semibold text-gray-800">Thêm bài học mới</h3>
                    <a id="closeLessonModal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </a>
                </div>
                
                <form id="lessonForm" class="px-6 py-4">
                    <div class="mb-4">
                        <label for="lessonTitle" class="block text-gray-700 font-medium mb-2">Tiêu đề bài học <span class="text-red-500">*</span></label>
                        <input type="text" id="lessonTitle" name="title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="lessonDescription" class="block text-gray-700 font-medium mb-2">Mô tả bài học</label>
                        <textarea id="lessonDescription" name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label for="lessonFile" class="block text-gray-700 font-medium mb-2">Tài liệu bài học</label>
                        <input type="file" id="lessonFile" name="lessonFile" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-sm text-gray-500 mt-1">Chỉ hỗ trợ định dạng PDF (tối đa 50MB)</p>
                    </div>
                    
                    <input type="hidden" id="lessonClassCode" name="classCode" value="${classCode || ''}">
                    <input type="hidden" id="lessonTeacherEmail" name="teacherEmail" value="${teacherEmail || ''}">
                    
                    <div class="flex justify-end border-t pt-4 mt-4">                   
                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-save mr-1"></i> Lưu bài học
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Thêm modal vào body
        document.body.appendChild(modal);
        
        // Thêm event listener cho nút đóng modal
        const closeLessonModalBtn = document.getElementById('closeLessonModal');
        if (closeLessonModalBtn) {
            closeLessonModalBtn.addEventListener('click', closeLessonModal);
        }
        
        // Thêm event listener cho form
        const lessonForm = document.getElementById('lessonForm');
        if (lessonForm) {
            lessonForm.addEventListener('submit', handleLessonSubmit);
        }
    }

    // Hàm đóng modal thêm bài học
    function closeLessonModal() {
        const modal = document.getElementById('addLessonModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Hàm xử lý submit form thêm bài học
    async function handleLessonSubmit(event) {
        event.preventDefault();
        
        // Lấy dữ liệu từ form
        const title = document.getElementById('lessonTitle').value.trim();
        const description = document.getElementById('lessonDescription').value.trim();
        const classCode = document.getElementById('lessonClassCode').value.trim();
        const teacherEmail = document.getElementById('lessonTeacherEmail').value.trim();
        const fileInput = document.getElementById('lessonFile');
        
        // Kiểm tra dữ liệu
        if (!title) {
            alert('Vui lòng nhập tiêu đề bài học');
            return;
        }
        
        if (!classCode) {
            alert('Không tìm thấy mã lớp học');
            return;
        }
        
        if (!teacherEmail) {
            alert('Không tìm thấy thông tin giáo viên');
            return;
        }
        
        // Hiển thị loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Đang tải lên...`;
        
        try {
            // Tạo FormData để gửi dữ liệu và file
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('classCode', classCode);
            formData.append('teacherEmail', teacherEmail);
            
            // Thêm file nếu có
            if (fileInput.files.length > 0) {
                formData.append('lessonFile', fileInput.files[0]);
            }
            
            // Gọi API để tạo bài học
            const response = await fetch(API_ENDPOINTS.CREATE_LESSON, {
                method: 'POST',
                body: formData
            });
            
            // Xử lý kết quả
            const result = await response.json();
            
            if (result.success) {
                alert('Tải lên bài học thành công!');
                closeLessonModal();
                
                // Tải lại danh sách bài học
                const lessonsList = document.getElementById('lessonsList');
                if (lessonsList) {
                    lessonsList.dataset.loaded = 'false';
                    loadLessons();
                }
            } else {
                alert(`Lỗi: ${result.message || 'Không thể tải lên bài học'}`);
            }
        } catch (error) {
            console.error('Error creating lesson:', error);
            alert('Có lỗi xảy ra khi tải lên bài học');
        } finally {
            // Khôi phục trạng thái nút submit
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    // Hàm xem chi tiết bài học
    function viewLesson(lessonId) {
        if (!lessonId) return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Chuyển hướng đến trang chi tiết bài học
        window.location.href = `./lesson_detail.html?id=${lessonId}&class=${classCode}`;
    }

    // Hàm chỉnh sửa bài học
    function editLesson(lessonId) {
        if (!lessonId) return;
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Hiển thị loading
        showToast('Đang tải thông tin bài học...', 'info');
        
        // Gọi API để lấy thông tin chi tiết bài học
        fetch(`${BASE_API_URL}/lessons/${lessonId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    const lesson = data.data;
                    
                    // Mở modal chỉnh sửa bài học
                    openEditLessonModal(lesson);
                } else {
                    showToast('Không thể tải thông tin bài học', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading lesson details:', error);
                showToast('Có lỗi xảy ra khi tải thông tin bài học', 'error');
            });
    }

    // Hàm xóa bài học
    function deleteLesson(lessonId) {
        if (!lessonId || !confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
        
        // Hiển thị loading
        const lessonElement = document.querySelector(`[onclick="deleteLesson('${lessonId}')"]`).closest('.bg-white');
        if (lessonElement) {
            lessonElement.classList.add('opacity-50');
        }
        
        // Gọi API để xóa bài học
        fetch(`${API_ENDPOINTS.DELETE_LESSON}/${lessonId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hiển thị thông báo thành công
                showToast('Xóa bài học thành công!', 'success');
                
                // Xóa phần tử khỏi DOM
                if (lessonElement) {
                    lessonElement.remove();
                }
                
                // Hoặc tải lại danh sách bài học
                const lessonsList = document.getElementById('lessonsList');
                if (lessonsList) {
                    lessonsList.dataset.loaded = 'false';
                    loadLessons();
                }
            } else {
                // Hiển thị thông báo lỗi
                showToast(`Lỗi: ${data.message || 'Không thể xóa bài học'}`, 'error');
                
                // Khôi phục trạng thái phần tử
                if (lessonElement) {
                    lessonElement.classList.remove('opacity-50');
                }
            }
        })
        .catch(error => {
            console.error('Error deleting lesson:', error);
            showToast('Có lỗi xảy ra khi xóa bài học', 'error');
            
            // Khôi phục trạng thái phần tử
            if (lessonElement) {
                lessonElement.classList.remove('opacity-50');
            }
        });
    }

    // Hàm hiển thị thông báo
    function showToast(message, type = 'success') {
        // Kiểm tra xem đã có toast container chưa
        let toastContainer = document.getElementById('toastContainer');
        
        if (!toastContainer) {
            // Tạo toast container nếu chưa có
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'fixed bottom-4 right-4 z-50';
            document.body.appendChild(toastContainer);
        }
        
        // Tạo toast
        const toast = document.createElement('div');
        toast.className = `flex items-center p-4 mb-3 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        
        // Thêm nội dung cho toast
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
            <span>${message}</span>
            <button class="ml-auto text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Thêm toast vào container
        toastContainer.appendChild(toast);
        
        // Thêm event listener cho nút đóng
        const closeBtn = toast.querySelector('button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });
        }
        
        // Tự động đóng toast sau 3 giây
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});















