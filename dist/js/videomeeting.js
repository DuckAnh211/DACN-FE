// Global variables
let socket;
let localStream;
let remoteStreams = {};
let isAudioEnabled = true;
let isVideoEnabled = true;
let isScreenSharing = false;
let device;
let rtpCapabilities;
let producerTransport;
let consumerTransports = [];
let videoProducer;
let audioProducer;
let consumers = [];

// DOM elements
const localVideo = document.getElementById('localVideo');
const screenShareVideo = document.getElementById('screenShareVideo');
const screenShareArea = document.getElementById('screenShareArea');
const mainVideoArea = document.getElementById('mainVideoArea');
const participantsVideoArea = document.getElementById('participantsVideoArea');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const chatBtn = document.getElementById('chatBtn');
const participantsBtn = document.getElementById('participantsBtn');
const leaveBtn = document.getElementById('leaveBtn');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messages = document.getElementById('messages');
const participantsPanel = document.getElementById('participantsPanel');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');
const copyBtn = document.getElementById('copyBtn');
const roomCode = document.getElementById('roomCode');

// Get room info
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || urlParams.get('id') || generateRoomId();
const userName = urlParams.get('name') || urlParams.get('teacher') || urlParams.get('student') || 'User';

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Initialize
async function init() {
  try {
    // Get local media
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    localVideo.srcObject = localStream;
    
    // Connect to server with room info
    socket = io('http://localhost:8080', {
      query: {
        roomId: roomId,
        userName: userName
      }
    });
    
    // Setup socket events
    setupSocketEvents();
    
    // Setup UI events
    setupUIEvents();
    
    // Update room code display
    const meetingIdElement = document.getElementById('meetingIdValue');
    if (meetingIdElement) {
      meetingIdElement.textContent = roomId;
    }
    
    // Update URL if room ID was generated
    if (!urlParams.get('room') && !urlParams.get('id')) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('room', roomId);
      newUrl.searchParams.set('name', userName);
      window.history.replaceState({}, '', newUrl);
    }
    
  } catch (error) {
    console.error('Error initializing:', error);
    alert('Không thể truy cập camera/mic. Vui lòng cho phép quyền truy cập.');
  }
}

// Setup socket events
function setupSocketEvents() {
  socket.on('connect', () => {
    console.log('Connected to server');
    // Send user info after connection
    socket.emit('joinRoom', { name: userName });
    // Get RTP capabilities
    socket.emit('getRtpCapabilities', {}, async (rtpCaps) => {
      rtpCapabilities = rtpCaps;
      // Wait for mediasoupClient to load
      if (typeof mediasoupClient !== 'undefined') {
        await loadDevice();
      } else {
        console.error('mediasoupClient library not loaded');
      }
    });
  });
  
  socket.on('user-joined', (data) => {
    console.log('User joined:', data);
    addParticipant(data);
  });
  
  socket.on('user-left', (data) => {
    console.log('User left:', data);
    removeParticipant(data);
  });
  
  socket.on('participants-list', (participants) => {
    updateParticipantsList(participants);
  });
  
  socket.on('chat-message', (data) => {
    addMessageToChat(data.sender, data.message);
  });
  
  socket.on('video-stream', (data) => {
    // Handle incoming video stream
    handleRemoteStream(data);
  });
  
  socket.on('updateParticipants', (participants) => {
    updateParticipantsList(participants);
  });
  
  socket.on('screen-share-start', (data) => {
    console.log('Someone started screen sharing:', data);
    // Test: create fake screen share
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#0f0';
    ctx.font = '40px Arial';
    ctx.fillText('Screen Share from Remote User', 300, 360);
    
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    
    createRemoteScreenShare(track, data.socketId || 'remote');
  });
  
  socket.on('screen-share-stop', (data) => {
    console.log('Someone stopped screen sharing:', data);
    screenShareArea.classList.add('hidden');
    mainVideoArea.classList.remove('hidden');
    screenShareArea.innerHTML = '';
  });
  
  socket.on('new-producer', async ({ producerId, producerSocketId, kind, appData }) => {
    await consumeTrack(producerId, producerSocketId, kind, appData);
  });
  
  socket.on('existingProducers', async (producers) => {
    for (const { producerId, producerSocketId, kind, appData } of producers) {
      await consumeTrack(producerId, producerSocketId, kind, appData);
    }
  });
  
  socket.on('producer-closed', ({ remoteProducerId }) => {
    console.log('Producer closed:', remoteProducerId);
    // Find and remove the consumer
    const consumerIndex = consumers.findIndex(c => c.consumer.producerId === remoteProducerId);
    if (consumerIndex !== -1) {
      const { consumer, socketId } = consumers[consumerIndex];
      consumer.close();
      consumers.splice(consumerIndex, 1);
      
      // Remove video element
      const videoEl = document.getElementById(`participant-${socketId}`);
      if (videoEl) videoEl.remove();
      
      // If it was screen share, hide screen share area
      if (screenShareArea.innerHTML.includes(socketId)) {
        screenShareArea.classList.add('hidden');
        mainVideoArea.classList.remove('hidden');
        screenShareArea.innerHTML = '';
      }
    }
  });
}

// Setup UI events
function setupUIEvents() {
  micBtn.addEventListener('click', toggleMic);
  videoBtn.addEventListener('click', toggleVideo);
  screenShareBtn.addEventListener('click', toggleScreenShare);
  chatBtn.addEventListener('click', toggleChat);
  closeChatBtn.addEventListener('click', toggleChat);
  participantsBtn.addEventListener('click', toggleParticipants);
  leaveBtn.addEventListener('click', leaveRoom);
  sendMessageBtn.addEventListener('click', sendMessage);
  copyBtn.addEventListener('click', copyRoomCode);
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// Toggle microphone
function toggleMic() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isAudioEnabled = audioTrack.enabled;
      
      if (isAudioEnabled) {
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.classList.remove('active');
      } else {
        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        micBtn.classList.add('active');
      }
      
      socket.emit('audio-toggle', { enabled: isAudioEnabled });
    }
  }
}

// Toggle video
function toggleVideo() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isVideoEnabled = videoTrack.enabled;
      
      if (isVideoEnabled) {
        videoBtn.innerHTML = '<i class="fas fa-video"></i>';
        videoBtn.classList.remove('active');
        mainVideoArea.style.display = 'flex';
      } else {
        videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
        videoBtn.classList.add('active');
        mainVideoArea.style.display = 'none';
      }
      
      socket.emit('video-toggle', { enabled: isVideoEnabled });
    }
  }
}

// Toggle screen share
async function toggleScreenShare() {
  if (isScreenSharing) {
    // Stop screen sharing
    isScreenSharing = false;
    screenShareBtn.classList.remove('active');
    
    // Hide screen share area, show main video
    screenShareArea.classList.add('hidden');
    mainVideoArea.classList.remove('hidden');
    
    // Stop screen share video
    if (screenShareVideo.srcObject) {
      screenShareVideo.srcObject.getTracks().forEach(track => track.stop());
      screenShareVideo.srcObject = null;
    }
    
    // Remove camera from participants area
    const localCameraInParticipants = document.getElementById('local-camera-participant');
    if (localCameraInParticipants) {
      localCameraInParticipants.remove();
    }
    
    socket.emit('screen-share-stop', { socketId: socket.id });
  } else {
    // Start screen sharing
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true 
      });
      
      // Show screen share area, hide main video
      screenShareArea.classList.remove('hidden');
      mainVideoArea.classList.add('hidden');
      
      screenShareVideo.srcObject = screenStream;
      
      // Add camera to participants area
      addLocalCameraToParticipants();
      
      // Create screen share producer
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack && producerTransport) {
        const screenProducer = await producerTransport.produce({
          track: screenTrack,
          appData: { mediaType: 'screen' }
        });
      }
      
      isScreenSharing = true;
      screenShareBtn.classList.add('active');
      
      socket.emit('screen-share-start', { socketId: socket.id });
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        toggleScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }
}

// Toggle chat
function toggleChat() {
  chatPanel.classList.toggle('translate-x-full');
}

// Toggle participants
function toggleParticipants() {
  participantsPanel.classList.toggle('hidden');
}

// Send message
function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  socket.emit('chat-message', {
    roomId,
    sender: userName,
    message
  });
  
  addMessageToChat('Bạn', message);
  messageInput.value = '';
}

// Add message to chat
function addMessageToChat(sender, message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'message-item';
  
  const senderEl = document.createElement('div');
  senderEl.className = 'message-sender';
  senderEl.textContent = sender;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.textContent = message;
  
  messageEl.appendChild(senderEl);
  messageEl.appendChild(contentEl);
  messages.appendChild(messageEl);
  
  messages.scrollTop = messages.scrollHeight;
}

// Add participant
function addParticipant(participant) {
  const videoEl = document.createElement('div');
  videoEl.className = 'participant-video-item';
  videoEl.id = `participant-${participant.id}`;
  
  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  
  const nameEl = document.createElement('div');
  nameEl.className = 'participant-name';
  nameEl.textContent = participant.name || `User ${participant.id.substring(0, 4)}`;
  
  videoEl.appendChild(video);
  videoEl.appendChild(nameEl);
  participantsVideoArea.appendChild(videoEl);
}

// Remove participant
function removeParticipant(participant) {
  const participantEl = document.getElementById(`participant-${participant.id}`);
  if (participantEl) {
    participantEl.remove();
  }
}

// Update participants list
function updateParticipantsList(participants) {
  participantsList.innerHTML = '';
  participantCount.textContent = participants.length;
  
  participants.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name || `User ${p.id.substring(0, 4)}`;
    participantsList.appendChild(li);
  });
}

// Handle remote stream
function handleRemoteStream(data) {
  // This would handle WebRTC streams in a real implementation
  console.log('Remote stream:', data);
}

// Copy room code
function copyRoomCode() {
  const meetingUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&name=${userName}`;
  navigator.clipboard.writeText(meetingUrl)
    .then(() => {
      alert('Link phòng đã được sao chép!');
    })
    .catch(err => {
      console.error('Failed to copy:', err);
    });
}

// Add local camera to participants area when screen sharing
function addLocalCameraToParticipants() {
  const videoEl = document.createElement('div');
  videoEl.className = 'participant-video-item';
  videoEl.id = 'local-camera-participant';
  
  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = localStream;
  
  const nameEl = document.createElement('div');
  nameEl.className = 'participant-name';
  nameEl.textContent = 'Bạn (Camera)';
  
  videoEl.appendChild(video);
  videoEl.appendChild(nameEl);
  participantsVideoArea.insertBefore(videoEl, participantsVideoArea.firstChild);
}

// Leave room
function leaveRoom() {
  if (confirm('Bạn có chắc muốn rời khỏi phòng?')) {
    if (socket) socket.disconnect();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    window.location.href = '/';
  }
}

// Load mediasoup device
async function loadDevice() {
  try {
    if (typeof mediasoupClient === 'undefined') {
      console.error('mediasoupClient not loaded');
      return;
    }
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    await createSendTransport();
  } catch (error) {
    console.error('Error loading device:', error);
  }
}

// Create send transport
async function createSendTransport() {
  socket.emit('createWebRtcTransport', { sender: true }, async ({ params }) => {
    if (params.error) return;
    
    producerTransport = device.createSendTransport(params);
    
    producerTransport.on('connect', async ({ dtlsParameters }, callback) => {
      socket.emit('transport-connect', {
        transportId: producerTransport.id,
        dtlsParameters
      });
      callback();
    });
    
    producerTransport.on('produce', async ({ kind, rtpParameters }, callback) => {
      socket.emit('transport-produce', {
        transportId: producerTransport.id,
        kind,
        rtpParameters
      }, ({ id }) => {
        callback({ id });
      });
    });
    
    await produceVideo();
    await produceAudio();
  });
}

// Produce video
async function produceVideo() {
  if (!device.canProduce('video') || !localStream) return;
  
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;
  
  videoProducer = await producerTransport.produce({ track: videoTrack });
}

// Produce audio
async function produceAudio() {
  if (!device.canProduce('audio') || !localStream) return;
  
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;
  
  audioProducer = await producerTransport.produce({ track: audioTrack });
}

// Consume track from remote user
async function consumeTrack(producerId, producerSocketId, kind, appData) {
  socket.emit('createWebRtcTransport', { sender: false }, async ({ params }) => {
    if (params.error) return;
    
    const consumerTransport = device.createRecvTransport(params);
    consumerTransports.push(consumerTransport);
    
    consumerTransport.on('connect', async ({ dtlsParameters }, callback) => {
      socket.emit('transport-connect', {
        transportId: consumerTransport.id,
        dtlsParameters
      });
      callback();
    });
    
    socket.emit('consume', {
      transportId: consumerTransport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    }, async ({ params }) => {
      if (params.error) return;
      
      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      });
      
      consumers.push({ consumer, socketId: producerSocketId });
      
      socket.emit('consumer-resume', { consumerId: consumer.id });
      
      if (kind === 'video') {
        const mediaType = appData?.mediaType || 'camera';
        console.log('Consuming video:', { producerSocketId, mediaType, appData });
        
        if (mediaType === 'screen') {
          createRemoteScreenShare(consumer.track, producerSocketId);
        } else {
          createRemoteVideo(consumer.track, producerSocketId);
        }
      }
    });
  });
}

// Create remote video element
function createRemoteVideo(track, socketId) {
  const stream = new MediaStream([track]);
  
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
  
  const video = videoEl.querySelector('video');
  video.srcObject = stream;
}

// Create remote screen share
function createRemoteScreenShare(track, socketId) {
  const stream = new MediaStream([track]);
  
  console.log('Creating remote screen share for:', socketId);
  
  // Clear existing screen share content
  screenShareArea.innerHTML = '';
  
  // Create screen share video
  const screenVideo = document.createElement('video');
  screenVideo.autoplay = true;
  screenVideo.playsInline = true;
  screenVideo.muted = true;
  screenVideo.srcObject = stream;
  
  const nameEl = document.createElement('div');
  nameEl.className = 'participant-name';
  nameEl.textContent = `User ${socketId.substring(0, 4)} - Screen Share`;
  
  screenShareArea.appendChild(screenVideo);
  screenShareArea.appendChild(nameEl);
  
  // Show screen share area
  screenShareArea.classList.remove('hidden');
  mainVideoArea.classList.add('hidden');
  
  console.log('Remote screen share created and displayed');
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);