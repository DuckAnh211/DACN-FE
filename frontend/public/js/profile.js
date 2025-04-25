document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    if (!userEmail) {
        console.error('No email found in localStorage');
        window.location.href = '/login.html';
        return;
    }

    // Check if elements exist before trying to update them
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userPhoneElement = document.getElementById('userPhone');
    const userDOBElement = document.getElementById('userDOB');
    const userGenderElement = document.getElementById('userGender');
    const userAddressElement = document.getElementById('userAddress');
    
    if (!userNameElement || !userEmailElement || !userPhoneElement || 
        !userDOBElement || !userGenderElement || !userAddressElement) {
        console.error('One or more HTML elements not found');
        return;
    }

    // Fetch user profile data
    console.log('Fetching profile data from:', `http://localhost:8080/v1/api/username?email=${userEmail}`);
    fetch(`http://localhost:8080/v1/api/username?email=${userEmail}`)
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Profile data received:', data);
            
            if (data.success) {
                // Update profile information
                userNameElement.textContent = data.name || 'Không có tên';
                userEmailElement.textContent = data.email || userEmail;
                userPhoneElement.textContent = data.phone || 'Chưa cập nhật';
                userDOBElement.textContent = data.dateOfBirth || 'Chưa cập nhật';
                userGenderElement.textContent = data.gender || 'Chưa cập nhật';
                userAddressElement.textContent = data.address || 'Chưa cập nhật';
                console.log('Profile updated successfully');
            } else {
                console.error('API returned success: false');
                alert('Không thể tải thông tin người dùng');
            }
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            alert('Có lỗi xảy ra khi tải thông tin');
        });
});

/* Course element creation function - to be used later
function createCourseElement(course) {
    const div = document.createElement('div');
    div.className = 'border rounded-lg p-4 hover:shadow-md transition-shadow';
    
    div.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <h4 class="font-semibold text-lg text-gray-800">${course.name}</h4>
                <p class="text-sm text-gray-600">Mã lớp: ${course.code}</p>
            </div>
            <div class="text-right">
                <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Đang học</span>
                <div class="mt-1 text-sm text-gray-500">Tiến độ: ${course.progress}%</div>
            </div>
        </div>
        <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${course.progress}%"></div>
        </div>
    `;
    
    return div;
}
*/