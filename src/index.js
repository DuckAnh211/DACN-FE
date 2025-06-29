import { Device } from 'mediasoup-client';
import { io } from 'socket.io-client';

// Kết nối tới server (đổi URL nếu cần)
const socket = io('http://localhost:3000');

// Xử lý nút "Tham gia"
document.getElementById('join-button').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const roomId = document.getElementById('room-id').value;

  if (!username || !roomId) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  // Ví dụ: gửi yêu cầu join room tới server qua socket
  socket.emit('joinRoom', { username, roomId }, async (data) => {
    // data.rtpCapabilities từ server
    const device = new Device();
    await device.load({ routerRtpCapabilities: data.rtpCapabilities });
    // Tiếp tục logic tạo transport, produce, consume...
    console.log('Đã load device với rtpCapabilities:', data.rtpCapabilities);
  });
});
