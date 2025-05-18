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
    const lessonsTab = document.getElementById('lessons-tab'); 
    const assignmentsTab = document.getElementById('assignments-tab'); 
    const lessonsContent = document.getElementById('lessons-content'); 
    const assignmentsContent = document.getElementById('assignments-content'); 

    lessonsTab.addEventListener('click', function() { 
        lessonsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500'); 
        assignmentsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500'); 
        assignmentsTab.classList.add('text-gray-500'); 
        
        lessonsContent.classList.remove('hidden'); 
        assignmentsContent.classList.add('hidden'); 
    }); 

    assignmentsTab.addEventListener('click', function() { 
        assignmentsTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500'); 
        lessonsTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500'); 
        lessonsTab.classList.add('text-gray-500'); 
        
        assignmentsContent.classList.remove('hidden'); 
        lessonsContent.classList.add('hidden'); 
    }); 
});