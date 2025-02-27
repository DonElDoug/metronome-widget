// ----------------------------------------------------
// Metronome & Timer Combined Logic
// ----------------------------------------------------

// ---------------------
// 1) Metronome Constants/Vars (unchanged)
// ---------------------
const MIN_BPM = 20;
const MAX_BPM = 300;

let bpm = 100;
let isPlaying = false;
let intervalId = null;

const clickAudio = new Audio('audio/click.wav');

const bpmDisplay = document.getElementById('bpmDisplay');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');
const playPauseBtn = document.getElementById('playPauseBtn');

// ---------------------
// 2) Timer/Mode Variables
// ---------------------
const timerDisplay = document.querySelector('.timer-display');
const resetIcon = document.querySelector('.reset-icon');
const fluteAudio = new Audio('audio/flute_japan.mp3');

// Define modes
const MODE_0 = 0;  // Initial (timer = 00:00;00)
const MODE_1 = 1;  // Countdown
const MODE_2 = 2;  // Stopwatch

let currentMode = MODE_0;
let timerMs = 0;         // total time in milliseconds
let lastTimestamp = 0;   // for smooth rAF
let timerRAF = null;

// 30 min in ms is the max for the countdown
const MAX_COUNTDOWN_MS = 30 * 60 * 1000; // 1,800,000

// ---------------------
// 3) Metronome Functions (original, unchanged)
// ---------------------
function updateBpmDisplay() {
  bpmDisplay.textContent = bpm;
}

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

function startMetronome() {
  if (!isPlaying) {
    isPlaying = true;
    playPauseBtn.src = 'icons/pause_icon.png';
    resetInterval();

    // Decide mode transitions if currently in MODE_0
    if (currentMode === MODE_0) {
      if (timerMs === 0) {
        // Timer is zero => switch to stopwatch (Mode 2)
        currentMode = MODE_2;
      } else {
        // Timer is nonzero => switch to countdown (Mode 1)
        currentMode = MODE_1;
      }
    }

    hideResetIcon();
    startTimerRAF();
  }
}

function stopMetronome() {
  if (isPlaying) {
    isPlaying = false;
    playPauseBtn.src = 'icons/play_icon.png';
    clearInterval(intervalId);
    intervalId = null;
    pauseTimerRAF();
  }
}

// ---------------------
// 4) BPM Buttons (unchanged)
// ---------------------
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

// ---------------------
// 5) Play/Pause Toggle (unchanged handler)
// ---------------------
playPauseBtn.addEventListener('click', () => {
  if (!isPlaying) {
    startMetronome();
  } else {
    stopMetronome();
  }
});

// Initialize BPM display
updateBpmDisplay();


// ----------------------------------------------------
// 6) Timer Logic (with MS, formatted as MM:SS;ff)
// ----------------------------------------------------

// Convert "MM:SS;ff" -> ms
function parseTimeString(str) {
  // e.g., "02:05;37"
  // mm:ss;ff
  const [mmss, ff] = str.split(';');
  const [mm, ss] = mmss.split(':');
  const minutes = Number(mm);
  const seconds = Number(ss);
  const hundredths = Number(ff);
  return minutes * 60_000 + seconds * 1_000 + hundredths * 10;
}

// Convert ms -> "MM:SS;ff"
function formatTime(ms) {
  if (ms < 0) ms = 0;
  const totalHundredths = Math.floor(ms / 10);
  const hundredths = totalHundredths % 100;
  const totalSeconds = Math.floor(totalHundredths / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const ffStr = String(hundredths).padStart(2, '0');
  return `${mm}:${ss};${ffStr}`;
}

// Update the timer display
function setTimerDisplay(ms) {
  timerDisplay.textContent = formatTime(ms);
}

// The main requestAnimationFrame update loop
function updateTimer(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (currentMode === MODE_1) {
    // Countdown
    timerMs -= deltaMs;
    if (timerMs <= 0) {
      timerMs = 0;
      setTimerDisplay(timerMs);
      // Play flute + stop
      fluteAudio.currentTime = 0;
      fluteAudio.play();
      stopMetronome();
      // Return to mode 0
      currentMode = MODE_0;
      return;
    }
    setTimerDisplay(timerMs);
  } else if (currentMode === MODE_2) {
    // Stopwatch
    timerMs += deltaMs;
    setTimerDisplay(timerMs);
  }

  if (isPlaying) {
    timerRAF = requestAnimationFrame(updateTimer);
  }
}

function startTimerRAF() {
  lastTimestamp = 0;
  timerRAF = requestAnimationFrame(updateTimer);
}

function pauseTimerRAF() {
  if (timerRAF) {
    cancelAnimationFrame(timerRAF);
    timerRAF = null;
  }
  // If we are in stopwatch mode (MODE_2) on pause, show reset
  if (currentMode === MODE_2) {
    showResetIcon();
  }
}

// ----------------------------------------------------
// 7) Timer UI Interactions
// ----------------------------------------------------

// 7a) Clicking the timer to add +5 min, only in MODE_0, up to 30 min
timerDisplay.addEventListener('click', () => {
  if (!isPlaying && currentMode === MODE_0) {
    // Add 5 minutes (300,000 ms), capped at 30 minutes
    timerMs = Math.min(timerMs + 300_000, MAX_COUNTDOWN_MS);
    setTimerDisplay(timerMs);
  }
});

// 7b) Reset icon (only relevant in MODE_2 when paused)
resetIcon.addEventListener('click', () => {
  if (!isPlaying && currentMode === MODE_2) {
    // Reset => return to MODE_0
    timerMs = 0;
    setTimerDisplay(timerMs);
    currentMode = MODE_0;
    hideResetIcon();
  }
});

function showResetIcon() {
  resetIcon.style.display = 'block';
}
function hideResetIcon() {
  resetIcon.style.display = 'none';
}
