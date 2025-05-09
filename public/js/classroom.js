document.addEventListener('DOMContentLoaded', function() {
    // Xử lý chuyển đổi tab
    const lessonsTab = document.getElementById('lessons-tab');
    const assignmentsTab = document.getElementById('assignments-tab');
    const uploadTab = document.getElementById('upload-tab');
    
    const lessonsContent = document.getElementById('lessons-content');
    const assignmentsContent = document.getElementById('assignments-content');
    const uploadContent = document.getElementById('upload-content');
    
    // Hàm chuyển tab
    function switchTab(activeTab, activeContent) {
        // Đặt lại tất cả các tab
        [lessonsTab, assignmentsTab, uploadTab].forEach(tab => {
            tab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
            tab.classList.add('text-gray-500');
        });
        
        // Ẩn tất cả nội dung
        [lessonsContent, assignmentsContent, uploadContent].forEach(content => {
            content.classList.add('hidden');
        });
        
        // Hiển thị tab và nội dung đang hoạt động
        activeTab.classList.remove('text-gray-500');
        activeTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        activeContent.classList.remove('hidden');
    }
    
    // Thêm sự kiện click cho các tab
    lessonsTab.addEventListener('click', () => switchTab(lessonsTab, lessonsContent));
    assignmentsTab.addEventListener('click', () => switchTab(assignmentsTab, assignmentsContent));
    uploadTab.addEventListener('click', () => switchTab(uploadTab, uploadContent));
    
    // Xử lý đăng tải file
    const lessonFileInput = document.getElementById('lessonFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    // Hiển thị thông tin file khi người dùng chọn file
    lessonFileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileName.textContent = file.name;
            
            // Định dạng kích thước file
            const size = file.size;
            if (size < 1024) {
                fileSize.textContent = size + ' bytes';
            } else if (size < 1024 * 1024) {
                fileSize.textContent = (size / 1024).toFixed(2) + ' KB';
            } else {
                fileSize.textContent = (size / (1024 * 1024)).toFixed(2) + ' MB';
            }
            
            // Hiển thị thông tin file
            fileInfo.classList.remove('hidden');
        } else {
            fileInfo.classList.add('hidden');
        }
    });
    
    // Xử lý nút hủy bỏ
    const cancelUploadBtn = document.getElementById('cancelUpload');
    cancelUploadBtn.addEventListener('click', function() {
        // Xóa giá trị của form
        document.getElementById('uploadLessonForm').reset();
        fileInfo.classList.add('hidden');
    });
    
    // Xử lý form đăng tải
    const uploadForm = document.getElementById('uploadLessonForm');
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Tạo FormData để gửi dữ liệu
        const formData = new FormData(this);
        
        // Hiển thị thông báo đang xử lý
        alert('Đang đăng tải bài học...');
        
        // Mô phỏng việc gửi dữ liệu lên server
        // Trong thực tế, bạn sẽ sử dụng fetch hoặc XMLHttpRequest để gửi dữ liệu
        setTimeout(() => {
            alert('Đăng tải bài học thành công!');
            // Đặt lại form
            uploadForm.reset();
            fileInfo.classList.add('hidden');
            // Chuyển về tab bài học
            switchTab(lessonsTab, lessonsContent);
        }, 1500);
        
        // Trong thực tế, bạn sẽ sử dụng mã tương tự như sau:
        /*
        fetch('/api/lessons/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert('Đăng tải bài học thành công!');
            uploadForm.reset();
            fileInfo.classList.add('hidden');
            switchTab(lessonsTab, lessonsContent);
        })
        .catch(error => {
            alert('Lỗi khi đăng tải bài học: ' + error.message);
        });
        */
    });
});