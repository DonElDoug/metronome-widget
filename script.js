// Constants for BPM limits
const MIN_BPM = 20;
const MAX_BPM = 300;

// Initial BPM state
let bpm = 100;
let isPlaying = false;
let intervalId = null;

// Preload the metronome click sound
const clickAudio = new Audio('audio/click.wav');

// Grab DOM elements
const bpmDisplay = document.getElementById('bpmDisplay');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');
const playPauseBtn = document.getElementById('playPauseBtn');

// Update the BPM display text
function updateBpmDisplay() {
  bpmDisplay.textContent = bpm;
}

// Start the metronome
function startMetronome() {
  if (!isPlaying) {
    isPlaying = true;
    // Switch icon to pause
    playPauseBtn.src = 'icons/pause_icon.png';
    resetInterval();
  }
}

// Reset the interval so BPM changes apply immediately
function resetInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  const intervalMs = 60000 / bpm;
  intervalId = setInterval(() => {
    clickAudio.currentTime = 0;
    clickAudio.play();
  }, intervalMs);
}

// Stop the metronome
function stopMetronome() {
  if (isPlaying) {
    isPlaying = false;
    // Switch icon back to play
    playPauseBtn.src = 'icons/play_icon.png';
    clearInterval(intervalId);
    intervalId = null;
  }
}

// Decrease BPM: normal click reduces by 1; ctrl‑click rounds down or subtracts 5 if already a multiple of 5.
minusBtn.addEventListener('click', (event) => {
  if (event.ctrlKey) {
    if (bpm % 5 !== 0) {
      bpm = Math.floor(bpm / 5) * 5;
    } else {
      bpm = Math.max(MIN_BPM, bpm - 5);
    }
  } else {
    bpm = Math.max(MIN_BPM, bpm - 1);
  }
  updateBpmDisplay();
  if (isPlaying) {
    resetInterval();
  }
});

// Increase BPM: normal click increases by 1; ctrl‑click rounds up or adds 5 if already a multiple of 5.
plusBtn.addEventListener('click', (event) => {
  if (event.ctrlKey) {
    if (bpm % 5 !== 0) {
      bpm = Math.ceil(bpm / 5) * 5;
    } else {
      bpm = Math.min(MAX_BPM, bpm + 5);
    }
  } else {
    bpm = Math.min(MAX_BPM, bpm + 1);
  }
  updateBpmDisplay();
  if (isPlaying) {
    resetInterval();
  }
});

// Toggle Play/Pause
playPauseBtn.addEventListener('click', () => {
  if (!isPlaying) {
    startMetronome();
  } else {
    stopMetronome();
  }
});

// Initialize BPM display on page load
updateBpmDisplay();

