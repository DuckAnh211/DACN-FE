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


// Set up socket event listeners
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
    li.textContent = p.name ? p.name : User ${p.id.substring(0, 4)};
    participantsList.appendChild(li);
  });
});

  socket.on('producer-closed', ({ remoteProducerId }) => {
    const producerToClose = consumers.find(consumer => consumer.producerId === remoteProducerId);
    if (producerToClose) {
      producerToClose.consumer.close();
      consumers = consumers.filter(consumer => consumer.producerId !== remoteProducerId);
      
      // Xóa video element dựa trên mediaType
      if (producerToClose.mediaType === 'screen') {
        const screenEl = document.getElementById(video-${producerToClose.socketId}-screen);
        if (screenEl) {
          screenEl.remove();
          // Remove label cũng
          const label = screenEl.nextElementSibling;
          if (label && label.className === 'participant-name') {
            label.remove();
          }
          
          // Ẩn main screen share area nếu không còn screen share nào
          const screenShareContainer = document.querySelector('.screen-share-container');
          const mainScreenShare = document.getElementById('mainScreenShare');
          if (mainScreenShare && screenShareContainer && screenShareContainer.children.length === 0) {
            mainScreenShare.style.display = 'none';
          }
        }
      } else {
        // Xóa camera video từ participants video area
        const container = document.getElementById(container-${producerToClose.socketId});
        if (container) {
          container.remove();
        }
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
    li.textContent = p.name ? p.name : User ${p.id.substring(0, 4)};
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
  
  console.log([DEBUG] Processing message from: ${sender});
  
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
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    
    // Store tracks for later use
    window.localStream = stream;
  } catch (error) {
    console.error('Error getting local stream:', error);
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
    track: audioTrack
  });

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
    if (params.error) {
      console.error(params.error);
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
      if (params.error) {
        console.error(params.error);
        return;
      }

      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      });

      consumers.push({
        consumer,
        socketId: producerSocketId,
        producerId,
        mediaType: mediaType
      });

      const { track } = consumer;
      
      console.log([DEBUG] Consuming ${kind} track from ${producerSocketId}, mediaType: ${mediaType});
      console.log([DEBUG] Track state:, {
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      });
      
      // Resume consumer trước khi tạo video element
      socket.emit('consumer-resume', { consumerId: consumer.id });
      
      // Đợi một chút rồi tạo video element
      setTimeout(() => {
        // Create a new video element for the remote stream
        if (kind === 'video') {
          createRemoteVideo(track, producerSocketId, mediaType);
        } else {
          // For audio tracks, add them to existing video elements
          const videoEl = document.getElementById(video-${producerSocketId});
          if (videoEl) {
            const stream = videoEl.srcObject || new MediaStream();
            stream.addTrack(track);
            videoEl.srcObject = stream;
          } else {
            // If video element doesn't exist yet, create a placeholder
            createRemoteVideo(track, producerSocketId, mediaType);
          }
        }
      }, 100);
    });
  });
}

// Create a remote video element
function createRemoteVideo(track, socketId, mediaType) {
  console.log([DEBUG] Creating remote video for ${socketId}, mediaType: ${mediaType});
  const stream = new MediaStream([track]);
  
  if (mediaType === 'screen') {
    // Xử lý screen share - hiển thị ở khu vực chính
    let videoEl = document.getElementById(video-${socketId}-screen);
    
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.id = video-${socketId}-screen;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'contain';

      const label = document.createElement('div');
      label.className = 'participant-name';
      label.textContent = Screen Share - User ${socketId.substring(0, 4)};

      const screenShareContainer = document.querySelector('.screen-share-container');
      if (screenShareContainer) {
        screenShareContainer.appendChild(videoEl);
        screenShareContainer.appendChild(label);

        const mainScreenShare = document.getElementById('mainScreenShare');
        if (mainScreenShare) {
          mainScreenShare.style.display = 'flex';
        }
      }
    }
    
    videoEl.srcObject = stream;
    videoEl.play().catch(err => {
      console.error([ERROR] Cannot play screen share video:, err);
    });
    
  } else {
    // Xử lý camera video - hiển thị ở khu vực bên phải
    let videoEl = document.getElementById(video-${socketId});
    let container = document.getElementById(container-${socketId});

    if (!container) {
      container = document.createElement('div');
      container.id = container-${socketId};
      container.className = 'participant-video-item';
      container.style.cssText = 
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        background: #1f2937;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;
      ;

      videoEl = document.createElement('video');
      videoEl.id = video-${socketId};
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.style.cssText = 
        width: 100%;
        height: 100%;
        object-fit: cover;
      ;

      const label = document.createElement('div');
      label.className = 'participant-name';
      label.style.cssText = 
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      ;
      label.textContent = User ${socketId.substring(0, 4)};

      container.appendChild(videoEl);
      container.appendChild(label);

      // Thêm vào khu vực hiển thị webcam người tham gia
      const participantsArea = participantsVideoArea || document.getElementById('videoGrid');
      if (participantsArea) {
        participantsArea.appendChild(container);
      }
    }
    
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.play().catch(err => {
        console.error([ERROR] Cannot play camera video:, err);
      });
    }
  }
}



// Toggle microphone
async function toggleMic() {
  if (audioProducer) {
    if (audioProducer.paused) {
      await audioProducer.resume();
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      micBtn.classList.remove('bg-red-600');
      micBtn.classList.add('bg-gray-700');
    } else {
      await audioProducer.pause();
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
  console.log([DEBUG] Adding message to chat: ${sender}: ${message});
  
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
  
  console.log([DEBUG] Message added to DOM, total messages: ${messagesContainer.children.length});
  
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
  // Giữ nguyên các parameter khác nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const meetingUrl = ${window.location.origin}${window.location.pathname}?${urlParams.toString()};
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