import { RecordTranscribe } from '@soniox/speech-to-text-web';

const apiKey = '<SONIOX_API_KEY|TEMP_API_KEY>';

const recordTranscribe = new RecordTranscribe({
  apiKey: apiKey,
});

document.querySelector('#app').innerHTML = `
  <div>
      <button id="startButton">Start</button>
      <button id="stopButton">Stop</button>
      <button id="cancelButton">Cancel</button>
    <br />
    <div class="output">
      <span id="finalTokens"></span>
      <span id="nonFinalTokens" style="color: blue"></span>
    </div>
  </div>
`;

const finalTokens = document.getElementById('finalTokens');
const nonFinalTokens = document.getElementById('nonFinalTokens');

document.getElementById('startButton').onclick = () => {
  recordTranscribe?.cancel();
  finalTokens.textContent = '';

  recordTranscribe.start({
    model: 'stt-rt-preview',

    onStarted: () => {
      console.log('Transcribe started');
    },
    onPartialResult: (result) => {
      let newNonFinalTokens = "";

      for (const token of result.tokens) {
        if (token.is_final) {
          finalTokens.textContent += token.text;
        } else {
          newNonFinalTokens += token.text;
        }
      }
      nonFinalTokens.textContent = newNonFinalTokens
    },
    onFinished: () => {
      console.log('Transcribe finished');
    },
    onError: (status, message) => {
      console.log('Error occurred', status, message);
    },
  });
};

document.getElementById('stopButton').onclick = function () {
  recordTranscribe?.stop();
};

document.getElementById('cancelButton').onclick = function () {
  recordTranscribe?.cancel();
};
