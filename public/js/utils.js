// API Configuration
const BASE_API_URL = 'http://localhost:8080/v1/api';

// Centralized API Endpoints
const API_ENDPOINTS = {
    // Class related endpoints
    GET_CLASS: `${BASE_API_URL}/classrooms`,
    GET_CLASSES: `${BASE_API_URL}/classrooms`,
    CREATE_CLASS: `${BASE_API_URL}/classrooms`,
    JOIN_CLASS: `${BASE_API_URL}/join-classroom`,
    
    // Lesson related endpoints
    GET_LESSONS: `${BASE_API_URL}/lessons/classroom`,
    CREATE_LESSON: `${BASE_API_URL}/lessons`,
    DELETE_LESSON: `${BASE_API_URL}/lessons`,
    
    // Student related endpoints
    GET_STUDENTS: `${BASE_API_URL}/classroom-students`,
    
    // Assignment related endpoints
    CREATE_ASSIGNMENT: `${BASE_API_URL}/assignments`,
    GET_ASSIGNMENTS: `${BASE_API_URL}/assignments/class`,
    DELETE_ASSIGNMENT: `${BASE_API_URL}/assignments`,
    SUBMIT_ASSIGNMENT: `${BASE_API_URL}/submissions`,
    GET_SUBMISSION_STATUS: `${BASE_API_URL}/submissions/status`,
    
    // Notification related endpoints
    GET_NOTIFICATIONS: `${BASE_API_URL}/notifications/classroom`,
    CREATE_NOTIFICATION: `${BASE_API_URL}/notifications`,
    DELETE_NOTIFICATION: `${BASE_API_URL}/notifications`,
    
    // Test related endpoints
    GET_TESTS: `${BASE_API_URL}/tests/class`,
    
    // Teacher related endpoints
    GET_TEACHER_INFO: `${BASE_API_URL}/teacherinfo`,
    UPDATE_TEACHER: `${BASE_API_URL}/update-teacher`,
    CHANGE_PASSWORD: `${BASE_API_URL}/change-password`,
    GET_TEACHER_STATS: `${BASE_API_URL}/teacher-stats`
};

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'rounded-md p-4 flex items-center shadow-md transition-all duration-300 transform translate-x-full';
    
    // Set background color based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            toast.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            toast.classList.add('bg-blue-500', 'text-white');
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="flex-1">${message}</div>
        <button class="ml-2 focus:outline-none">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Animate toast in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Add click event to close button
    const closeButton = toast.querySelector('button');
    closeButton.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove toast after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Removes a toast element with animation
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Export the utilities to make them available globally
window.API_ENDPOINTS = API_ENDPOINTS;
window.BASE_API_URL = BASE_API_URL;
window.showToast = showToast;