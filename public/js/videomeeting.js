// js/videomeeting.js
import { io } from "https://cdn.socket.io/4.6.1/socket.io.esm.min.js";

const socket = io(); // Connect to the server

let device;
let rtpCapabilities;
let producerTransport;
let videoProducer;
let audioProducer;
let localStream;

// DOM
const localVideo = document.getElementById('localVideo');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const leaveBtn = document.getElementById('leaveBtn');

// ---------------------------
// Start when DOM is ready
// ---------------------------
(async function startClient() {
  try {
    // Try to get both audio and video
    localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: true 
    });
  } catch (err) {
    console.warn('Could not get both audio and video:', err.message);
    
    try {
      // Fallback: try just audio
      localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      console.log('Using audio only');
    } catch (err2) {
      console.error('Media access failed completely:', err2.message);
      
      // Create an empty MediaStream as a last resort
      localStream = new MediaStream();
      alert('No camera or microphone detected. You will be able to see and hear others, but they won\'t be able to see or hear you.');
    }
  }
  
  // Set the local video stream if we have video tracks
  if (localStream.getVideoTracks().length > 0) {
    localVideo.srcObject = localStream;
  } else {
    // Show a placeholder for the video
    localVideo.srcObject = null;
    // You could add code here to show a placeholder image or message in the video element
  }

  // Step 1: join room - proceed even without media
  socket.emit('joinRoom', {}, async ({ rtpCapabilities: serverCaps }) => {
    rtpCapabilities = serverCaps;
    await loadDevice();
    await createSendTransport();
  });
})();

// ---------------------------
// Mediasoup device setup
// ---------------------------
async function loadDevice() {
  try {
    device = new mediasoupClient.Device();
  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.error('Browser not supported');
    }
  }
  await device.load({ routerRtpCapabilities: rtpCapabilities });
}

// ---------------------------
// Create Transport
// ---------------------------
async function createSendTransport() {
  socket.emit('createWebRtcTransport', { sender: true }, async ({ params }) => {
    if (params.error) {
      console.error(params.error);
      return;
    }

    producerTransport = device.createSendTransport(params);

    producerTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socket.emit('transport-connect', { dtlsParameters });
      callback();
    });

    producerTransport.on('produce', (parameters, callback, errback) => {
      socket.emit('transport-produce', {
        kind: parameters.kind,
        rtpParameters: parameters.rtpParameters,
        appData: parameters.appData,
      }, ({ id }) => {
        callback({ id });
      });
    });

    await produceVideo();
    await produceAudio();
  });
}

// ---------------------------
// Produce Video
// ---------------------------
async function produceVideo() {
  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) {
    console.log('No video track available to produce');
    return;
  }
  
  videoProducer = await producerTransport.produce({
    track: videoTracks[0],
    encodings: [{ maxBitrate: 1500000 }],
    appData: { mediaTag: 'video' }
  });
}

// ---------------------------
// Produce Audio
// ---------------------------
async function produceAudio() {
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) {
    console.log('No audio track available to produce');
    return;
  }
  
  audioProducer = await producerTransport.produce({
    track: audioTracks[0],
    appData: { mediaTag: 'audio' }
  });
}

// ---------------------------
// Control Buttons
// ---------------------------
micBtn.addEventListener('click', () => {
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    const audioTrack = audioTracks[0];
    audioTrack.enabled = !audioTrack.enabled;
    micBtn.classList.toggle('bg-red-600', !audioTrack.enabled);
  } else {
    alert('No microphone available');
  }
});

videoBtn.addEventListener('click', () => {
  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length > 0) {
    const videoTrack = videoTracks[0];
    videoTrack.enabled = !videoTrack.enabled;
    videoBtn.classList.toggle('bg-red-600', !videoTrack.enabled);
  } else {
    alert('No camera available');
  }
});

leaveBtn.addEventListener('click', () => {
  socket.disconnect();
  window.location.href = '/';
});
