// Biến toàn cục
let localStream = null;
let remoteStream = null;
let screenStream = null;
let socket = null;
let device = null;
let producerTransport = null;
let consumerTransport = null;
let producers = new Map();
let consumers = new Map();

// Xử lý tham số URL
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    meetingId: urlParams.get('id') || generateRandomMeetingId(),
    className: urlParams.get('class') || 'Cuộc họp',
    teacherName: urlParams.get('teacher') || 'Giáo viên'
  };
}

// Tạo ID cuộc họp ngẫu nhiên nếu không có
function generateRandomMeetingId() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Tạo 3 nhóm, mỗi nhóm 3 ký tự
  for (let group = 0; group < 3; group++) {
    for (let i = 0; i < 3; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    if (group < 2) {
      result += '-';
    }
  }
  
  return result;
}

// Cập nhật thông tin cuộc họp
function updateMeetingInfo() {
  const { meetingId, className, teacherName } = getUrlParameters();
  
  // Cập nhật ID cuộc họp
  const meetingIdElement = document.getElementById('meetingIdValue');
  if (meetingIdElement) {
    meetingIdElement.textContent = meetingId;
  }
  
  // Cập nhật tiêu đề trang
  document.title = `${className} - Video Meeting`;
  
  // Cập nhật tên cuộc họp nếu có phần tử
  const meetingTitleElement = document.querySelector('.header h1');
  if (meetingTitleElement) {
    meetingTitleElement.textContent = className;
  }
  
  // Lưu thông tin vào localStorage để sử dụng sau này
  localStorage.setItem('lastMeetingId', meetingId);
  localStorage.setItem('lastClassName', className);
  localStorage.setItem('lastTeacherName', teacherName);
  
  return { meetingId, className, teacherName };
}

// Các phần tử DOM
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const screenShareVideo = document.getElementById('screenShareVideo');
const sidebarLocalVideo = document.getElementById('sidebarLocalVideo');
const sidebarRemoteVideo = document.getElementById('sidebarRemoteVideo');
const defaultLayout = document.getElementById('defaultLayout');
const screenSharingLayout = document.getElementById('screenSharingLayout');
const serverErrorMessage = document.getElementById('serverErrorMessage');
const micBtn = document.getElementById('micBtn');
const cameraBtn = document.getElementById('cameraBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const chatBtn = document.getElementById('chatBtn');
const participantsBtn = document.getElementById('participantsBtn');
const layoutToggleBtn = document.getElementById('layoutToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const checkServerBtn = document.getElementById('checkServerBtn');
const leaveBtn = document.getElementById('leaveBtn');
const copyMeetingIdBtn = document.getElementById('copyMeetingIdBtn');
const meetingIdValue = document.getElementById('meetingIdValue');

// Khởi tạo luồng video cục bộ
async function initLocalStream() {
  try {
    // Hiển thị thông báo yêu cầu quyền truy cập
    const permissionOverlay = document.createElement('div');
    permissionOverlay.className = 'permission-overlay';
    permissionOverlay.innerHTML = `
      <div class="permission-dialog">
        <i class="fas fa-video"></i>
        <p>Đang yêu cầu quyền truy cập camera và microphone...</p>
      </div>
    `;
    document.body.appendChild(permissionOverlay);
    
    console.log('Đang yêu cầu quyền truy cập media...');
    
    // Yêu cầu quyền truy cập với timeout
    const streamPromise = navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });
    
    // Đặt timeout 10 giây
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout requesting media permissions')), 10000);
    });
    
    // Chạy đua giữa yêu cầu quyền và timeout
    localStream = await Promise.race([streamPromise, timeoutPromise]);
    
    console.log('Đã nhận được luồng media với tracks:', 
      localStream.getTracks().map(t => `${t.kind}:${t.label}`).join(', '));
    
    // Xóa overlay khi đã có quyền
    document.body.removeChild(permissionOverlay);
    
    // Hiển thị video cục bộ - đảm bảo thẻ video tồn tại
    if (localVideo) {
      localVideo.srcObject = localStream;
      localVideo.onloadedmetadata = () => {
        console.log('Local video metadata loaded, playing...');
        localVideo.play().catch(e => console.error('Error playing local video:', e));
      };
    } else {
      console.error('Không tìm thấy thẻ localVideo trong DOM');
    }
    
    if (sidebarLocalVideo) {
      sidebarLocalVideo.srcObject = localStream;
      sidebarLocalVideo.onloadedmetadata = () => {
        console.log('Sidebar local video metadata loaded, playing...');
        sidebarLocalVideo.play().catch(e => console.error('Error playing sidebar local video:', e));
      };
    }
    
    // Thêm sự kiện để xử lý khi track bị tắt
    localStream.getTracks().forEach(track => {
      track.addEventListener('ended', () => {
        console.log(`Track ${track.kind} ended`);
        // Hiển thị thông báo nếu camera bị tắt
        if (track.kind === 'video') {
          showNotification('Camera đã bị tắt', 'warning');
          cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
          cameraBtn.classList.remove('active');
        }
      });
    });
    
    console.log('Local stream initialized successfully');
    return localStream;
    
  } catch (err) {
    console.error('Error getting local media:', err);
    
    // Xóa overlay nếu có lỗi
    const overlay = document.querySelector('.permission-overlay');
    if (overlay) document.body.removeChild(overlay);
    
    // Hiển thị thông báo lỗi cụ thể
    if (err.name === 'NotAllowedError') {
      showNotification('Bạn đã từ chối quyền truy cập camera hoặc microphone', 'error');
      showCameraPermissionHelp();
    } else if (err.name === 'NotFoundError') {
      showNotification('Không tìm thấy camera hoặc microphone', 'error');
    } else if (err.name === 'NotReadableError') {
      showNotification('Camera hoặc microphone đang được sử dụng bởi ứng dụng khác', 'error');
    } else if (err.message === 'Timeout requesting media permissions') {
      showNotification('Hết thời gian chờ cấp quyền. Vui lòng làm mới trang', 'error');
    } else {
      showNotification('Không thể truy cập camera hoặc microphone: ' + err.message, 'error');
    }
    
    // Hiển thị placeholder cho video cục bộ
    if (localVideo) showVideoPlaceholder(localVideo, 'Không có video');
    if (sidebarLocalVideo) showVideoPlaceholder(sidebarLocalVideo, 'Không có video');
    
    throw err;
  }
}

// Giả lập video từ xa (chỉ để demo)
function simulateRemoteVideo() {
  // Tạo canvas để vẽ video giả lập
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Vẽ nền
  ctx.fillStyle = '#3c4043';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Vẽ avatar
  ctx.fillStyle = '#4285f4';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 40, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // Vẽ hình người
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 60, 25, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - 35);
  ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'white';
  ctx.stroke();
  
  // Vẽ thông báo
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Đang chờ người tham gia khác...', canvas.width / 2, canvas.height / 2 + 80);
  
  // Tạo stream từ canvas
  const fakeStream = canvas.captureStream(1);
  
  // Gán stream cho video từ xa
  remoteVideo.srcObject = fakeStream;
  sidebarRemoteVideo.srcObject = fakeStream;
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
    <button class="close-btn"><i class="fas fa-times"></i></button>
  `;
  
  document.body.appendChild(notification);
  
  // Hiệu ứng hiển thị
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Tự động đóng sau 5 giây
  const timeout = setTimeout(() => {
    closeNotification(notification);
  }, 5000);
  
  // Xử lý sự kiện đóng
  const closeBtn = notification.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    clearTimeout(timeout);
    closeNotification(notification);
  });
}

// Đóng thông báo
function closeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Hiển thị hướng dẫn cấp quyền camera
function showCameraPermissionHelp() {
  const helpDialog = document.createElement('div');
  helpDialog.className = 'help-dialog';
  helpDialog.innerHTML = `
    <div class="help-content">
      <h3>Hướng dẫn cấp quyền camera</h3>
      <p>Để sử dụng tính năng video meeting, bạn cần cấp quyền truy cập camera và microphone:</p>
      <ol>
        <li>Nhấp vào biểu tượng <i class="fas fa-lock"></i> hoặc <i class="fas fa-info-circle"></i> ở thanh địa chỉ</li>
        <li>Chọn "Quyền truy cập" hoặc "Cài đặt trang web"</li>
        <li>Đảm bảo Camera và Microphone được đặt thành "Cho phép"</li>
        <li>Làm mới trang web</li>
      </ol>
      <div class="browser-icons">
        <div><i class="fab fa-chrome"></i> Chrome</div>
        <div><i class="fab fa-firefox"></i> Firefox</div>
        <div><i class="fab fa-edge"></i> Edge</div>
        <div><i class="fab fa-safari"></i> Safari</div>
      </div>
      <div class="help-buttons">
        <button id="refreshPageBtn" class="primary-btn">Làm mới trang</button>
        <button id="closeHelpBtn" class="secondary-btn">Đóng</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(helpDialog);
  
  // Xử lý sự kiện nút
  document.getElementById('refreshPageBtn').addEventListener('click', () => {
    window.location.reload();
  });
  
  document.getElementById('closeHelpBtn').addEventListener('click', () => {
    document.body.removeChild(helpDialog);
  });
}

// Hiển thị placeholder cho video
function showVideoPlaceholder(videoElement, message) {
  // Tạo canvas để vẽ placeholder
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Vẽ nền
  ctx.fillStyle = '#3c4043';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Vẽ biểu tượng camera tắt
  ctx.fillStyle = '#ea4335';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 40, 50, 0, Math.PI * 2);
  ctx.fill();
  
  // Vẽ biểu tượng camera tắt
  ctx.fillStyle = '#3c4043';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2 - 50);
  ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2 - 50);
  ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2 - 30);
  ctx.lineTo(canvas.width / 2 - 20, canvas.height / 2 - 30);
  ctx.closePath();
  ctx.fill();
  
  // Vẽ đường gạch chéo
  ctx.strokeStyle = '#3c4043';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 30, canvas.height / 2 - 70);
  ctx.lineTo(canvas.width / 2 + 30, canvas.height / 2 - 10);
  ctx.stroke();
  
  // Vẽ thông báo
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 50);
  
  // Tạo stream từ canvas
  const placeholderStream = canvas.captureStream(1);
  
  // Gán stream cho video
  videoElement.srcObject = placeholderStream;
}

// Kích hoạt các nút điều khiển
function activateControls() {
  // Nút microphone
  micBtn.addEventListener('click', () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        micBtn.innerHTML = audioTrack.enabled ? 
          '<i class="fas fa-microphone"></i>' : 
          '<i class="fas fa-microphone-slash"></i>';
        micBtn.classList.toggle('active', audioTrack.enabled);
        
        showNotification(
          audioTrack.enabled ? 'Đã bật microphone' : 'Đã tắt microphone', 
          audioTrack.enabled ? 'info' : 'warning'
        );
      }
    }
  });
  
  // Nút camera
  cameraBtn.addEventListener('click', () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        cameraBtn.innerHTML = videoTrack.enabled ? 
          '<i class="fas fa-video"></i>' : 
          '<i class="fas fa-video-slash"></i>';
        cameraBtn.classList.toggle('active', videoTrack.enabled);
        
        showNotification(
          videoTrack.enabled ? 'Đã bật camera' : 'Đã tắt camera', 
          videoTrack.enabled ? 'info' : 'warning'
        );
      }
    }
  });
  
  // Nút chia sẻ màn hình
  screenShareBtn.addEventListener('click', async () => {
    if (!screenStream) {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });
        
        screenShareVideo.srcObject = screenStream;
        defaultLayout.classList.add('hidden');
        screenSharingLayout.classList.remove('hidden');
        screenShareBtn.classList.add('active');
        
        // Xử lý khi người dùng dừng chia sẻ màn hình
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          stopScreenSharing();
        });
        
        showNotification('Đã bắt đầu chia sẻ màn hình', 'info');
      } catch (err) {
        console.error('Error sharing screen:', err);
        showNotification('Không thể chia sẻ màn hình: ' + err.message, 'error');
      }
    } else {
      stopScreenSharing();
    }
  });
  
  // Nút thoát
  leaveBtn.addEventListener('click', () => {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'help-dialog';
    confirmDialog.innerHTML = `
      <div class="help-content">
        <h3>Thoát cuộc họp</h3>
        <p>Bạn có chắc chắn muốn thoát khỏi cuộc họp này?</p>
        <div class="help-buttons">
          <button id="confirmLeaveBtn" class="primary-btn danger">Thoát</button>
          <button id="cancelLeaveBtn" class="secondary-btn">Hủy</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmDialog);
    
    document.getElementById('confirmLeaveBtn').addEventListener('click', () => {
      // Dừng tất cả các stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      // Đóng kết nối socket nếu có
      if (socket) {
        socket.disconnect();
      }
      
      // Chuyển hướng về trang chủ
      window.location.href = '/';
    });
    
    document.getElementById('cancelLeaveBtn').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
    });
  });
  
  // Nút kiểm tra server
  checkServerBtn.addEventListener('click', () => {
    checkServerConnection();
  });
  
  // Nút sao chép ID cuộc họp
  copyMeetingIdBtn.addEventListener('click', () => {
    const meetingId = meetingIdValue.textContent;
    navigator.clipboard.writeText(meetingId)
      .then(() => {
        showNotification('Đã sao chép ID cuộc họp', 'info');
      })
      .catch(err => {
        console.error('Error copying meeting ID:', err);
        showNotification('Không thể sao chép ID cuộc họp', 'error');
      });
  });
  
  // Nút toàn màn hình
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        showNotification('Không thể chuyển sang chế độ toàn màn hình: ' + err.message, 'error');
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });
  
  // Nút chuyển đổi bố cục
  layoutToggleBtn.addEventListener('click', () => {
    // Chỉ chuyển đổi khi không đang chia sẻ màn hình
    if (!screenStream) {
      const pipVideo = document.querySelector('.pip-video-container');
      pipVideo.classList.toggle('large');
      
      showNotification('Đã chuyển đổi bố cục', 'info');
    }
  });
}

// Dừng chia sẻ màn hình
function stopScreenSharing() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
    screenShareVideo.srcObject = null;
    defaultLayout.classList.remove('hidden');
    screenSharingLayout.classList.add('hidden');
    screenShareBtn.classList.remove('active');
    
    showNotification('Đã dừng chia sẻ màn hình', 'info');
  }
}

// Kiểm tra kết nối server
function checkServerConnection() {
  // Hiển thị thông báo đang kiểm tra
  showNotification('Đang kiểm tra kết nối đến máy chủ...', 'info');
  
  // Thử kết nối đến server
  const testSocket = io("http://localhost:8080", {
    timeout: 5000,
    reconnection: false
  });
  
  testSocket.on('connect', () => {
    showNotification('Kết nối đến máy chủ thành công', 'info');
    testSocket.disconnect();
    serverErrorMessage.classList.add('hidden');
  });
  
  testSocket.on('connect_error', (err) => {
    console.error('Server connection error:', err);
    showNotification('Không thể kết nối đến máy chủ', 'error');
    serverErrorMessage.classList.remove('hidden');
  });
}

// Thêm tooltip cho các nút
function addTooltip(element, text) {
  if (!element) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip hidden';
  tooltip.textContent = text;
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px 10px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '1000';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.whiteSpace = 'nowrap';
  tooltip.style.transition = 'opacity 0.2s';
  
  document.body.appendChild(tooltip);
  
  element.addEventListener('mouseenter', () => {
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    tooltip.classList.remove('hidden');
  });
  
  element.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
  });
}

// Làm cho video PIP có thể kéo thả
function makePipDraggable() {
  const pipVideo = document.querySelector('.pip-video-container');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  pipVideo.addEventListener('mousedown', dragStart);
  pipVideo.addEventListener('mouseup', dragEnd);
  pipVideo.addEventListener('mousemove', drag);
  
  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === pipVideo || pipVideo.contains(e.target)) {
      isDragging = true;
      pipVideo.classList.add('dragging');
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    pipVideo.classList.remove('dragging');
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, pipVideo);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
}

// Thêm tính năng mời người tham gia
function addInviteFeature() {
  // Tạo nút mời
  const inviteBtn = document.createElement('button');
  inviteBtn.id = 'inviteBtn';
  inviteBtn.className = 'control-btn';
  inviteBtn.innerHTML = '<i class="fas fa-user-plus"></i>';
  inviteBtn.title = 'Mời người tham gia';
  
  // Chèn nút vào thanh điều khiển trước nút thoát
  const controlsBar = document.querySelector('.controls-bar');
  controlsBar.insertBefore(inviteBtn, leaveBtn);
  
  // Xử lý sự kiện click
  inviteBtn.addEventListener('click', () => {
    const inviteDialog = document.createElement('div');
    inviteDialog.className = 'help-dialog';
    inviteDialog.innerHTML = `
      <div class="help-content">
        <h3>Mời người tham gia</h3>
        <p>Chia sẻ liên kết này để mời người khác tham gia cuộc họp:</p>
        <div class="invite-link-container">
          <input type="text" id="inviteLink" readonly value="${window.location.href}">
          <button id="copyInviteLinkBtn" class="primary-btn"><i class="fas fa-copy"></i></button>
        </div>
        <p>Hoặc chia sẻ ID cuộc họp: <strong>${meetingIdValue.textContent}</strong></p>
        <div class="help-buttons">
          <button id="closeInviteBtn" class="secondary-btn">Đóng</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(inviteDialog);
    
    // Xử lý sự kiện sao chép liên kết
    document.getElementById('copyInviteLinkBtn').addEventListener('click', () => {
      const inviteLink = document.getElementById('inviteLink');
      inviteLink.select();
      document.execCommand('copy');
      
      showNotification('Đã sao chép liên kết mời', 'info');
    });
    
    // Xử lý sự kiện đóng
    document.getElementById('closeInviteBtn').addEventListener('click', () => {
      document.body.removeChild(inviteDialog);
    });
  });
}

// Thêm CSS động
function addDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: -350px;
      width: 300px;
      padding: 15px;
      background-color: #2c2c2c;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 2000;
      transition: right 0.3s ease;
    }
    
    .notification.show {
      right: 20px;
    }
    
    .notification.error {
      border-left: 4px solid #ea4335;
    }
    
    .notification.warning {
      border-left: 4px solid #fbbc04;
    }
    
    .notification.info {
      border-left: 4px solid #4285f4;
    }
    
    .notification i {
      font-size: 20px;
    }
    
    .notification.error i {
      color: #ea4335;
    }
    
    .notification.warning i {
      color: #fbbc04;
    }
    
    .notification.info i {
      color: #4285f4;
    }
    
    .notification span {
      flex: 1;
    }
    
    .notification .close-btn {
      background: none;
      border: none;
      color: #aaa;
      cursor: pointer;
      font-size: 16px;
    }
    
    .notification .close-btn:hover {
      color: white;
    }
    
    .permission-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    
    .permission-dialog {
      background-color: #2c2c2c;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
    }
    
    .permission-dialog i {
      font-size: 48px;
      color: #4285f4;
      margin-bottom: 20px;
    }
    
    .help-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    
    .help-content {
      background-color: #2c2c2c;
      padding: 30px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    }
    
    .help-content h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: white;
    }
    
    .help-content p {
      margin-bottom: 15px;
      color: #aaa;
    }
    
    .help-content ol {
      margin-left: 20px;
      margin-bottom: 20px;
      color: #ddd;
    }
    
    .help-content li {
      margin-bottom: 10px;
    }
    
    .browser-icons {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    
    .browser-icons div {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #aaa;
    }
    
    .browser-icons i {
      font-size: 24px;
      margin-bottom: 5px;
      color: #ddd;
    }
    
    .help-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .primary-btn {
      background-color: #4285f4;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .primary-btn.danger {
      background-color: #ea4335;
    }
    
    .secondary-btn {
      background-color: #3c4043;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .invite-link-container {
      display: flex;
      margin: 15px 0;
    }
    
    .invite-link-container input {
      flex: 1;
      padding: 10px;
      border: 1px solid #3c4043;
      border-radius: 4px 0 0 4px;
      background-color: #202124;
      color: white;
    }
    
    .invite-link-container button {
      border-radius: 0 4px 4px 0;
      padding: 10px 15px;
    }
    
    .hidden {
      display: none !important;
    }
    
    .pip-video-container {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 240px;
      height: 135px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      z-index: 100;
      transition: transform 0.3s ease;
      cursor: move;
    }
    
    .pip-video-container.large {
      width: 320px;
      height: 180px;
    }
    
    .pip-video-container.dragging {
      opacity: 0.8;
    }
  `;
  
  document.head.appendChild(style);
}

// Thêm hàm kiểm tra và gỡ lỗi
function troubleshootVideoMeeting() {
  console.log('=== BẮT ĐẦU KIỂM TRA VIDEO MEETING ===');
  
  // 1. Kiểm tra thẻ video có tồn tại trong DOM không
  console.log('1. Kiểm tra các thẻ video:');
  const videoElements = {
    localVideo: document.getElementById('localVideo'),
    remoteVideo: document.getElementById('remoteVideo'),
    screenShareVideo: document.getElementById('screenShareVideo'),
    sidebarLocalVideo: document.getElementById('sidebarLocalVideo'),
    sidebarRemoteVideo: document.getElementById('sidebarRemoteVideo')
  };
  
  Object.entries(videoElements).forEach(([name, element]) => {
    if (!element) {
      console.error(`- Thẻ ${name} không tồn tại trong DOM`);
    } else {
      const style = window.getComputedStyle(element);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      console.log(`- Thẻ ${name}: ${element.tagName}, visible: ${isVisible}, size: ${element.width}x${element.height}`);
      
      // Kiểm tra srcObject
      if (element.srcObject) {
        console.log(`  + srcObject đã được gán, tracks: ${element.srcObject.getTracks().length}`);
      } else {
        console.warn(`  + srcObject chưa được gán`);
      }
    }
  });
  
  // 2. Kiểm tra quyền truy cập media
  console.log('2. Kiểm tra quyền truy cập media:');
  navigator.permissions.query({name: 'camera'})
    .then(cameraPermission => {
      console.log(`- Camera permission: ${cameraPermission.state}`);
      
      navigator.permissions.query({name: 'microphone'})
        .then(micPermission => {
          console.log(`- Microphone permission: ${micPermission.state}`);
          
          // Nếu quyền bị từ chối, hiển thị hướng dẫn
          if (cameraPermission.state === 'denied' || micPermission.state === 'denied') {
            console.error('Quyền truy cập camera/microphone bị từ chối');
            showCameraPermissionHelp();
          }
        });
    })
    .catch(err => {
      console.warn('Không thể kiểm tra quyền truy cập:', err);
    });
  
  // 3. Kiểm tra localStream
  console.log('3. Kiểm tra localStream:');
  if (localStream) {
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    
    console.log(`- localStream có ${videoTracks.length} video tracks và ${audioTracks.length} audio tracks`);
    
    if (videoTracks.length > 0) {
      const videoTrack = videoTracks[0];
      console.log(`- Video track: enabled=${videoTrack.enabled}, readyState=${videoTrack.readyState}`);
      console.log(`- Video settings:`, videoTrack.getSettings());
    }
    
    if (audioTracks.length > 0) {
      const audioTrack = audioTracks[0];
      console.log(`- Audio track: enabled=${audioTrack.enabled}, readyState=${audioTrack.readyState}`);
    }
  } else {
    console.error('- localStream chưa được khởi tạo');
    
    // Thử khởi tạo lại localStream
    console.log('- Đang thử khởi tạo lại localStream...');
    initLocalStream()
      .then(() => console.log('- Đã khởi tạo lại localStream thành công'))
      .catch(err => console.error('- Khởi tạo lại localStream thất bại:', err));
  }
  
  // 4. Kiểm tra kết nối socket
  console.log('4. Kiểm tra kết nối socket:');
  if (socket) {
    console.log(`- Socket ID: ${socket.id}`);
    console.log(`- Socket connected: ${socket.connected}`);
    
    if (!socket.connected) {
      console.warn('- Socket chưa kết nối, đang thử kết nối lại...');
      socket.connect();
    }
  } else {
    console.error('- Socket chưa được khởi tạo');
    
    // Thử khởi tạo lại socket
    console.log('- Đang thử khởi tạo lại socket...');
    socket = io("http://localhost:8080", {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10
    });
    
    socket.on('connect', () => {
      console.log('- Socket đã kết nối lại thành công');
    });
    
    socket.on('connect_error', (err) => {
      console.error('- Lỗi kết nối socket:', err);
      serverErrorMessage.classList.remove('hidden');
    });
  }
  
  // 5. Kiểm tra mediasoup device
  console.log('5. Kiểm tra mediasoup device:');
  if (device) {
    console.log(`- Device loaded: ${device.loaded}`);
    if (device.loaded) {
      console.log(`- Can produce video: ${device.canProduce('video')}`);
      console.log(`- Can produce audio: ${device.canProduce('audio')}`);
    }
  } else {
    console.warn('- Mediasoup device chưa được khởi tạo');
  }
  
  console.log('=== KẾT THÚC KIỂM TRA ===');
  
  // Hiển thị kết quả kiểm tra cho người dùng
  showTroubleshootingResults();
}

// Hiển thị kết quả kiểm tra cho người dùng
function showTroubleshootingResults() {
  const troubleshootDialog = document.createElement('div');
  troubleshootDialog.className = 'help-dialog';
  troubleshootDialog.innerHTML = `
    <div class="help-content">
      <h3>Kết quả kiểm tra</h3>
      <ul class="troubleshoot-results">
        <li class="${localVideo.srcObject ? 'success' : 'error'}">
          <i class="fas ${localVideo.srcObject ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          <span>Video cục bộ: ${localVideo.srcObject ? 'Đã hiển thị' : 'Chưa hiển thị'}</span>
        </li>
        <li class="${localStream ? 'success' : 'error'}">
          <i class="fas ${localStream ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          <span>Luồng media cục bộ: ${localStream ? 'Đã khởi tạo' : 'Chưa khởi tạo'}</span>
        </li>
        <li class="${socket && socket.connected ? 'success' : 'error'}">
          <i class="fas ${socket && socket.connected ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          <span>Kết nối socket: ${socket && socket.connected ? 'Đã kết nối' : 'Chưa kết nối'}</span>
        </li>
        <li class="${device && device.loaded ? 'success' : 'error'}">
          <i class="fas ${device && device.loaded ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          <span>Mediasoup device: ${device && device.loaded ? 'Đã khởi tạo' : 'Chưa khởi tạo'}</span>
        </li>
      </ul>
      
      <div class="troubleshoot-actions">
        <button id="refreshMediaBtn" class="primary-btn">Làm mới media</button>
        <button id="reconnectSocketBtn" class="primary-btn">Kết nối lại server</button>
        <button id="closeDialogBtn" class="secondary-btn">Đóng</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(troubleshootDialog);
  
  // Thêm CSS cho dialog
  const style = document.createElement('style');
  style.textContent = `
    .troubleshoot-results {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    
    .troubleshoot-results li {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
    }
    
    .troubleshoot-results li.success {
      background-color: rgba(0, 200, 0, 0.1);
    }
    
    .troubleshoot-results li.error {
      background-color: rgba(255, 0, 0, 0.1);
    }
    
    .troubleshoot-results i {
      margin-right: 10px;
      font-size: 18px;
    }
    
    .troubleshoot-results i.fa-check-circle {
      color: #4CAF50;
    }
    
    .troubleshoot-results i.fa-times-circle {
      color: #F44336;
    }
    
    .troubleshoot-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }
  `;
  
  document.head.appendChild(style);
  
  // Xử lý sự kiện nút
  document.getElementById('refreshMediaBtn').addEventListener('click', async () => {
    try {
      // Dừng luồng hiện tại nếu có
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Khởi tạo lại luồng
      await initLocalStream();
      
      showNotification('Đã làm mới media thành công', 'success');
      document.body.removeChild(troubleshootDialog);
    } catch (err) {
      console.error('Lỗi khi làm mới media:', err);
      showNotification('Không thể làm mới media: ' + err.message, 'error');
    }
  });
  
  document.getElementById('reconnectSocketBtn').addEventListener('click', () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
      showNotification('Đang kết nối lại với server...', 'info');
    } else {
      socket = io("http://localhost:8080");
      showNotification('Đang tạo kết nối mới đến server...', 'info');
    }
    
    document.body.removeChild(troubleshootDialog);
  });
  
  document.getElementById('closeDialogBtn').addEventListener('click', () => {
    document.body.removeChild(troubleshootDialog);
  });
}

// Thêm nút kiểm tra vào thanh điều khiển
function addTroubleshootButton() {
  const controlsContainer = document.querySelector('.controls-container');
  
  if (!controlsContainer) return;
  
  const troubleshootBtn = document.createElement('button');
  troubleshootBtn.id = 'troubleshootBtn';
  troubleshootBtn.className = 'control-btn';
  troubleshootBtn.innerHTML = '<i class="fas fa-bug"></i>';
  troubleshootBtn.title = 'Kiểm tra và khắc phục sự cố';
  
  controlsContainer.insertBefore(troubleshootBtn, document.getElementById('leaveBtn'));
  
  troubleshootBtn.addEventListener('click', troubleshootVideoMeeting);
}

// Thêm hàm kiểm tra tự động khi trang được tải
window.addEventListener('load', function() {
  console.log('Trang đã tải xong, kiểm tra môi trường...');
  
  // Kiểm tra trình duyệt hỗ trợ getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('Trình duyệt không hỗ trợ getUserMedia API');
    showNotification('Trình duyệt của bạn không hỗ trợ video call. Vui lòng sử dụng Chrome, Firefox, Safari hoặc Edge phiên bản mới nhất.', 'error');
    return;
  }
  
  // Kiểm tra trình duyệt hỗ trợ WebRTC
  if (!window.RTCPeerConnection) {
    console.error('Trình duyệt không hỗ trợ WebRTC');
    showNotification('Trình duyệt của bạn không hỗ trợ WebRTC. Vui lòng sử dụng Chrome, Firefox, Safari hoặc Edge phiên bản mới nhất.', 'error');
    return;
  }
  
  // Kiểm tra trình duyệt hỗ trợ Mediasoup
  if (!window.mediasoupClient) {
    console.error('Không tìm thấy thư viện mediasoup-client');
    showNotification('Không thể tải thư viện mediasoup-client. Vui lòng làm mới trang.', 'error');
    return;
  }
  
  console.log('Môi trường hỗ trợ đầy đủ các API cần thiết');
  
  // Kiểm tra các thẻ video
  const videoElements = [
    { id: 'localVideo', name: 'Video cục bộ' },
    { id: 'remoteVideo', name: 'Video từ xa' },
    { id: 'screenShareVideo', name: 'Video chia sẻ màn hình' },
    { id: 'sidebarLocalVideo', name: 'Video cục bộ (sidebar)' },
    { id: 'sidebarRemoteVideo', name: 'Video từ xa (sidebar)' }
  ];
  
  let missingElements = [];
  
  videoElements.forEach(element => {
    const el = document.getElementById(element.id);
    if (!el) {
      console.error(`Không tìm thấy thẻ ${element.id}`);
      missingElements.push(element.name);
    }
  });
  
  if (missingElements.length > 0) {
    showNotification(`Thiếu các thẻ video: ${missingElements.join(', ')}`, 'error');
  }
});

// Khởi tạo ứng dụng khi trang đã tải xong
window.addEventListener('DOMContentLoaded', () => {
  // Thêm CSS động
  addDynamicStyles();
  
  // Khởi tạo luồng video cục bộ
  initLocalStream();
  
  // Giả lập video từ xa (trong trường hợp không có kết nối thực)
  simulateRemoteVideo();
  
  // Kích hoạt các nút điều khiển
  activateControls();
  
  // Thêm sự kiện kéo thả cho video PIP
  makePipDraggable();
  
  // Thêm tính năng mời người tham gia
  addInviteFeature();
  
  // Thêm nút kiểm tra
  setTimeout(addTroubleshootButton, 1000);
  
  // Tự động kiểm tra nếu có vấn đề
  setTimeout(() => {
    if (!localStream || !localVideo.srcObject) {
      console.warn('Phát hiện vấn đề với video cục bộ, tự động kiểm tra...');
      troubleshootVideoMeeting();
    }
  }, 5000);
});
