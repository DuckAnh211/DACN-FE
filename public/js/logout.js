/**
 * Hàm xóa tất cả dữ liệu người dùng trong localStorage
 */
function clearAllUserData() {
    // Lưu lại danh sách các lớp học đã tham gia trước khi xóa
    const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
    
    // Xóa thông tin đăng nhập cơ bản
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userType');
    localStorage.removeItem('teacherName');
    localStorage.removeItem('teacherSubject');
    localStorage.removeItem('userName');
    localStorage.removeItem('adminLoggedIn');
    
    // Xóa danh sách lớp học đã tham gia
    localStorage.removeItem('joinedClasses');
    
    // Xóa thông tin chi tiết của từng lớp học
    joinedClasses.forEach(classCode => {
        localStorage.removeItem(`class_${classCode}`);
    });
    
    // Xóa tất cả các mục bắt đầu bằng các tiền tố cụ thể
    const prefixesToClear = ['class_', 'user_', 'exam_', 'meeting_', 'question_'];
    
    // Thu thập tất cả các khóa cần xóa
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            for (const prefix of prefixesToClear) {
                if (key.startsWith(prefix)) {
                    keysToRemove.push(key);
                    break;
                }
            }
        }
    }
    
    // Xóa các khóa đã thu thập
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Đã xóa tất cả dữ liệu người dùng khỏi localStorage');
}

/**
 * Hàm xử lý đăng xuất
 */
function logout() {
    clearAllUserData();
    window.location.href = './index.html';
}

// Gắn sự kiện cho tất cả các nút đăng xuất
document.addEventListener('DOMContentLoaded', function() {
    // Tìm tất cả các liên kết đăng xuất
    const logoutLinks = document.querySelectorAll('a[href="./index.html"].bg-green-400');
    
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Ngăn chặn hành vi mặc định của liên kết
            logout();
        });
    });
    
    // Tìm nút đăng xuất theo ID
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();
            logout();
        });
    }
});
