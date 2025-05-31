document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình API
    const BASE_API_URL = 'http://localhost:8080/v1/api';
    const API_ENDPOINTS = {
        GET_CLASS: `${BASE_API_URL}/classrooms`
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
        
        // Gọi API để lấy danh sách bài học
        fetch(`${BASE_API_URL}/lessons/class/${classCode}`)
            .then(response => response.json())
            .then(data => {
                const lessons = data.data || [];
                
                if (lessons.length === 0) {
                    lessonsList.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-gray-500">Chưa có bài học nào</p>
                        </div>
                    `;
                    return;
                }
                
                // Hiển thị danh sách bài học
                lessonsList.innerHTML = '';
                lessons.forEach(lesson => {
                    const lessonItem = document.createElement('div');
                    lessonItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
                    lessonItem.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                    <i class="fas fa-book-open text-green-500"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium">${lesson.title || 'Bài học không có tiêu đề'}</h4>
                                    <p class="text-sm text-gray-600">Ngày tạo: ${new Date(lesson.createdAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="text-blue-500 hover:text-blue-700" onclick="editLesson('${lesson.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-red-500 hover:text-red-700" onclick="deleteLesson('${lesson.id}')">
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
                console.error('Error loading lessons:', error);
                lessonsList.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-red-500">Có lỗi xảy ra khi tải danh sách bài học</p>
                    </div>
                `;
            });
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

    // Hàm xem tiến độ học sinh
    function viewStudentProgress(studentId) {
        if (!studentId) return;
        
        // Hiển thị modal tiến độ học sinh
        const modal = document.getElementById('studentProgressModal');
        if (!modal) return;
        
        // Hiển thị loading
        const modalContent = document.getElementById('studentProgressContent');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p class="text-gray-500">Đang tải tiến độ học tập...</p>
                </div>
            `;
        }
        
        // Hiển thị modal
        modal.classList.remove('hidden');
        
        // Lấy mã lớp từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('code');
        
        if (!classCode) return;
        
        // Gọi API để lấy tiến độ học tập của học sinh
        fetch(`${BASE_API_URL}/students/${studentId}/progress?classCode=${classCode}`)
            .then(response => response.json())
            .then(data => {
                const progress = data.data || data;
                
                if (!progress) {
                    if (modalContent) {
                        modalContent.innerHTML = `
                            <div class="text-center py-4">
                                <p class="text-gray-500">Chưa có dữ liệu tiến độ học tập</p>
                            </div>
                        `;
                    }
                    return;
                }
                
                // Hiển thị tiến độ học tập
                if (modalContent) {
                    modalContent.innerHTML = `
                        <div class="bg-white p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Tiến độ học tập</h3>
                            
                            <div class="mb-4">
                                <h4 class="font-medium mb-2">Tổng quan</h4>
                                <div class="grid grid-cols-3 gap-4">
                                    <div class="bg-blue-50 p-3 rounded">
                                        <p class="text-sm text-gray-500">Bài học đã hoàn thành</p>
                                        <p class="font-bold text-xl">${progress.completedLessons || 0}/${progress.totalLessons || 0}</p>
                                    </div>
                                    <div class="bg-green-50 p-3 rounded">
                                        <p class="text-sm text-gray-500">Bài tập đã nộp</p>
                                        <p class="font-bold text-xl">${progress.submittedAssignments || 0}/${progress.totalAssignments || 0}</p>
                                    </div>
                                    <div class="bg-yellow-50 p-3 rounded">
                                        <p class="text-sm text-gray-500">Bài kiểm tra đã làm</p>
                                        <p class="font-bold text-xl">${progress.completedTests || 0}/${progress.totalTests || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h4 class="font-medium mb-2">Điểm số</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Điểm trung bình bài tập</p>
                                        <p class="font-bold text-xl">${progress.averageAssignmentScore || 0}/10</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Điểm trung bình kiểm tra</p>
                                        <p class="font-bold text-xl">${progress.averageTestScore || 0}/10</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-end">
                                <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onclick="closeStudentProgressModal()">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading student progress:', error);
                if (modalContent) {
                    modalContent.innerHTML = `
                        <div class="text-center py-4">
                            <p class="text-red-500">Có lỗi xảy ra khi tải tiến độ học tập</p>
                        </div>
                    `;
                }
            });
    }

    // Hàm đóng modal tiến độ học sinh
    function closeStudentProgressModal() {
        const modal = document.getElementById('studentProgressModal');
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
});



