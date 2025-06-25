const API_URL = 'http://localhost:8080/v1/api/questions'; //'https://dacn-be-hh2q.onrender.com/v1/api/questions';

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("questionModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.querySelector(".close-btn");

  const codeInput = document.getElementById("input-code");
  const gradeSelect = document.getElementById("input-grade");
  const subjectSelect = document.getElementById("input-subject");
  const correctAnswerSelect = document.getElementById("input-correct-answer");
  const addBtn = document.getElementById("add-btn");
  const tableBody = document.getElementById("question-table-body");

  // Khởi tạo TinyMCE
  tinymce.init({
    selector: '#input-text',
    menubar: false,
    height: 200
  });

  // Tải danh sách câu hỏi từ API
  async function fetchQuestions() {
    try {
      const response = await fetch(API_URL);
      const questions = await response.json();
      renderQuestions(questions);
    } catch (err) {
      console.error("Lỗi khi tải câu hỏi:", err);
    }
  }

  // Hiển thị danh sách câu hỏi
  function renderQuestions(questions) {
    tableBody.innerHTML = "";

    questions.forEach((q, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${q.code}</td>
        <td>${q.content}</td>
        <td>${q.grade}</td>
        <td>${q.subject}</td>
        <td>${q.correctAnswer || ''}</td>
        <td><button class="status-btn">${q.status ? 'ON' : 'OFF'}</button></td>
        <td><button class="edit-btn">✏️</button></td>
        <td><button class="delete-btn">🗑️</button></td>
      `;
      tableBody.appendChild(tr);

      // Xoá
      const deleteBtn = tr.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Bạn có chắc muốn xoá câu hỏi này?")) {
          try {
            const response = await fetch(`${API_URL}/${q._id}`, {
              method: "DELETE",
            });

            if (!response.ok) throw new Error("Lỗi xoá");

            alert("Đã xoá câu hỏi.");
            fetchQuestions(); // tải lại
          } catch (err) {
            console.error(err);
            alert("Xoá thất bại!");
          }
        }
      });
    });
  }

  // Thêm câu hỏi mới
  addBtn.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    const text = tinymce.get("input-text").getContent().trim();
    const grade = gradeSelect.value || "Lớp 10";
    const subject = subjectSelect.value;
    const correctAnswer = correctAnswerSelect.value;
    const status = true;

    if (!code || !text || !correctAnswer) {
      alert("Vui lòng nhập đầy đủ thông tin: mã, câu hỏi và đáp án đúng!");
      return;
    }

    const newQuestion = {
      code,
      content: text,
      grade,
      subject,
      correctAnswer,
      status
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (!response.ok) throw new Error("Lỗi khi thêm câu hỏi");

      alert("Đã thêm câu hỏi thành công!");
      modal.style.display = "none";
      codeInput.value = "";
      correctAnswerSelect.value = "";
      tinymce.get("input-text").setContent("");
      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert("Thêm thất bại!");
    }
  });

  // Mở/Đóng modal
  openBtn.onclick = () => modal.style.display = "block";
  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  // Tìm kiếm
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(keyword) ? "" : "none";
    });
  });

  // Tải dữ liệu ban đầu
  fetchQuestions();
});
