const toggleButton = document.querySelector('#toggleRecording');
const timerDisplay = document.querySelector('#timer');
let screenStream;
let audioStream;
let mediaRecorder;
let startTime;
let intervalId;

function updateTimer() {
  const currentTime = new Date().getTime();
  const elapsedTime = (currentTime - startTime) / 1000; // en segundos
  timerDisplay.textContent = `🔴 ${formatTime(elapsedTime)}`;
  timerDisplay.style.display = 'flex'
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

toggleButton.addEventListener('click', async () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    try {
      startTime = new Date().getTime();
      updateTimer();

      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
      });

      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
        },
      });

      const combinedStream = new MediaStream();
      screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

      const chunks = [];
      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearInterval(intervalId); // Detener el intervalo al finalizar la grabación
        const blob = new Blob(chunks, { type: 'video/webm' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'screenrecorder.webm';
        link.click();
      };

      mediaRecorder.start();

      intervalId = setInterval(updateTimer, 1000);

      toggleButton.textContent = 'Detener Grabación';
    } catch (error) {
      console.error('Error al obtener medios: ', error);
    }
  } else if (mediaRecorder.state === 'recording') {

    mediaRecorder.stop();
    screenStream.getTracks().forEach(track => track.stop());
    audioStream.getTracks().forEach(track => track.stop());
    timerDisplay.style.display = 'none'
    toggleButton.textContent = 'Iniciar Grabación';
  }
});
