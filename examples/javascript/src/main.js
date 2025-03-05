import { RecordTranscribe } from '@soniox/speech-to-text-web';

const apiKey = 'SONIOX_API_KEY';

var recordTranscribe = new RecordTranscribe({
  apiKey: apiKey,
});

document.querySelector('#app').innerHTML = `
  <div>
    <button id="start-button">Start</button>
    <button id="stop-button">Stop</button>
    <button id="cancel-button">Cancel</button>
    <br>
    <span id="transcript"></span>
    <br>
  </div>
`;

const transcript = document.getElementById('transcript');

document.getElementById('start-button').onclick = () => {
  recordTranscribe?.cancel();
  transcript.textContent = '';

  recordTranscribe.start({
    model: 'stt-rt-preview',

    onStarted: () => {
      console.log('Transcribe started');
    },
    onPartialResult: (result) => {
      transcript.textContent += result.text;
    },
    onFinished: () => {
      console.log('Transcribe finished');
    },
    onError: (status, message) => {
      console.log('Error occurred', status, message);
    },
  });
};

document.getElementById('stop-button').onclick = function () {
  recordTranscribe?.stop();
};
document.getElementById('cancel-button').onclick = function () {
  recordTranscribe?.cancel();
};
