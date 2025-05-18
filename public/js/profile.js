document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    if (!userEmail) {
        console.error('No email found in localStorage');
        window.location.href = '/login.html';
        return;
    }

    // Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');

    // Input elements
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const dobInput = document.getElementById('dobInput');
    const genderInput = document.getElementById('genderInput');
    const addressInput = document.getElementById('addressInput');

    // Display elements
    const userNameElement = document.getElementById('userName');
    const nameDisplay = document.getElementById('nameDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const dobDisplay = document.getElementById('dobDisplay');
    const genderDisplay = document.getElementById('genderDisplay');
    const addressDisplay = document.getElementById('addressDisplay');

    // Fetch and display user data
    function fetchUserData() {
        fetch(`http://localhost:8080/v1/api/username?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update display view
                    userNameElement.textContent = data.name || 'Không có tên';
                    nameDisplay.textContent = data.name || 'Chưa cập nhật';
                    emailDisplay.textContent = data.email || userEmail;
                    phoneDisplay.textContent = data.phone || 'Chưa cập nhật';
                    dobDisplay.textContent = data.dateOfBirth || 'Chưa cập nhật';
                    genderDisplay.textContent = data.gender || 'Chưa cập nhật';
                    addressDisplay.textContent = data.address || 'Chưa cập nhật';

                    // Update form inputs
                    nameInput.value = data.name || '';
                    emailInput.value = data.email || userEmail;
                    phoneInput.value = data.phone || '';
                    dobInput.value = data.dateOfBirth || '';
                    genderInput.value = data.gender || 'unknown';
                    addressInput.value = data.address || '';
                }
            })
            .catch(error => {
                console.error('Error fetching profile:', error);
                alert('Có lỗi xảy ra khi tải thông tin');
            });
    }

    // Switch to edit mode
    editProfileBtn.addEventListener('click', () => {
        profileView.classList.add('hidden');
        profileEdit.classList.remove('hidden');
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', () => {
        profileView.classList.remove('hidden');
        profileEdit.classList.add('hidden');
        fetchUserData(); // Reset form data
    });

    // Save profile changes
    saveProfileBtn.addEventListener('click', () => {
        const updatedData = {
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            dateOfBirth: dobInput.value,
            gender: genderInput.value,
            address: addressInput.value
        };

        fetch('http://localhost:8080/v1/api/update-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Thông tin tài khoản đã được cập nhật thành công.") {
                alert('Cập nhật thông tin thành công!');
                profileView.classList.remove('hidden');
                profileEdit.classList.add('hidden');
                fetchUserData(); // Refresh displayed data
            } else {
                alert('Có lỗi xảy ra khi cập nhật thông tin');
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin');
        });
    });

    // Initial data load
    fetchUserData();
});