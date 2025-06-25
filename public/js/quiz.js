const BASE_API_URL = 'http://localhost:8080/v1/api';  //'https://dacn-be-hh2q.onrender.com/v1/api';
// Cấu hình API
const API_ENDPOINTS = {
    GET_QUIZ: `${BASE_API_URL}/quizzes`, 
    SUBMIT_QUIZ: `${BASE_API_URL}/quiz-results`,
    GET_USER: `${BASE_API_URL}/user`
};

document.addEventListener('DOMContentLoaded', async function() {
    const quizContainer = document.getElementById('quizContainer');
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    const classCode = urlParams.get('code');
    const studentEmail = localStorage.getItem('userEmail');

    if (!quizId || !studentEmail || !classCode) {
        quizContainer.innerHTML = `<div class="text-red-500 text-center py-8">Thiếu thông tin để làm bài kiểm tra.</div>`;
        return;
    }

    // Lấy thông tin bài kiểm tra
    let quizData;
    try {
        const res = await fetch(`${API_ENDPOINTS.GET_QUIZ}/${quizId}`);
        const data = await res.json();
        if (!data.success || !data.quiz) throw new Error('Không tìm thấy bài kiểm tra');
        quizData = data.quiz;
    } catch (err) {
        quizContainer.innerHTML = `<div class="text-red-500 text-center py-8">Không thể tải bài kiểm tra.</div>`;
        return;
    }

    // Hiển thị bài kiểm tra
   renderQuiz(quizData, studentEmail);

// Định nghĩa lại hàm:
function renderQuiz(quiz, userEmail) {
        let html = `
<div class="quiz-user mb-2 text-right text-sm text-gray-600">
        👤 Người làm: <b>${userEmail}</b>
    </div>
    <br>
    <div class="quiz-title">${quiz.title}</div>
    <div class="quiz-desc">${quiz.description || ''}</div>
    <div id="timer" class="text-center text-lg font-bold text-red-600 mb-4"></div>
    <form id="quizForm">
`;
quiz.questions.forEach((q, idx) => {
    html += `
        <div class="mb-6">
            <div class="quiz-question">Câu ${idx + 1}: ${q.questionText}</div>
            <div class="quiz-options">
                ${q.options.map((opt, optIdx) => `
                    <label>
                        <input type="radio" name="q${idx}" value="${optIdx}" required>
                        <span>${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
});
html += `
    <button type="submit" class="quiz-submit-btn">Nộp bài</button>
</form>
<div id="quizResult" class="quiz-result"></div>
`;
quizContainer.innerHTML = html;

        // Đếm ngược thời gian
        startTimer(quiz.timeLimit);

        document.getElementById('quizForm').addEventListener('submit', function(e) {
            e.preventDefault();
            submitQuiz(quiz, true);
        });
    }

async function getStudentIdByEmail(userEmail) {
    const res = await fetch(`${API_ENDPOINTS.GET_USER}`);
    const users = await res.json();
    const user = users.find(u => u.email === userEmail);
    return user ? user._id : null;
}

    // Hàm đếm ngược
    function startTimer(minutes) {
        let totalSeconds = minutes * 60;
        const timerDiv = document.getElementById('timer');
        updateTimerDisplay(totalSeconds, timerDiv);

        const timerInterval = setInterval(() => {
            totalSeconds--;
            updateTimerDisplay(totalSeconds, timerDiv);

            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerDiv.textContent = "Hết thời gian! Bài đã được nộp tự động.";
                submitQuiz(quizData, false); // Nộp tự động khi hết giờ
            }
        }, 1000);
    }

    function updateTimerDisplay(totalSeconds, timerDiv) {
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        timerDiv.textContent = `Thời gian còn lại: ${min}:${sec.toString().padStart(2, '0')}`;
    }

async function submitQuiz(quiz, manual = true) {
    const form = document.getElementById('quizForm');
    const answers = [];
    for (let i = 0; i < quiz.questions.length; i++) {
        // Nếu học sinh chưa chọn đáp án, mặc định -1
        const val = form[`q${i}`].value || -1;
        answers.push(Number(val));
    }

    // Chấm điểm tự động trên FE
    let score = 0;
    quiz.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) score++;
    });
    let score10 = Math.round((score / quiz.questions.length) * 10 * 10) / 10;

// Ưu tiên lấy studentId từ URL, nếu không có thì lấy từ localStorage
   const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('userEmail') || localStorage.getItem('userEmail');
    let studentId = urlParams.get('studentId') || localStorage.getItem('userId');

    // Nếu chưa có studentId, lấy từ userEmail
    if (!studentId && userEmail) {
        studentId = await getStudentIdByEmail(userEmail);
    }

    if (!studentId) {
        alert('Không tìm thấy thông tin học sinh. Vui lòng đăng nhập lại.');
        return;
    }
    // Gửi kết quả lên API
    try {
        await fetch(`${API_ENDPOINTS.SUBMIT_QUIZ}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quizId: quiz._id,
                studentId: studentId, 
                studentEmail,
                score: score10
            })
        });
    } catch (err) {
        // Có thể hiển thị thông báo lỗi nếu muốn
    }

    document.getElementById('quizResult').innerHTML = `
        <div class="bg-green-100 text-green-700 p-4 rounded-lg text-center font-medium">
            Nộp bài thành công!<br>
            Số câu đúng: <b>${score}/${quiz.questions.length}</b><br>
            Điểm của bạn: <b>${score10}/10</b>
        </div>
    `;
    form.querySelectorAll('button[type="submit"]')[0].disabled = true;
}
});