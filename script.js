let bpm = 100;

const bpmDisplay = document.getElementById('bpm-display');
const increaseBtn = document.getElementById('increase-btn');
const decreaseBtn = document.getElementById('decrease-btn');

// Load the metronome click sound
const clickSound = new Audio('audio/click.wav');

function updateBPM(newBpm) {
  bpm = newBpm;
  bpmDisplay.textContent = bpm;
  // Reset and play the sound
  clickSound.currentTime = 0;
  clickSound.play();
}

increaseBtn.addEventListener('click', () => {
  updateBPM(bpm + 1);
});

decreaseBtn.addEventListener('click', () => {
  updateBPM(bpm - 1);
});
