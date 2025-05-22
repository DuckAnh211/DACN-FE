const socket = io("http://localhost:8080"); // hoặc IP BE

let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport;
let producer;
const consumers = new Map(); // lưu consumer theo producerId

const startClient = async () => {
  // 1. Lấy rtpCapabilities từ SFU
  socket.emit("getRtpCapabilities", {}, async (data) => {
    rtpCapabilities = data.rtpCapabilities;

    // 2. Tạo thiết bị (device)
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    // 3. Tạo producer transport
    socket.emit("createWebRtcTransport", { sender: true }, async ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
      producerTransport = device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters });

      producerTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit("connectTransport", { transportId: producerTransport.id, dtlsParameters }, callback);
      });

      producerTransport.on("produce", (parameters, callback, errback) => {
        socket.emit("produce", { transportId: producerTransport.id, kind: parameters.kind, rtpParameters: parameters.rtpParameters }, ({ id }) => {
          callback({ id });
        });
      });

      // 4. Get media and start producing video and audio
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      producer = await producerTransport.produce({ track: videoTrack });
      await producerTransport.produce({ track: audioTrack });

      document.getElementById("localVideo").srcObject = stream;

      // 5. Tạo consumer transport để nhận stream remote
      socket.emit("createWebRtcTransport", { sender: false }, ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
        consumerTransport = device.createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters });

        consumerTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connectTransport", { transportId: consumerTransport.id, dtlsParameters }, callback);
        });
      });
    });
  });
};

// Lắng nghe khi có producer mới từ server (để tạo consumer)
socket.on("newProducer", async ({ producerId, socketId }) => {
  if (socket.id === socketId) return; // bỏ qua producer của chính mình

  // Tạo consumer cho producer mới
  socket.emit("consume", { rtpCapabilities: device.rtpCapabilities, transportId: consumerTransport.id, producerId }, async ({ id, kind, rtpParameters }) => {
    if (!id) return;

    const consumer = await consumerTransport.consume({ id, producerId, kind, rtpParameters });
    consumers.set(producerId, consumer);

    const remoteStream = new MediaStream([consumer.track]);

    // Với nhiều remote video, bạn nên tạo video element mới, hoặc xử lý đa video tại đây
    document.getElementById("remoteVideo").srcObject = remoteStream;

    socket.emit("consumer-resume", { consumerId: consumer.id });
  });
});

window.onload = () => {
  startClient();
};
