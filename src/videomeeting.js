import * as mediasoupClient from 'mediasoup-client';

// Global variables
let socket;
let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport;
let videoProducer;
let audioProducer;
let screenShareProducer;
let consumers = [];
let consumerTransports = []; 
let isProducing = false;

// DOM elements
const localVideo = document.getElementById('localVideo');
const mainVideoArea = document.getElementById('mainVideoArea');
const mainScreenShare = document.getElementById('mainScreenShare');
const screenShareArea = document.getElementById('screenShareArea');
const videoGrid = document.getElementById('videoGrid');
const participantsVideoArea = document.getElementById('participantsVideoArea'); // Khu vực hiển thị webcam người tham gia
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const chatBtn = document.getElementById('chatBtn');
const leaveBtn = document.getElementById('leaveBtn');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messages = document.getElementById('messages');
const roomCode = document.getElementById('roomCode');
const copyBtn = document.getElementById('copyBtn');
const participantsBtn = document.getElementById('participantsBtn');
const participantsPanel = document.getElementById('participantsPanel');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');


// Get room ID và thông tin người dùng từ URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || urlParams.get('id') || generateRandomString(6);
const userName = urlParams.get('teacher') || urlParams.get('student') || urlParams.get('name') || 'Ẩn danh';
roomCode.textContent = roomId;

// Initialize the application
async function init() {
  // Connect to socket.io server
  socket = io('http://localhost:8080', {
    query: { roomId }
  });

  // Gửi tên lên server
  socket.emit('joinRoom', { name: userName });

  // Set up socket event listeners
  setupSocketListeners();
  
  // Get local media stream
  await getLocalStream();
  
  // Load mediasoup device
  await loadDevice();
  
  // Set up UI event listeners
  setupUIListeners();
}


// --- Helper functions (đặt trước khi đăng ký event socket) ---
function moveRemoteCameraToParticipants(socketId) {
  // Đảm bảo camera của người chia sẻ nằm ở participants area
  let videoEl = document.getElementById(`participant-${socketId}`);
  if (!videoEl) {
    videoEl = document.createElement('div');
    videoEl.className = 'participant-video-item';
    videoEl.id = `participant-${socketId}`;
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    const nameEl = document.createElement('div');
    nameEl.className = 'participant-name';
    nameEl.textContent = `User ${socketId.substring(0, 4)}`;
    videoEl.appendChild(video);
    videoEl.appendChild(nameEl);
    participantsVideoArea.appendChild(videoEl);
  }
}
function removeRemoteCameraFromParticipants(socketId) {
  const el = document.getElementById(`participant-${socketId}`);
  if (el) el.remove();
}
function showMainScreenShare() {
  if (mainScreenShare) {
    mainScreenShare.style.display = 'flex';
    mainScreenShare.classList.remove('hidden');
  }
  if (mainVideoArea) {
    mainVideoArea.style.display = 'none';
    mainVideoArea.classList.add('hidden');
  }
}
function hideMainScreenShare() {
  if (mainScreenShare) {
    mainScreenShare.style.display = 'none';
    mainScreenShare.classList.add('hidden');
  }
  if (mainVideoArea) {
    mainVideoArea.style.display = 'flex';
    mainVideoArea.classList.remove('hidden');
  }
}

// --- Đăng ký event socket chỉ 1 lần, sau khi đã có helper ---
function setupSocketListeners() {
  socket.on('connect', async () => {
    console.log('Connected to server');
    
    // Get RTP capabilities from the server
    socket.emit('getRtpCapabilities', {}, async (rtpCaps) => {
      rtpCapabilities = rtpCaps;
      await loadDevice();
    });
  });

  socket.on('new-producer', async ({ producerId, producerSocketId, kind, appData }) => {
  await consumeTrack(producerId, producerSocketId, kind, appData?.mediaType);
  });
  socket.on('existingProducers', async (producers) => {
    for (const { producerId, producerSocketId, kind, appData } of producers) {
    await consumeTrack(producerId, producerSocketId, kind, appData?.mediaType);
    }
  });
  
  socket.on('updateParticipants', (participants) => {
  participantsList.innerHTML = '';
  participantCount.textContent = participants.length;
  participants.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name ? p.name : `User ${p.id.substring(0, 4)}`;
    participantsList.appendChild(li);
  });
});

  socket.on('producer-closed', ({ remoteProducerId }) => {
    const producerToClose = consumers.find(consumer => consumer.producerId === remoteProducerId);
    if (producerToClose) {
      producerToClose.consumer.close();
      consumers = consumers.filter(consumer => consumer.producerId !== remoteProducerId);
      if (producerToClose.mediaType === 'screen') {
        // Xóa video screen share khỏi mainScreenShare
        const screenShareContainer = document.querySelector('.screen-share-container');
        if (screenShareContainer) screenShareContainer.innerHTML = '';
        hideMainScreenShare();
      } else {
        // Xóa camera khỏi participants area
        removeRemoteCameraFromParticipants(producerToClose.socketId);
      }
    }
  });

  socket.on('chat-message', (data) => {
    console.log('[DEBUG] Received chat message:', data);
    handleChatMessage(data);
  });
  
  // Lắng nghe các event name khác
  socket.on('message', (data) => {
    console.log('[DEBUG] Received message:', data);
    handleChatMessage(data);
  });
  
  socket.on('newMessage', (data) => {
    console.log('[DEBUG] Received newMessage:', data);
    handleChatMessage(data);
  });
  
  socket.on('receiveMessage', (data) => {
    console.log('[DEBUG] Received receiveMessage:', data);
    handleChatMessage(data);
  });
}
function updateParticipantsList(participants) {
  participantsList.innerHTML = '';
  participantCount.textContent = participants.length;
  participants.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name ? p.name : `User ${p.id.substring(0, 4)}`;
    participantsList.appendChild(li);
  });
}

// Xử lý chat message với các format khác nhau
function handleChatMessage(data) {
  let sender = 'Unknown';
  let message = '';
  
  // Xử lý các format khác nhau từ server
  if (data.sender && data.message) {
    sender = data.sender;
    message = data.message;
  } else if (data.name && data.message) {
    sender = data.name;
    message = data.message;
  } else if (data.sender && data.text) {
    sender = data.sender;
    message = data.text;
  } else if (data.name && data.text) {
    sender = data.name;
    message = data.text;
  } else if (typeof data === 'string') {
    message = data;
    sender = 'Anonymous';
  } else {
    console.warn('[WARN] Unknown chat message format:', data);
    return;
  }
  
  console.log(`[DEBUG] Processing message from: ${sender}`);
  
  // Luôn hiển thị message để test
  addMessageToChat(sender, message);
}


// Set up UI event listeners
function setupUIListeners() {
  micBtn.addEventListener('click', toggleMic);
  videoBtn.addEventListener('click', toggleVideo);
  screenShareBtn.addEventListener('click', toggleScreenShare);
  chatBtn.addEventListener('click', toggleChat);
  closeChatBtn.addEventListener('click', toggleChat);
  leaveBtn.addEventListener('click', leaveRoom);
  sendMessageBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  copyBtn.addEventListener('click', copyRoomCode);
  participantsBtn.addEventListener('click', () => {
  participantsPanel.classList.toggle('hidden');
});
}

// Get local media stream
async function getLocalStream() {
  try {
    console.log('[DEBUG] Requesting local media stream...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 }, 
      audio: true 
    });
    localVideo.srcObject = stream;
    await localVideo.play();
    
    // Store tracks for later use
    window.localStream = stream;
    console.log('[DEBUG] Local stream obtained successfully');
  } catch (error) {
    console.error('Error getting local stream:', error);
    alert('Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền truy cập.');
  }
}

// Load mediasoup device
async function loadDevice() {
  try {
    if (!rtpCapabilities) return;
    
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    
    console.log('Device loaded');
    await createSendTransport();
  } catch (error) {
    console.error('Error loading device:', error);
  }
}

// Create send transport
async function createSendTransport() {
  socket.emit('createWebRtcTransport', { sender: true }, async ({ params }) => {
    if (params.error) {
      console.error(params.error);
      return;
    }

    producerTransport = device.createSendTransport(params);

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.emit('transport-connect', {
          transportId: producerTransport.id,
          dtlsParameters
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const { producerId } = await new Promise((resolve, reject) => {
          socket.emit('transport-produce', {
            transportId: producerTransport.id,
            kind,
            rtpParameters,
            appData: appData || {}
          }, resolve);
        });
        
        callback({ id: producerId });
      } catch (error) {
        errback(error);
      }
    });

    // Once the transport is created, produce audio and video
    await produceVideo();
    await produceAudio();
  });
}

// Produce video
async function produceVideo() {
  if (!device.canProduce('video') || !window.localStream) return;

  const videoTrack = window.localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  videoProducer = await producerTransport.produce({
    track: videoTrack,
    encodings: [
      { maxBitrate: 100000 },
      { maxBitrate: 300000 },
      { maxBitrate: 900000 }
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000
    }
  });

  videoProducer.on('trackended', () => {
    console.log('Video track ended');
  });

  videoProducer.on('transportclose', () => {
    console.log('Video transport closed');
    videoProducer = null;
  });
}

// Produce audio
async function produceAudio() {
  if (!device.canProduce('audio') || !window.localStream) return;

  const audioTrack = window.localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  audioProducer = await producerTransport.produce({
    track: audioTrack,
    appData: { mediaType: 'audio' }
  });

  console.log('[DEBUG] Audio producer created:', audioProducer.id);

  audioProducer.on('trackended', () => {
    console.log('Audio track ended');
  });

  audioProducer.on('transportclose', () => {
    console.log('Audio transport closed');
    audioProducer = null;
  });
}

// Consume a remote track
async function consumeTrack(producerId, producerSocketId, kind, mediaType) {
  // Create a new transport for consuming
  socket.emit('createWebRtcTransport', { sender: false }, async ({ params }) => {
    if (!params || params.error) {
      console.error('[consumeTrack] Transport params error:', params && params.error);
      return;
    }

    const consumerTransport = device.createRecvTransport(params);
    consumerTransports.push(consumerTransport);

    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.emit('transport-connect', {
          transportId: consumerTransport.id,
          dtlsParameters
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    // Once the consumer transport is created, consume the track
    socket.emit('consume', {
      transportId: consumerTransport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    }, async ({ params }) => {
      if (!params || params.error) {
        console.error('[consumeTrack] Consume params error:', params && params.error);
        return;
      }

      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      });
      if (!consumer) {
        console.error('[consumeTrack] consumer is undefined');
        return;
      }

      consumers.push({
        consumer,
        socketId: producerSocketId,
        producerId,
        mediaType: mediaType
      });

      const { track } = consumer;
      console.log(`[DEBUG] Consuming ${kind} track from ${producerSocketId}, mediaType: ${mediaType}`);
      console.log('[DEBUG] Track state:', {
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      });

      // Resume consumer trước khi tạo video element
      socket.emit('consumer-resume', { consumerId: consumer.id });

      if (kind === 'video') {
        if (mediaType === 'screen') {
          createRemoteScreenShare(track, producerSocketId);
        } else {
          createRemoteVideo(track, producerSocketId, mediaType);
        }
      } else if (kind === 'audio') {
        // For audio tracks, add them to existing video elements or create audio element
        const videoEl = document.getElementById(`video-${producerSocketId}`);
        if (videoEl && videoEl.srcObject) {
          videoEl.srcObject.addTrack(track);
          videoEl.muted = false; // Enable audio for remote participants
        } else {
          // Create audio-only element if no video exists
          createRemoteAudio(track, producerSocketId);
        }
      }
    });
  });
}

// Create a remote video element
function createRemoteVideo(track, socketId, mediaType) {
  console.log(`[DEBUG] Creating remote video for ${socketId}, mediaType: ${mediaType}`);
  
  // Luôn add camera vào participants area
  let videoEl = document.getElementById(`participant-${socketId}`);
  if (!videoEl) {
    videoEl = document.createElement('div');
    videoEl.className = 'participant-video-item';
    videoEl.id = `participant-${socketId}`;
    const video = document.createElement('video');
    video.id = `video-${socketId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    const nameEl = document.createElement('div');
    nameEl.className = 'participant-name';
    nameEl.textContent = `User ${socketId.substring(0, 4)}`;
    videoEl.appendChild(video);
    videoEl.appendChild(nameEl);
    participantsVideoArea.appendChild(videoEl);
  }
  
  const video = videoEl.querySelector('video');
  let stream = video.srcObject;
  
  if (!stream) {
    stream = new MediaStream();
    video.srcObject = stream;
  }
  
  // Add track to existing stream
  stream.addTrack(track);
  
  video.play().catch(e => console.error('[ERROR] Cannot play camera video:', e));
  console.log(`[DEBUG] Video element created and playing for ${socketId}`);
}

// Create remote audio element for audio-only participants
function createRemoteAudio(track, socketId) {
  console.log(`[DEBUG] Creating remote audio for ${socketId}`);
  
  let audioEl = document.getElementById(`audio-${socketId}`);
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = `audio-${socketId}`;
    audioEl.autoplay = true;
    audioEl.controls = false;
    audioEl.style.display = 'none';
    document.body.appendChild(audioEl);
  }
  
  audioEl.srcObject = new MediaStream([track]);
  audioEl.play().catch(e => console.error('[ERROR] Cannot play audio:', e));
  
  console.log(`[DEBUG] Audio element created for ${socketId}`);
}

function createRemoteScreenShare(track, socketId) {
  // Xóa các video screen share cũ trong mainScreenShare
  const screenShareContainer = document.querySelector('.screen-share-container');
  if (screenShareContainer) {
    screenShareContainer.innerHTML = '';
  }
  // Tạo video màn hình mới
  const screenVideo = document.createElement('video');
  screenVideo.autoplay = true;
  screenVideo.playsInline = true;
  screenVideo.muted = true;
  screenVideo.style.width = '100%';
  screenVideo.style.height = '100%';
  screenVideo.style.objectFit = 'contain';
  screenVideo.srcObject = new MediaStream([track]);
  setTimeout(() => screenVideo.play().catch(e => console.error('[ERROR] Cannot play screen share video:', e)), 100);
  // Label
  const nameEl = document.createElement('div');
  nameEl.className = 'participant-name';
  nameEl.style.position = 'absolute';
  nameEl.style.bottom = '10px';
  nameEl.style.left = '10px';
  nameEl.style.background = 'rgba(0,0,0,0.7)';
  nameEl.style.color = 'white';
  nameEl.style.padding = '5px 10px';
  nameEl.style.borderRadius = '5px';
  nameEl.textContent = `User ${socketId.substring(0, 4)} - Screen Share`;
  // Thêm vào mainScreenShare
  if (screenShareContainer) {
    screenShareContainer.appendChild(screenVideo);
    screenShareContainer.appendChild(nameEl);
  }
  // Hiện mainScreenShare, ẩn mainVideoArea
  showMainScreenShare();
  // Camera của người chia sẻ phải nằm ở participants area
  moveRemoteCameraToParticipants(socketId);
}

// Toggle microphone
async function toggleMic() {
  if (!window.localStream) return;
  
  const audioTrack = window.localStream.getAudioTracks()[0];
  if (!audioTrack) return;
  
  if (audioProducer) {
    if (audioProducer.paused) {
      await audioProducer.resume();
      audioTrack.enabled = true;
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      micBtn.classList.remove('bg-red-600');
      micBtn.classList.add('bg-gray-700');
    } else {
      await audioProducer.pause();
      audioTrack.enabled = false;
      micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      micBtn.classList.remove('bg-gray-700');
      micBtn.classList.add('bg-red-600');
    }
  } else {
    // Toggle local audio track if producer not ready
    audioTrack.enabled = !audioTrack.enabled;
    if (audioTrack.enabled) {
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      micBtn.classList.remove('bg-red-600');
      micBtn.classList.add('bg-gray-700');
    } else {
      micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      micBtn.classList.remove('bg-gray-700');
      micBtn.classList.add('bg-red-600');
    }
  }
}

// Toggle video
async function toggleVideo() {
  if (videoProducer) {
    if (videoProducer.paused) {
      await videoProducer.resume();
      videoBtn.innerHTML = '<i class="fas fa-video"></i>';
      videoBtn.classList.remove('bg-red-600');
      videoBtn.classList.add('bg-gray-700');
      localVideo.style.display = 'block';
    } else {
      await videoProducer.pause();
      videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
      videoBtn.classList.remove('bg-gray-700');
      videoBtn.classList.add('bg-red-600');
      localVideo.style.display = 'none';
    }
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  if (screenShareProducer) {
    console.log('[INFO] Dừng chia sẻ màn hình');

    screenShareProducer.close();
    screenShareProducer = null;
    screenShareBtn.classList.remove('bg-blue-600');
    screenShareBtn.classList.add('bg-gray-700');

    // Dọn dẹp UI
    const el = document.getElementById('localScreenShareVideo');
    if (el) el.remove();

    const label = document.getElementById('localScreenShareLabel');
    if (label) label.remove();

    // Ẩn main screen share area nếu không còn screen share nào
    const mainScreenShare = document.getElementById('mainScreenShare');
    const screenShareContainer = document.querySelector('.screen-share-container');
    if (mainScreenShare && screenShareContainer && screenShareContainer.children.length === 0) {
      mainScreenShare.style.display = 'none';
    }

    restoreLocalCameraToMain();
    hideMainScreenShare();

    return;
  }

  try {
    console.log('[INFO] Bắt đầu chia sẻ màn hình...');
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];

    if (!track) {
      console.error('[ERROR] Không tìm thấy track video từ màn hình!');
      return;
    }

    if (!producerTransport) {
      console.error('[ERROR] Producer transport chưa sẵn sàng!');
      return;
    }

    console.log('[DEBUG] Đã lấy được track màn hình:', track);

    screenShareProducer = await producerTransport.produce({
      track,
      encodings: [{ maxBitrate: 1500000 }],
      appData: { mediaType: 'screen' }
    });

    console.log('[INFO] Đã tạo screenShareProducer:', screenShareProducer);

    // Đổi màu nút
    screenShareBtn.classList.remove('bg-gray-700');
    screenShareBtn.classList.add('bg-blue-600');

    // ✅ Hiển thị video local chia sẻ màn hình
    const screenStream = new MediaStream([track]);
    const screenVideo = document.createElement('video');
    screenVideo.id = 'localScreenShareVideo';
    screenVideo.autoplay = true;
    screenVideo.playsInline = true;
    screenVideo.muted = true;
    screenVideo.srcObject = screenStream;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'participant-name';
    nameDiv.id = 'localScreenShareLabel';
    nameDiv.textContent = 'Bạn (Chia sẻ màn hình)';

    // Thêm vào screen-share-container
    const screenShareContainer = document.querySelector('.screen-share-container');
    if (screenShareContainer) {
      screenShareContainer.appendChild(screenVideo);
      screenShareContainer.appendChild(nameDiv);

      // Hiển thị main screen share area
      const mainScreenShare = document.getElementById('mainScreenShare');
      if (mainScreenShare) {
        mainScreenShare.style.display = 'flex';
      }
    }

    moveLocalCameraToParticipants();
    showMainScreenShare();

    await screenVideo.play();

    // Khi người dùng ngắt chia sẻ màn hình
    track.onended = () => {
      console.log('[INFO] Người dùng đã dừng chia sẻ màn hình (onended)');
      if (screenShareProducer) screenShareProducer.close();
      screenShareProducer = null;
      screenShareBtn.classList.remove('bg-blue-600');
      screenShareBtn.classList.add('bg-gray-700');

      // Dọn dẹp UI
      document.getElementById('localScreenShareVideo')?.remove();
      document.getElementById('localScreenShareLabel')?.remove();

      // Ẩn main screen share area nếu không còn screen share nào
      const mainScreenShare = document.getElementById('mainScreenShare');
      const screenShareContainer = document.querySelector('.screen-share-container');
      if (mainScreenShare && screenShareContainer && screenShareContainer.children.length === 0) {
        mainScreenShare.style.display = 'none';
      }
    };
  } catch (error) {
    console.error('[ERROR] Không thể chia sẻ màn hình:', error);
  }
}

// Helper: Move local camera to participants area
function moveLocalCameraToParticipants() {
  let localCamContainer = document.getElementById('participant-local');
  if (!localCamContainer) {
    localCamContainer = document.createElement('div');
    localCamContainer.className = 'participant-video-item';
    localCamContainer.id = 'participant-local';
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = localVideo.srcObject;
    setTimeout(() => video.play().catch(() => {}), 100);
    const nameEl = document.createElement('div');
    nameEl.className = 'participant-name';
    nameEl.textContent = 'Bạn';
    localCamContainer.appendChild(video);
    localCamContainer.appendChild(nameEl);
    participantsVideoArea.appendChild(localCamContainer);
  } else {
    // Nếu đã có, đảm bảo video srcObject đúng
    const video = localCamContainer.querySelector('video');
    if (video && video.srcObject !== localVideo.srcObject) {
      video.srcObject = localVideo.srcObject;
      setTimeout(() => video.play().catch(() => {}), 100);
    }
  }
  localVideo.style.display = 'none';
}

// Helper: Restore local camera to main area
function restoreLocalCameraToMain() {
  localVideo.style.display = 'block';
  const localCamContainer = document.getElementById('participant-local');
  if (localCamContainer) localCamContainer.remove();
}

// Toggle chat panel
function toggleChat() {
  chatPanel.classList.toggle('translate-x-full');
}

// Send a chat message
function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  console.log('[DEBUG] Sending chat message:', { roomId, message });
  
  // Hiển thị message ngay lập tức cho người gửi
  addMessageToChat('Bạn', message);
  
  // Gửi lên server
  socket.emit('chat-message', {
    roomId: roomId,
    message: message,
    sender: userName
  });
  
  messageInput.value = '';
}

// Add a message to the chat panel
function addMessageToChat(sender, message) {
  console.log(`[DEBUG] Adding message to chat: ${sender}: ${message}`);
  
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) {
    console.error('[ERROR] Messages container not found!');
    return;
  }
  
  const messageEl = document.createElement('div');
  messageEl.className = 'mb-3';
  
  const senderEl = document.createElement('div');
  senderEl.className = 'font-semibold text-sm text-white';
  senderEl.textContent = sender;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'bg-gray-700 rounded p-2 mt-1 text-white';
  contentEl.textContent = message;
  
  messageEl.appendChild(senderEl);
  messageEl.appendChild(contentEl);
  messagesContainer.appendChild(messageEl);
  
  console.log(`[DEBUG] Message added to DOM, total messages: ${messagesContainer.children.length}`);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Leave the room
function leaveRoom() {
  if (confirm('Are you sure you want to leave the meeting?')) {
    if (socket) socket.disconnect();
    window.location.href = '/';
  }
}

// Copy room code to clipboard
function copyRoomCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
  navigator.clipboard.writeText(meetingUrl)
    .then(() => {
      alert('Meeting link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy:', err);
    });
}

// Generate a random string for room ID
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Start the application when the page loads
window.addEventListener('DOMContentLoaded', init);