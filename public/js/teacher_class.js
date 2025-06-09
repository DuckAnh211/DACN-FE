document.addEventListener('DOMContentLoaded', function() {   
    // Định nghĩa hàm deleteLesson
    window.deleteLesson = function(lessonId) {
        if (!lessonId || !confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
        
        console.log('Đang xóa bài học với ID:', lessonId);
        
        // Hiển thị loading
        const lessonElement = document.querySelector(`div[data-lesson-id="${lessonId}"]`) || 
                              document.querySelector(`.lesson-item-${lessonId}`);
        
        if (lessonElement) {
            lessonElement.classList.add('opacity-50');
        }
        
        // Sử dụng endpoint DELETE_LESSON đã được định nghĩa
        fetch(`${window.API_ENDPOINTS.DELETE_LESSON}/${lessonId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Kết quả xóa bài học:', data);
            
            if (data.success) {
                // Hiển thị thông báo thành công
                showToast('Xóa bài học thành công!', 'success');
                
                // Xóa phần tử khỏi DOM
                if (lessonElement) {
                    lessonElement.remove();
                }
                
                // Tải lại danh sách bài học
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
    };
    
    // Hàm hiển thị thông báo toast
    window.showToast = function(message, type = 'info') {
        // Kiểm tra xem đã có container toast chưa
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(toastContainer);
        }
        
        // Tạo toast mới
        const toast = document.createElement('div');
        
        // Xác định màu sắc dựa trên loại thông báo
        let bgColor = 'bg-blue-500';
        let icon = 'fas fa-info-circle';
        
        if (type === 'success') {
            bgColor = 'bg-green-500';
            icon = 'fas fa-check-circle';
        } else if (type === 'error') {
            bgColor = 'bg-red-500';
            icon = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            bgColor = 'bg-yellow-500';
            icon = 'fas fa-exclamation-triangle';
        }
        
        toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-xs`;
        toast.innerHTML = `
            <i class="${icon} mr-2"></i>
            <span>${message}</span>
        `;
        
        // Thêm toast vào container
        toastContainer.appendChild(toast);
        
        // Tự động xóa toast sau 3 giây
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
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
        if (!lessonsContent) return;
        
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
                console.log('Dữ liệu bài học nhận được:', data);
                
                // Kiểm tra cấu trúc dữ liệu và đảm bảo lessons là một mảng
                let lessons = [];
                
                // Xử lý cấu trúc dữ liệu mới
                if (data && data.success && data.data) {
                    lessons = data.data;
                } else if (Array.isArray(data)) {
                    lessons = data;
                }
                
                // Cập nhật số lượng bài học trong phần tổng quan
                const totalLessonsElement = document.getElementById('totalLessons');
                if (totalLessonsElement) {
                    totalLessonsElement.textContent = lessons.length;
                }
                
                // Đánh dấu đã tải danh sách bài học
                lessonsList.dataset.loaded = 'true';
                
                if (!Array.isArray(lessons) || lessons.length === 0) {
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
                                <button class="text-blue-500 hover:text-blue-700 p-1" onclick="editLesson('${lesson._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteLesson('${lesson._id}')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    lessonsList.appendChild(lessonItem);
                });
                
                // Đánh dấu đã tải
                lessonsList.dataset.loaded = 'true';
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách bài học:', error);
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
        fetch(`${API_ENDPOINTS.GET_ASSIGNMENTS}/${classCode}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dữ liệu bài tập nhận được:', data);
                
                const assignments = data.data || [];
                
                // Cập nhật số lượng bài tập trong phần tổng quan
                const totalAssignmentsElement = document.getElementById('totalAssignments');
                if (totalAssignmentsElement) {
                    totalAssignmentsElement.textContent = assignments.length;
                }
                
                if (assignments.length === 0) {
                    assignmentsList.innerHTML = `
                        <div class="text-center py-8">
                            <i class="fas fa-tasks text-gray-300 text-5xl mb-4"></i>
                            <p class="text-gray-500">Chưa có bài tập nào trong lớp học này</p>
                            <button id="btnAddFirstAssignment" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-plus-circle mr-1"></i> Tạo bài tập 
                            </button>
                        </div>
                    `;
                    
                    // Thêm event listener cho nút tạo bài tập 
                    const btnAddFirstAssignment = document.getElementById('btnAddFirstAssignment');
                    if (btnAddFirstAssignment) {
                        btnAddFirstAssignment.addEventListener('click', openCreateAssignmentModal);
                    }
                    
                    // Đánh dấu đã tải
                    assignmentsList.dataset.loaded = 'true';
                    return;
                }
                
                // Hiển thị danh sách bài tập
                assignmentsList.innerHTML = '';
                assignments.forEach(assignment => {
                    const assignmentItem = document.createElement('div');
                    assignmentItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-4';
                    assignmentItem.dataset.assignmentId = assignment._id || assignment.id;
                    
                    // Định dạng ngày hạn nộp
                    const dueDate = new Date(assignment.dueDate);
                    const formattedDueDate = dueDate.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    assignmentItem.innerHTML = `
                        <div class="flex flex-col">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start">
                                    <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-1">
                                        <i class="fas fa-clipboard-list text-amber-500"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-gray-800">${assignment.title || 'Bài tập không có tiêu đề'}</h3>
                                        <div class="flex flex-wrap items-center text-sm text-gray-600 mt-1">
                                            <span class="flex items-center mr-3 mb-1">
                                                <i class="far fa-calendar-alt mr-1 text-amber-500"></i> Hạn nộp: ${formattedDueDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex space-x-1">
                                    <button class="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-full transition-colors" 
                                            title="Chỉnh sửa bài tập" onclick="editAssignment('${assignment._id || assignment.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors" 
                                            title="Xóa bài tập" onclick="deleteAssignment('${assignment._id || assignment.id}')">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            
                            ${assignment.description ? `
                                <div class="mt-3 pl-13">
                                    <p class="text-gray-700">${assignment.description}</p>
                                </div>
                            ` : ''}
                            
                            ${assignment.fileUrl ? `
                                <div class="mt-3 pl-13">
                                    <a href="${assignment.fileUrl}" target="_blank" 
                                       class="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                        <i class="fas fa-file-download text-blue-500 mr-2"></i>
                                        <div>
                                            <span class="font-medium text-blue-600">${assignment.fileName || 'Tài liệu đính kèm'}</span>
                                            ${assignment.fileSize ? `
                                                <span class="text-xs text-gray-500 block">
                                                    ${formatFileSize(assignment.fileSize)}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </a>
                                </div>
                            ` : ''}
                            
                            <div class="mt-3 pl-13 flex justify-between items-center">
                                <div class="text-xs text-gray-500">
                                    <span><i class="fas fa-user-edit mr-1"></i>Tạo bởi: ${assignment.teacherId?.name || 'Giáo viên'}</span>
                                </div>
                                <div class="flex space-x-2">
                                    ${assignment.submissionCount ? `
                                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            <i class="fas fa-paper-plane mr-1"></i>${assignment.submissionCount} bài nộp
                                        </span>
                                    ` : ''}
                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        <i class="fas fa-eye mr-1"></i>${assignment.viewCount || 0} lượt xem
                                    </span>
                                </div>
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
                        <button id="btnRetryLoadAssignments" class="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-sync-alt mr-1"></i> Thử lại
                        </button>
                    </div>
                `;
                
                // Thêm event listener cho nút thử lại
                const btnRetryLoadAssignments = document.getElementById('btnRetryLoadAssignments');
                if (btnRetryLoadAssignments) {
                    btnRetryLoadAssignments.addEventListener('click', () => {
                        assignmentsList.dataset.loaded = 'false';
                        loadAssignments();
                    });
                }
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
    
    // Lấy thông tin lớp học từ localStorage hoặc dữ liệu mẫu
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
            
            // Nếu không có trong cache, sử dụng dữ liệu mẫu ngay lập tức
            console.log('Không tìm thấy thông tin lớp học trong cache, sử dụng dữ liệu mẫu');
            const sampleClassData = getSampleClassData(currentClassCode);
            displayClassInfo(sampleClassData);
            
            return sampleClassData;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin lớp học:', error);
            
            // Tạo dữ liệu mẫu nếu có lỗi
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
        if (!lessonId) {
            console.error('Không có ID bài học');
            return;
        }
        
        console.log('Đang chỉnh sửa bài học với ID:', lessonId);
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) {
            console.error('Không tìm thấy mã lớp trong URL');
            showToast('Không tìm thấy mã lớp học', 'error');
            return;
        }
        
        // Hiển thị loading
        showToast('Đang tải thông tin bài học...', 'info');
        
        // Gọi API để lấy thông tin chi tiết bài học
        fetch(`${API_ENDPOINTS.GET_LESSONS}/${lessonId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dữ liệu bài học nhận được:', data);
                
                if (data && data.success && data.data) {
                    const lesson = data.data;
                    
                    // Mở modal chỉnh sửa bài học
                    openEditLessonModal(lesson);
                } else {
                    console.error('Không thể tải thông tin bài học:', data);
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
        const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (lessonElement) {
            lessonElement.classList.add('opacity-50');
        }
        
        // Gọi API để xóa bài học
        fetch(`${BASE_API_URL}/lessons/${lessonId}`, {
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
                
                // Cập nhật số lượng bài học
                updateLessonCount();
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

    // Hàm cập nhật số lượng bài học
    function updateLessonCount() {
        const totalLessonsElement = document.getElementById('totalLessons');
        if (totalLessonsElement) {
            const currentCount = parseInt(totalLessonsElement.textContent) || 0;
            if (currentCount > 0) {
                totalLessonsElement.textContent = currentCount - 1;
            }
        }
    }

    // Hàm hiển thị thông báo toast
    function showToast(message, type = 'info') {
        // Kiểm tra xem đã có container toast chưa
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(toastContainer);
        }
        
        // Tạo toast mới
        const toast = document.createElement('div');
        
        // Xác định màu sắc dựa trên loại thông báo
        let bgColor = 'bg-blue-500';
        let icon = 'fas fa-info-circle';
        
        if (type === 'success') {
            bgColor = 'bg-green-500';
            icon = 'fas fa-check-circle';
        } else if (type === 'error') {
            bgColor = 'bg-red-500';
            icon = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            bgColor = 'bg-yellow-500';
            icon = 'fas fa-exclamation-triangle';
        }
        
        toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-xs`;
        toast.innerHTML = `
            <i class="${icon} mr-2"></i>
            <span>${message}</span>
        `;
        
        // Thêm toast vào container
        toastContainer.appendChild(toast);
        
        // Tự động xóa toast sau 3 giây
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Hàm mở modal chỉnh sửa bài học
    function openEditLessonModal(lesson) {
        const modal = document.getElementById('editLessonModal');
        if (!modal) {
            // Nếu modal chưa tồn tại, tạo mới và thêm vào DOM
            createEditLessonModal(lesson);
        } else {
            // Điền thông tin bài học vào form
            fillEditLessonForm(lesson);
            
            // Hiển thị modal
            modal.classList.remove('hidden');
        }
    }

    // Hàm tạo modal chỉnh sửa bài học
    function createEditLessonModal(lesson) {
        // Tạo element cho modal
        const modal = document.createElement('div');
        modal.id = 'editLessonModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        const teacherEmail = localStorage.getItem('userEmail');
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="flex justify-between items-center border-b px-6 py-4">
                    <h3 class="text-lg font-medium text-gray-900">Chỉnh sửa bài học</h3>
                </div>
                
                <form id="editLessonForm" class="px-6 py-4">
                    <div class="mb-4">
                        <label for="editLessonTitle" class="block text-gray-700 font-medium mb-2">Tiêu đề bài học <span class="text-red-500">*</span></label>
                        <input type="text" id="editLessonTitle" name="title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="editLessonDescription" class="block text-gray-700 font-medium mb-2">Mô tả bài học</label>
                        <textarea id="editLessonDescription" name="description" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label for="editLessonFile" class="block text-gray-700 font-medium mb-2">Tài liệu đính kèm</label>
                        <input type="file" id="editLessonFile" name="lessonFile" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <div id="currentFileInfo" class="mt-2 text-sm text-gray-600"></div>
                    </div>
                    
                    <input type="hidden" id="editLessonId" name="lessonId" value="">
                    <input type="hidden" id="editLessonClassCode" name="classCode" value="${classCode || ''}">
                    <input type="hidden" id="editLessonTeacherEmail" name="teacherEmail" value="${teacherEmail || ''}">
                    
                    <div class="flex justify-end border-t pt-4 mt-4">
                        <button type="button" id="cancelEditLessonBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2">
                            Hủy bỏ
                        </button>
                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-save mr-1"></i> Cập nhật bài học
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Thêm modal vào body
        document.body.appendChild(modal);
        
        // Thêm event listener cho nút đóng modal
        const closeEditLessonModalBtn = document.getElementById('closeEditLessonModal');
        const cancelEditLessonBtn = document.getElementById('cancelEditLessonBtn');
        
        if (closeEditLessonModalBtn) {
            closeEditLessonModalBtn.addEventListener('click', closeEditLessonModal);
        }
        
        if (cancelEditLessonBtn) {
            cancelEditLessonBtn.addEventListener('click', closeEditLessonModal);
        }
        
        // Thêm event listener cho form
        const editLessonForm = document.getElementById('editLessonForm');
        if (editLessonForm) {
            editLessonForm.addEventListener('submit', handleEditLessonSubmit);
        }
        
        // Điền thông tin bài học vào form
        fillEditLessonForm(lesson);
    }

    // Hàm điền thông tin bài học vào form chỉnh sửa
    function fillEditLessonForm(lesson) {
        if (!lesson) return;
        
        const editLessonTitleInput = document.getElementById('editLessonTitle');
        const editLessonDescriptionInput = document.getElementById('editLessonDescription');
        const editLessonIdInput = document.getElementById('editLessonId');
        const currentFileInfo = document.getElementById('currentFileInfo');
        
        if (editLessonTitleInput) editLessonTitleInput.value = lesson.title || '';
        if (editLessonDescriptionInput) editLessonDescriptionInput.value = lesson.description || '';
        if (editLessonIdInput) editLessonIdInput.value = lesson._id || '';
        
        // Hiển thị thông tin file hiện tại nếu có
        if (currentFileInfo && lesson.fileName) {
            const fileIcon = getFileIconClass(lesson.fileType || lesson.fileName);
            const fileSize = formatFileSize(lesson.fileSize || 0);
            
            currentFileInfo.innerHTML = `
                <div class="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                    <i class="${fileIcon} mr-2 text-lg text-gray-500"></i>
                    <div>
                        <span class="font-medium">${lesson.fileName}</span>
                        <span class="text-xs text-gray-500 block">${fileSize}</span>
                    </div>
                </div>
                <p class="mt-1 text-xs text-gray-500">Tải lên file mới để thay thế file hiện tại, hoặc để trống để giữ nguyên.</p>
            `;
        } else if (currentFileInfo) {
            currentFileInfo.innerHTML = '<p class="text-xs text-gray-500">Chưa có file đính kèm</p>';
        }
    }

    // Hàm đóng modal chỉnh sửa bài học
    function closeEditLessonModal() {
        const modal = document.getElementById('editLessonModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Hàm xử lý submit form chỉnh sửa bài học
    async function handleEditLessonSubmit(event) {
        event.preventDefault();
        
        // Lấy dữ liệu từ form
        const lessonId = document.getElementById('editLessonId').value.trim();
        const title = document.getElementById('editLessonTitle').value.trim();
        const description = document.getElementById('editLessonDescription').value.trim();
        const teacherEmail = document.getElementById('editLessonTeacherEmail').value.trim();
        const fileInput = document.getElementById('editLessonFile');
        
        // Kiểm tra dữ liệu
        if (!lessonId) {
            showToast('Không tìm thấy ID bài học', 'error');
            return;
        }
        
        if (!title) {
            showToast('Vui lòng nhập tiêu đề bài học', 'error');
            return;
        }
        
        if (!teacherEmail) {
            showToast('Không tìm thấy thông tin giáo viên', 'error');
            return;
        }
        
        // Hiển thị loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Đang cập nhật...`;
        
        try {
            // Tạo FormData để gửi dữ liệu và file
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('teacherEmail', teacherEmail);
            
            // Thêm file nếu có
            if (fileInput.files.length > 0) {
                formData.append('lessonFile', fileInput.files[0]);
            }
            
            // Gọi API để cập nhật bài học
            const response = await fetch(`${API_ENDPOINTS.DELETE_LESSON}/${lessonId}`, {
                method: 'PUT',
                body: formData
            });
            
            // Xử lý kết quả
            const result = await response.json();
            
            if (result.success) {
                showToast('Cập nhật bài học thành công!', 'success');
                closeEditLessonModal();
                
                // Tải lại danh sách bài học
                const lessonsList = document.getElementById('lessonsList');
                if (lessonsList) {
                    lessonsList.dataset.loaded = 'false';
                    loadLessons();
                }
            } else {
                showToast(`Lỗi: ${result.message || 'Không thể cập nhật bài học'}`, 'error');
            }
        } catch (error) {
            console.error('Error updating lesson:', error);
            showToast('Có lỗi xảy ra khi cập nhật bài học', 'error');
        } finally {
            // Khôi phục trạng thái nút submit
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    // Hàm lấy class biểu tượng dựa trên loại file
    function getFileIconClass(fileType) {
        if (!fileType) return 'fas fa-file';
        
        const fileTypeLower = fileType.toLowerCase();
        
        if (fileTypeLower.includes('pdf')) {
            return 'fas fa-file-pdf';
        } else if (fileTypeLower.includes('word') || fileTypeLower.includes('doc')) {
            return 'fas fa-file-word';
        } else if (fileTypeLower.includes('excel') || fileTypeLower.includes('sheet') || fileTypeLower.includes('xls')) {
            return 'fas fa-file-excel';
        } else if (fileTypeLower.includes('powerpoint') || fileTypeLower.includes('presentation') || fileTypeLower.includes('ppt')) {
            return 'fas fa-file-powerpoint';
        } else if (fileTypeLower.includes('image') || fileTypeLower.includes('jpg') || fileTypeLower.includes('png') || fileTypeLower.includes('jpeg')) {
            return 'fas fa-file-image';
        } else if (fileTypeLower.includes('video')) {
            return 'fas fa-file-video';
        } else if (fileTypeLower.includes('audio')) {
            return 'fas fa-file-audio';
        } else if (fileTypeLower.includes('zip') || fileTypeLower.includes('rar') || fileTypeLower.includes('archive')) {
            return 'fas fa-file-archive';
        } else if (fileTypeLower.includes('code') || fileTypeLower.includes('html') || fileTypeLower.includes('css') || fileTypeLower.includes('js')) {
            return 'fas fa-file-code';
        } else if (fileTypeLower.includes('text')) {
            return 'fas fa-file-alt';
        } else {
            return 'fas fa-file';
        }
    }
});

// Đặt hàm deleteLesson vào window object để có thể gọi từ bất kỳ đâu
window.deleteLesson = function(lessonId) {
    if (!lessonId || !confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
    
    console.log('Đang xóa bài học với ID:', lessonId);
    
    // Hiển thị loading
    const lessonElement = document.querySelector(`div[data-lesson-id="${lessonId}"]`) || 
                          document.querySelector(`.lesson-item-${lessonId}`);
    
    if (lessonElement) {
        lessonElement.classList.add('opacity-50');
    }
    
    // Sử dụng endpoint DELETE_LESSON đã được định nghĩa
    // API_ENDPOINTS.DELETE_LESSON là "${BASE_API_URL}/lessons"
    // Nên cần thêm ID vào cuối URL
    fetch(`${API_ENDPOINTS.DELETE_LESSON}/${lessonId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Kết quả xóa bài học:', data);
        
        if (data.success) {
            // Hiển thị thông báo thành công
            showToast('Xóa bài học thành công!', 'success');
            
            // Xóa phần tử khỏi DOM
            if (lessonElement) {
                lessonElement.remove();
            }
            
            // Tải lại danh sách bài học
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
};

// Thêm hàm showToast nếu chưa có
window.showToast = function(message, type = 'info') {
    // Kiểm tra xem đã có container toast chưa
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    // Tạo toast mới
    const toast = document.createElement('div');
    
    // Xác định màu sắc dựa trên loại thông báo
    let bgColor = 'bg-blue-500';
    let icon = 'fas fa-info-circle';
    
    if (type === 'success') {
        bgColor = 'bg-green-500';
        icon = 'fas fa-check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-red-500';
        icon = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-500';
        icon = 'fas fa-exclamation-triangle';
    }
    
    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-xs`;
    toast.innerHTML = `
        <i class="${icon} mr-2"></i>
        <span>${message}</span>
    `;
    
    // Thêm toast vào container
    toastContainer.appendChild(toast);
    
    // Tự động xóa toast sau 3 giây
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
};

// Hàm định dạng kích thước file
window.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Hàm định dạng ngày tháng
window.formatDate = function(dateString) {
    if (!dateString) return 'Không có ngày';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Đảm bảo tất cả các hàm cần thiết đều được đăng ký vào window object
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM đã sẵn sàng, đăng ký các hàm vào window object');
    
    // Đăng ký các hàm vào window object
    window.deleteLesson = deleteLesson;
    window.showToast = showToast;
    window.formatFileSize = formatFileSize;
    window.formatDate = formatDate;
    
    // Kiểm tra xem có nút xóa bài học nào không
    const deleteButtons = document.querySelectorAll('button[onclick*="deleteLesson"]');
    console.log(`Tìm thấy ${deleteButtons.length} nút xóa bài học`);
    
    // Thay thế onclick bằng event listener
    deleteButtons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('deleteLesson')) {
            // Trích xuất lessonId từ onclick
            const match = onclickAttr.match(/deleteLesson\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                const lessonId = match[1];
                
                // Xóa onclick và thêm data-lesson-id
                button.removeAttribute('onclick');
                button.setAttribute('data-lesson-id', lessonId);
                
                // Thêm event listener
                button.addEventListener('click', function() {
                    deleteLesson(lessonId);
                });
                
                console.log(`Đã thay thế onclick bằng event listener cho nút xóa bài học với ID: ${lessonId}`);
            }
        }
    });
});

// Cấu hình API 
const BASE_API_URL = 'http://localhost:8080/v1/api';
const API_ENDPOINTS = {
    GET_CLASS: `${BASE_API_URL}/classrooms`,
    GET_STUDENTS: `${BASE_API_URL}/classroom-students`,
    GET_LESSONS: `${BASE_API_URL}/lessons/classroom`,
    CREATE_LESSON: `${BASE_API_URL}/lessons`,
    DELETE_LESSON: `${BASE_API_URL}/lessons`,
    GET_NOTIFICATIONS: `${BASE_API_URL}/notifications/classroom`,
    CREATE_NOTIFICATION: `${BASE_API_URL}/notifications`,
    DELETE_NOTIFICATION: `${BASE_API_URL}/notifications`,
    CREATE_ASSIGNMENT: `${BASE_API_URL}/assignments`,
    GET_ASSIGNMENTS: `${BASE_API_URL}/assignments/class`,
    DELETE_ASSIGNMENT: `${BASE_API_URL}/assignments`
};

// Đặt API_ENDPOINTS vào window để có thể truy cập từ bất kỳ đâu
window.API_ENDPOINTS = API_ENDPOINTS;
window.BASE_API_URL = BASE_API_URL;

// Thêm event listener cho nút tạo thông báo mới trong phần Tổng quan
const btnAddNewNotificationOverview = document.getElementById('btnAddNewNotificationOverview');
if (btnAddNewNotificationOverview) {
    btnAddNewNotificationOverview.addEventListener('click', openNotificationModal);
}
// Thêm hàm deleteAssignment
window.deleteAssignment = async function(assignmentId) {
    if (!assignmentId || !confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    
    console.log('Đang xóa bài tập với ID:', assignmentId);
    
    // Hiển thị loading
    const assignmentElement = document.querySelector(`div[data-assignment-id="${assignmentId}"]`) || 
                             document.querySelector(`.assignment-item-${assignmentId}`);
    
    if (assignmentElement) {
        assignmentElement.classList.add('opacity-50');
    }
    
    try {
        // Lấy email giáo viên từ localStorage
        const teacherEmail = localStorage.getItem('userEmail');
        
        if (!teacherEmail) {
            throw new Error('Không tìm thấy thông tin email giáo viên');
        }
        
        // Đảm bảo API_ENDPOINTS được định nghĩa
        if (!window.API_ENDPOINTS || !window.API_ENDPOINTS.DELETE_ASSIGNMENT) {
            console.warn('API_ENDPOINTS.DELETE_ASSIGNMENT not defined, using default');
            const BASE_API_URL = window.BASE_API_URL || 'http://localhost:8080/v1/api';
            window.API_ENDPOINTS = window.API_ENDPOINTS || {};
            window.API_ENDPOINTS.DELETE_ASSIGNMENT = `${BASE_API_URL}/assignments`;
        }
        
        // Gọi API để xóa bài tập
        const response = await fetch(`${API_ENDPOINTS.DELETE_ASSIGNMENT}/${assignmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherEmail: teacherEmail
            })
        });
        
        const data = await response.json();
        console.log('Kết quả xóa bài tập:', data);
        
        if (data.success) {
            // Hiển thị thông báo thành công
            showToast('Xóa bài tập thành công!', 'success');
            
            // Xóa phần tử khỏi DOM
            if (assignmentElement) {
                assignmentElement.remove();
            }
            
            // Tải lại danh sách bài tập nếu hàm loadAssignments tồn tại
            if (typeof window.loadAssignments === 'function') {
                window.loadAssignments();
            } 
            /*
            else {
                console.warn('loadAssignments function not found, reloading page instead');
                // Tải lại trang sau 1 giây
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            */
            
            // Cập nhật số lượng bài tập trong phần tổng quan nếu hàm tồn tại
            if (typeof updateAssignmentCount === 'function') {
                updateAssignmentCount();
            }
        } else {
            // Hiển thị thông báo lỗi
            showToast(`Lỗi: ${data.message || 'Không thể xóa bài tập'}`, 'error');
            
            // Khôi phục trạng thái phần tử
            if (assignmentElement) {
                assignmentElement.classList.remove('opacity-50');
            }
        }
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showToast('Có lỗi xảy ra khi xóa bài tập', 'error');
        
        // Khôi phục trạng thái phần tử
        if (assignmentElement) {
            assignmentElement.classList.remove('opacity-50');
        }
    }
};
// Hàm tạo modal thông báo
function createNotificationModal() {
    // Lấy mã lớp từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    const teacherEmail = localStorage.getItem('userEmail');
    
    // Tạo element cho modal
    const modal = document.createElement('div');
    modal.id = 'notificationModal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div class="flex justify-between items-center border-b px-6 py-4">
                <h3 class="text-lg font-medium text-gray-900">Tạo thông báo mới</h3>
            </div>
            
            <form id="notificationForm" class="px-6 py-4">
                <div class="mb-4">
                    <label for="notificationTitle" class="block text-gray-700 font-medium mb-2">Tiêu đề thông báo <span class="text-red-500">*</span></label>
                    <input type="text" id="notificationTitle" name="title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                
                <div class="mb-4">
                    <label for="notificationContent" class="block text-gray-700 font-medium mb-2">Nội dung thông báo <span class="text-red-500">*</span></label>
                    <textarea id="notificationContent" name="content" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
                </div>
                
                <input type="hidden" id="notificationClassCode" name="classCode" value="${classCode || ''}">
                <input type="hidden" id="notificationTeacherEmail" name="teacherEmail" value="${teacherEmail || ''}">
                
                <div class="flex justify-end border-t pt-4 mt-4">
                    <button type="button" id="cancelNotificationBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2">
                        Hủy bỏ
                    </button>
                    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-paper-plane mr-1"></i> Gửi thông báo
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Thêm modal vào body
    document.body.appendChild(modal);
    
    // Thêm event listener cho nút đóng modal
    const closeNotificationModalBtn = document.getElementById('closeNotificationModal');
    const cancelNotificationBtn = document.getElementById('cancelNotificationBtn');
    
    if (closeNotificationModalBtn) {
        closeNotificationModalBtn.addEventListener('click', closeNotificationModal);
    }
    
    if (cancelNotificationBtn) {
        cancelNotificationBtn.addEventListener('click', closeNotificationModal);
    }
    
    // Thêm event listener cho form
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', handleNotificationSubmit);
    }
}

// Hàm mở modal thông báo
function openNotificationModal() {
    // Kiểm tra xem modal đã tồn tại chưa
    let modal = document.getElementById('notificationModal');
    
    // Nếu chưa tồn tại, tạo mới
    if (!modal) {
        createNotificationModal();
    } else {
        // Nếu đã tồn tại, hiển thị lại
        modal.classList.remove('hidden');
        
        // Reset form
        const form = document.getElementById('notificationForm');
        if (form) form.reset();
    }
}

// Hàm đóng modal thông báo
function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        // Thêm hiệu ứng fade-out
        modal.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        
        // Sau khi hiệu ứng hoàn thành, ẩn modal
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('opacity-0', 'transition-opacity', 'duration-300');
        }, 300);
    }
}

// Hàm xử lý submit form thông báo
async function handleNotificationSubmit(event) {
    event.preventDefault();
    
    // Lấy dữ liệu từ form
    const title = document.getElementById('notificationTitle').value.trim();
    const content = document.getElementById('notificationContent').value.trim();
    const classCode = document.getElementById('notificationClassCode').value.trim();
    const teacherEmail = document.getElementById('notificationTeacherEmail').value.trim();
    
    // Kiểm tra dữ liệu
    if (!title) {
        showToast('Vui lòng nhập tiêu đề thông báo', 'error');
        return;
    }
    
    if (!content) {
        showToast('Vui lòng nhập nội dung thông báo', 'error');
        return;
    }
    
    if (!classCode) {
        showToast('Không tìm thấy mã lớp học', 'error');
        return;
    }
    
    if (!teacherEmail) {
        showToast('Không tìm thấy thông tin giáo viên', 'error');
        return;
    }
    
    // Tạo đối tượng dữ liệu để gửi đi
    const notificationData = {
        title,
        content,
        classCode,
        teacherEmail
    };
    
    console.log('Dữ liệu thông báo sẽ gửi:', notificationData);
    
    // Hiển thị loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Đang gửi...`;
    
    try {
        // Gọi API để tạo thông báo
        const response = await fetch(API_ENDPOINTS.CREATE_NOTIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData)
        });
        
        // Xử lý kết quả
        const result = await response.json();
        console.log('Kết quả tạo thông báo:', result);
        
        if (result.success) {
            // Hiển thị thông báo thành công
            showToast('Gửi thông báo thành công!', 'success');
            
            // Đóng modal
            closeNotificationModal();
            
            // Tải lại danh sách thông báo trong phần Tổng quan
            loadOverviewNotifications();
        } else {
            // Hiển thị thông báo lỗi
            showToast(`Lỗi: ${result.message || 'Không thể gửi thông báo'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating notification:', error);
        showToast('Có lỗi xảy ra khi gửi thông báo', 'error');
    } finally {
        // Khôi phục trạng thái nút submit
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Hàm tải thông báo trong phần Tổng quan
async function loadOverviewNotifications() {
    const overviewNotificationsList = document.getElementById('overviewNotificationsList');
    if (!overviewNotificationsList) return;
    
    // Hiển thị loading
    overviewNotificationsList.innerHTML = `
        <div class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p class="text-gray-500">Đang tải thông báo...</p>
        </div>
    `;
    
    // Lấy mã lớp từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (!classCode) {
        console.error('Không tìm thấy mã lớp trong URL');
        overviewNotificationsList.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Không tìm thấy mã lớp học</p>
            </div>
        `;
        return;
    }
    
    try {
        // Gọi API để lấy danh sách thông báo
        const response = await fetch(`${API_ENDPOINTS.GET_NOTIFICATIONS}/${classCode}`);
        const data = await response.json();
        
        console.log('Dữ liệu thông báo nhận được (Tổng quan):', data);
        
        // Kiểm tra cấu trúc dữ liệu và đảm bảo notifications là một mảng
        let notifications = [];
        
        if (data && data.success && data.data) {
            notifications = data.data;
        } else if (Array.isArray(data)) {
            notifications = data;
        }
        
        if (!Array.isArray(notifications) || notifications.length === 0) {
            overviewNotificationsList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-gray-500">Chưa có thông báo nào</p>
                </div>
            `;
            return;
        }
        
        // Hiển thị 3 thông báo gần đây nhất
        const recentNotifications = notifications.slice(0, 3);
        
        overviewNotificationsList.innerHTML = '';
        
        // Hiển thị từng thông báo
        recentNotifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3';
            notificationItem.dataset.notificationId = notification._id;
            
            // Định dạng ngày tạo
            const createdDate = new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            notificationItem.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                            <i class="fas fa-bell text-blue-500"></i>
                        </div>
                        <div>
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
                    </div>
                    <div class="flex space-x-1">
                        <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteNotification('${notification._id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            overviewNotificationsList.appendChild(notificationItem);
        });
    } catch (error) {
        console.error('Lỗi khi tải thông báo trong phần Tổng quan:', error);
        overviewNotificationsList.innerHTML = `
            <div class="text-center py-4">
                <p class="text-red-500">Có lỗi xảy ra khi tải thông báo</p>
                <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md" onclick="loadOverviewNotifications()">
                    <i class="fas fa-sync-alt mr-1"></i> Thử lại
                </button>
            </div>
        `;
    }
}

// Hàm xóa thông báo
async function deleteNotification(notificationId) {
    if (!notificationId || !confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    
    console.log('Đang xóa thông báo với ID:', notificationId);
    
    // Hiển thị loading
    const notificationElements = document.querySelectorAll(`div[data-notification-id="${notificationId}"]`);
    
    notificationElements.forEach(element => {
        if (element) {
            element.classList.add('opacity-50');
        }
    });
    
    try {
        // Gọi API để xóa thông báo
        const response = await fetch(`${API_ENDPOINTS.DELETE_NOTIFICATION}/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherEmail: localStorage.getItem('userEmail')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Hiển thị thông báo thành công
            showToast('Xóa thông báo thành công!', 'success');
            
            // Xóa thông báo khỏi DOM
            notificationElements.forEach(element => {
                if (element) {
                    element.remove();
                }
            });
            
            // Tải lại danh sách thông báo trong phần Tổng quan
            loadOverviewNotifications();
        } else {
            // Hiển thị thông báo lỗi
            showToast(`Lỗi: ${data.message || 'Không thể xóa thông báo'}`, 'error');
            
            // Khôi phục trạng thái phần tử
            notificationElements.forEach(element => {
                if (element) {
                    element.classList.remove('opacity-50');
                }
            });
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Có lỗi xảy ra khi xóa thông báo', 'error');
        
        // Khôi phục trạng thái phần tử
        notificationElements.forEach(element => {
            if (element) {
                element.classList.remove('opacity-50');
            }
        });
    }
}

// Đặt các hàm vào window object để có thể gọi từ bất kỳ đâu
window.openNotificationModal = openNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.loadOverviewNotifications = loadOverviewNotifications;
window.deleteNotification = deleteNotification;

// Tải thông báo trong phần Tổng quan khi trang được tải
loadOverviewNotifications();

// Đảm bảo tất cả các hàm được gán vào window object
// Đặt đoạn mã này ở cuối file để đảm bảo tất cả các hàm đã được định nghĩa
document.addEventListener('DOMContentLoaded', function() {
    // Gán các hàm vào window object
    window.editLesson = editLesson;
    window.openEditLessonModal = openEditLessonModal;
    window.closeEditLessonModal = closeEditLessonModal;
    window.handleEditLessonSubmit = handleEditLessonSubmit;
    window.deleteLesson = deleteLesson;

    // Thêm các hàm khác nếu cần
    
    console.log('Đã gán các hàm xử lý bài học vào window object');
});

// Hàm mở modal tạo bài tập mới
function openCreateAssignmentModal() {
    // Lấy mã lớp từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('code');
    
    if (!classCode) {
        showToast('Không tìm thấy mã lớp học', 'error');
        return;
    }
    
    // Tạo modal nếu chưa tồn tại
    let createAssignmentModal = document.getElementById('createAssignmentModal');
    
    if (!createAssignmentModal) {
        createAssignmentModal = document.createElement('div');
        createAssignmentModal.id = 'createAssignmentModal';
        createAssignmentModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        createAssignmentModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-xl font-semibold text-gray-800 text-center">Tạo bài tập mới</h3>
                    <a type="button" id="closeCreateAssignmentModalBtn" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </a>
                </div>
                <form id="createAssignmentForm" class="p-6">
                    <div class="mb-4">
                        <label for="assignmentTitle" class="block text-gray-700 font-medium mb-2">Tiêu đề bài tập <span class="text-red-500">*</span></label>
                        <input type="text" id="assignmentTitle" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="assignmentDescription" class="block text-gray-700 font-medium mb-2">Mô tả bài tập <span class="text-red-500">*</span></label>
                        <textarea id="assignmentDescription" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-1 gap-2 mb-2">
                        <div>
                            <label for="assignmentDueDate" class="block text-gray-700 font-medium mb-2">Hạn nộp <span class="text-red-500">*</span></label>
                            <input type="datetime-local" id="assignmentDueDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        </div>
                        
                    </div>
                    
                    <div class="mb-4">
                        <label for="assignmentFile" class="block text-gray-700 font-medium mb-2">Tệp đính kèm (tùy chọn)</label>
                        <input type="file" id="assignmentFile" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">Tải lên tệp đính kèm cho bài tập (PDF)</p>
                    </div>
                    
                    <input type="hidden" id="assignmentClassCode" value="${classCode}">
                    <input type="hidden" id="assignmentTeacherEmail" value="${localStorage.getItem('userEmail') || ''}">
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" id="submitCreateAssignmentBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-plus mr-1"></i>Tạo bài tập
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(createAssignmentModal);
        
        // Thiết lập giá trị mặc định cho ngày hạn nộp (7 ngày từ hiện tại)
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        const formattedDate = defaultDueDate.toISOString().slice(0, 16);
        const dueDateInput = document.getElementById('assignmentDueDate');
        if (dueDateInput) {
            dueDateInput.value = formattedDate;
        }
        
        // Thêm event listener cho nút đóng modal
        const closeBtn = document.getElementById('closeCreateAssignmentModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeCreateAssignmentModal();
            });
        }
        
        // Thêm event listener cho nút hủy
        const cancelBtn = document.getElementById('cancelCreateAssignmentBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeCreateAssignmentModal();
            });
        }
        
        // Thêm event listener cho nút submit
        const submitBtn = document.getElementById('submitCreateAssignmentBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Submit button clicked');
                handleCreateAssignmentSubmit();
            });
        }
    } else {
        // Nếu modal đã tồn tại, cập nhật giá trị của các trường ẩn
        document.getElementById('assignmentClassCode').value = classCode;
        document.getElementById('assignmentTeacherEmail').value = localStorage.getItem('userEmail') || '';
        
        // Hiển thị modal
        createAssignmentModal.classList.remove('hidden');
    }
}

// Hàm đóng modal tạo bài tập
function closeCreateAssignmentModal() {
    const modal = document.getElementById('createAssignmentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Hàm xử lý tạo bài tập mới
function handleCreateAssignmentSubmit() {
    console.log('Handling assignment form submission');
    
    // Lấy các phần tử form
    const titleInput = document.getElementById('assignmentTitle');
    const descriptionInput = document.getElementById('assignmentDescription');
    const dueDateInput = document.getElementById('assignmentDueDate');
    const maxScoreInput = document.getElementById('assignmentMaxScore');
    const fileInput = document.getElementById('assignmentFile');
    const classCodeInput = document.getElementById('assignmentClassCode');
    const teacherEmailInput = document.getElementById('assignmentTeacherEmail');
    
    // Kiểm tra xem các phần tử có tồn tại không
    if (!titleInput || !descriptionInput || !dueDateInput || !maxScoreInput || !classCodeInput || !teacherEmailInput) {
        console.error('Missing form elements', {
            titleInput, descriptionInput, dueDateInput, maxScoreInput, classCodeInput, teacherEmailInput
        });
        showToast('Có lỗi xảy ra: Không tìm thấy các trường dữ liệu', 'error');
        return;
    }
    
    // Lấy dữ liệu từ form
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const dueDate = dueDateInput.value;
    const maxScore = maxScoreInput.value;
    const classCode = classCodeInput.value;
    const teacherEmail = teacherEmailInput.value;
    
    console.log('Form data:', { title, description, dueDate, maxScore, classCode, teacherEmail });
    
    // Kiểm tra dữ liệu
    if (!title || !description || !dueDate || !maxScore || !classCode || !teacherEmail) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }
    
    // Hiển thị loading
    const submitBtn = document.getElementById('submitCreateAssignmentBtn');
    if (!submitBtn) {
        console.error('Submit button not found');
        showToast('Có lỗi xảy ra: Không tìm thấy nút gửi', 'error');
        return;
    }
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Đang tạo...`;
    
    try {
        console.log('Creating FormData');
        // Tạo FormData để gửi dữ liệu và file
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('classCode', classCode);
        formData.append('teacherEmail', teacherEmail);
        formData.append('dueDate', dueDate);
        formData.append('maxScore', maxScore);
        
        // Thêm file nếu có
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            formData.append('assignmentFile', fileInput.files[0]);
            console.log('File added to FormData:', fileInput.files[0].name);
        }
        
        // Gọi API để tạo bài tập
        fetch(API_ENDPOINTS.CREATE_ASSIGNMENT, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log('Response data:', result);
            
            if (result.success) {
                // Hiển thị thông báo thành công
                showToast('Tạo bài tập thành công!', 'success');
                
                // Đóng modal
                closeCreateAssignmentModal();
                
                // Tải lại danh sách bài tập
                const assignmentsList = document.getElementById('assignmentsList');
                if (assignmentsList) {
                    assignmentsList.dataset.loaded = 'false';
                    loadAssignments();
                }
            } else {
                // Hiển thị thông báo lỗi
                showToast(`Lỗi: ${result.message || 'Không thể tạo bài tập'}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error creating assignment:', error);
            showToast('Có lỗi xảy ra khi tạo bài tập: ' + (error.message || ''), 'error');
        })
        .finally(() => {
            // Khôi phục trạng thái nút submit
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    } catch (error) {
        console.error('Error preparing assignment data:', error);
        showToast('Có lỗi xảy ra khi chuẩn bị dữ liệu bài tập: ' + (error.message || ''), 'error');
        
        // Khôi phục trạng thái nút submit
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Hàm gửi dữ liệu bài tập lên server
async function sendAssignmentData(url, formData, submitBtn, originalBtnText) {
    try {
        console.log('Sending request to:', url);
        // Gọi API để tạo bài tập
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        console.log('Response received:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.success) {
            showToast('Tạo bài tập thành công!', 'success');
            closeCreateAssignmentModal();
            
            // Tải lại danh sách bài tập
            if (typeof loadAssignments === 'function') {
                loadAssignments();
            } else {
                console.warn('loadAssignments function not found, cannot reload assignments list');
                // Tải lại trang sau 1 giây
                /*
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                */
            }
        } else {
            showToast(`Lỗi: ${result.message || 'Không thể tạo bài tập'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
        showToast('Có lỗi xảy ra khi tạo bài tập: ' + (error.message || ''), 'error');
    } finally {
        // Khôi phục trạng thái nút submit
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Hiển thị thông báo toast
function showToast(message, type = 'info') {
    console.log(`Toast: ${type} - ${message}`);
    
    // Kiểm tra xem đã có container toast chưa
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col items-end space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    // Tạo toast mới
    const toast = document.createElement('div');
    
    // Thiết lập class dựa trên loại thông báo
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
    
    toast.className = `${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center max-w-xs`;
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    // Thêm toast vào container
    toastContainer.appendChild(toast);
    
    // Hiệu ứng hiển thị
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Thêm các hàm vào window object
window.openCreateAssignmentModal = openCreateAssignmentModal;
window.closeCreateAssignmentModal = closeCreateAssignmentModal;
window.handleCreateAssignmentSubmit = handleCreateAssignmentSubmit;

// Đảm bảo các hàm được gán vào window object khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up assignment functions');
    
    // Thêm các hàm bài tập vào window object
    window.openCreateAssignmentModal = openCreateAssignmentModal;
    window.closeCreateAssignmentModal = closeCreateAssignmentModal;
    window.handleCreateAssignmentSubmit = handleCreateAssignmentSubmit;
    
    // Thêm event listener cho nút thêm bài tập mới
    const btnAddNewAssignment = document.getElementById('btnAddNewAssignment');
    if (btnAddNewAssignment) {
        console.log('Found btnAddNewAssignment, adding click listener');
        btnAddNewAssignment.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Add new assignment button clicked');
            openCreateAssignmentModal();
        });
    } else {
        console.warn('btnAddNewAssignment not found in DOM');
    }
    
    console.log('Assignment functions setup complete');
});















