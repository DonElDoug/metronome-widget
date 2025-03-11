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

// Speed Mode Variables
let speedModeEnabled = false;
let initialBpm = 100;
let finalBpm = 120;
let speedIncrement = 5;
let barsPerIncrement = 4;
let clickCount = 0;

// Elements
const speedModePopup = document.getElementById('speedModePopup');
const closePopup = document.getElementById('closePopup');
const saveSpeedMode = document.getElementById('saveSpeedMode');
const initialBpmInput = document.getElementById('initialBpm');
const finalBpmInput = document.getElementById('finalBpm');
const incrementInput = document.getElementById('increment');
const barsInput = document.getElementById('bars');

// Load Speed Mode settings from localStorage
function loadSpeedModeSettings() {
  initialBpm = parseInt(localStorage.getItem('initialBpm')) || 100;
  finalBpm = parseInt(localStorage.getItem('finalBpm')) || 180;
  speedIncrement = parseInt(localStorage.getItem('increment')) || 5;
  barsPerIncrement = parseInt(localStorage.getItem('bars')) || 16;

  initialBpmInput.value = initialBpm;
  finalBpmInput.value = finalBpm;
  incrementInput.value = speedIncrement;
  barsInput.value = barsPerIncrement;
}

// Save Speed Mode settings to localStorage
function saveSpeedModeSettings() {
  initialBpm = parseInt(initialBpmInput.value);
  finalBpm = parseInt(finalBpmInput.value);
  speedIncrement = parseInt(incrementInput.value);
  barsPerIncrement = parseInt(barsInput.value);

  localStorage.setItem('initialBpm', initialBpm);
  localStorage.setItem('finalBpm', finalBpm);
  localStorage.setItem('increment', speedIncrement);
  localStorage.setItem('bars', barsPerIncrement);
}

// Increment BPM logic
function incrementBpm() {
  if (speedModeEnabled && isPlaying) {
    clickCount++;
    if (clickCount >= barsPerIncrement * 4) {
      clickCount = 0;
      bpm = Math.min(finalBpm, bpm + speedIncrement);
      updateBpmDisplay();
      resetInterval();
      if (bpm >= finalBpm) {
        stopMetronome();
        bpm = initialBpm;
        updateBpmDisplay();
        speedModeEnabled = false;
        speedIcon.setAttribute('src', 'icons/speed_off.png');
        fluteAudio.currentTime = 0;
        fluteAudio.play();
        currentMode = MODE_0;
      }
    }
  }
}

// Initialize AudioContext (mobile browsers require a user gesture to resume)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let clickBuffer = null;

// Preload click sound into an AudioBuffer
fetch('audio/click.wav')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  .then(buffer => { clickBuffer = buffer; })
  .catch(err => console.error('Error loading click sound:', err));

function playClickSound() {
  // Ensure the audio context is running
  if (audioContext.state !== 'running') {
    audioContext.resume();
  }
  if (clickBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = clickBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  }
}

// 1) Track whether random mode is enabled, plus bar counters
let randomModeEnabled = false;
let randomSilencePattern = [];
let randomBarCounter = 0;
let randomClickCounter = 0; // moves from 0..3 (each bar has 4 clicks)

// 2) Extend the existing setInterval logic to handle random mode skipping
function resetInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  const intervalMs = 60000 / bpm;
  intervalId = setInterval(() => {
    // If random mode is enabled and the current bar is silent, skip the click
    if (randomModeEnabled) {
      // If “true,” that means this bar is silent => no click
      if (!randomSilencePattern[randomBarCounter]) {
        playClickSound();
      }
      randomClickCounter++;
      if (randomClickCounter >= 4) {
        randomClickCounter = 0;
        randomBarCounter++;
        // Instead of restarting, fully stop when all bars finished
        if (randomBarCounter >= randomSilencePattern.length) {
          stopMetronome();
          randomModeEnabled = false;
          speedIcon.setAttribute('src', 'icons/random_off.png');
          fluteAudio.currentTime = 0;
          fluteAudio.play();
          currentMode = MODE_0;
          showResetIcon(); // <-- Add this line
          return; // Stop here
        }
      }
    } else {
      // Normal mode => always click
      playClickSound();
    }
    incrementBpm();
  }, intervalMs);
}

function buildRandomSilencePattern() {
  const totalBars = parseInt(randomBarsInput.value) || 10;
  const randomPercent = parseInt(randomPercentInput.value) || 50;
  randomSilencePattern = getRandomBarsSilenced(totalBars, randomPercent);
  randomBarCounter = 0;
  randomClickCounter = 0;
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

// New: Tap function to update BPM by consecutive clicks on BPM text
let tapTimes = []; // Store tap timestamps in ms
const TAP_RESET_DELAY = 2000; // Reset tap sequence if gap > 2000ms

bpmDisplay.addEventListener('click', () => {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > TAP_RESET_DELAY) {
    tapTimes = [];
  }
  tapTimes.push(now);
  if (tapTimes.length >= 2) {
    const intervalSum = tapTimes[tapTimes.length - 1] - tapTimes[0];
    const intervalsCount = tapTimes.length - 1;
    const averageInterval = intervalSum / intervalsCount;
    const newBpm = Math.round(60000 / averageInterval);
    // Constrain newBpm within allowed range
    bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, newBpm));
    updateBpmDisplay();
    if (isPlaying) {
      resetInterval();
    }
  }
});

// New: Inline editing using contenteditable (no input field)
bpmDisplay.addEventListener('dblclick', function () {
  bpmDisplay.setAttribute('contenteditable', 'true');
  // Remove any default focus styles
  bpmDisplay.style.backgroundColor = 'transparent';
  bpmDisplay.style.outline = 'none';
  bpmDisplay.focus();

  // Auto-select all text inside the bpmDisplay
  const range = document.createRange();
  range.selectNodeContents(bpmDisplay);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});

bpmDisplay.addEventListener('blur', function () {
  let newBpm = parseInt(bpmDisplay.textContent);
  if (isNaN(newBpm)) newBpm = bpm;
  if (newBpm < 30) newBpm = 30;
  if (newBpm > 300) newBpm = 300;
  bpm = newBpm;
  bpmDisplay.textContent = bpm;
  bpmDisplay.removeAttribute('contenteditable');

  if (isPlaying) {
    resetInterval();
  }
});

bpmDisplay.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent newline
    bpmDisplay.blur();
  }
});

// New: Toggle speed icon image on click, unless a swipe was detected
const speedIcon = document.getElementById('speedIcon');
speedIcon.addEventListener('click', (e) => {
  // If a swipe gesture just occurred, ignore this click
  if (speedIcon.dataset.swiped === "true") {
    speedIcon.dataset.swiped = "false";
    return;
  }
  
  const currentSrc = speedIcon.getAttribute('src');
  
  // Activate Speed Mode (from off to on)
  if (currentSrc.includes('speed_off.png')) {
    speedIcon.setAttribute('src', 'icons/speed_on.png');
    speedIcon.dataset.mode = "speed";
    speedIcon.dataset.state = "on";
    loadSpeedModeSettings();
    updateEstimatedTimeDisplay();
    speedModePopup.style.display = 'block';
    
    // Always reset to MODE_0 and clear timer
    currentMode = MODE_0;
    timerMs = 0;
    setTimerDisplay(timerMs);
    
    randomModeEnabled = false; // ensure random mode is off

  // Deactivate Speed Mode (from on to off) ONLY when metronome is paused
  } else if (currentSrc.includes('speed_on.png')) {
    if (isPlaying) return; // disable deactivation when running
    speedIcon.setAttribute('src', 'icons/speed_off.png');
    speedIcon.dataset.state = "off";
    speedModePopup.style.display = 'none';
    speedModeEnabled = false;
    
  // Activate Random Mode (from off to on)
  } else if (currentSrc.includes('random_off.png')) {
    speedIcon.setAttribute('src', 'icons/random_on.png');
    speedIcon.dataset.mode = "random";
    speedIcon.dataset.state = "on";
    loadRandomModeSettings();
    buildRandomSilencePattern();
    randomModeEnabled = true;
    randomModePopup.style.display = 'block';

  // Deactivate Random Mode (from on to off) ONLY when metronome is paused
  } else if (currentSrc.includes('random_on.png')) {
    if (isPlaying) return; // disable deactivation when running
    speedIcon.setAttribute('src', 'icons/random_off.png');
    speedIcon.dataset.state = "off";
    randomModePopup.style.display = 'none';
    randomModeEnabled = false;
  }
});

closePopup.addEventListener('click', () => {
  speedModePopup.style.display = 'none';
});

saveSpeedMode.addEventListener('click', () => {
  saveSpeedModeSettings();
  speedModeEnabled = true;
  bpm = initialBpm;
  updateBpmDisplay();
  speedModePopup.style.display = 'none';
});

// New: Estimated time calculation for Speed Mode (refined)
function calculateEstimatedTime(initial, final, increment, bars, clicks = 4) {
    if (initial >= final) return 0;
    let totalSeconds = 0;
    for (let currentBpm = initial; currentBpm < final; currentBpm += increment) {
        totalSeconds += (bars * clicks * 60) / currentBpm;
    }
    return totalSeconds;
}

// Existing estimated time display element.
const estimatedTimeDisplay = document.getElementById('estimatedTime');

// Update the estimated time display.
function updateEstimatedTimeDisplay() {
    const initBpm = parseInt(initialBpmInput.value) || 0;
    const finBpm = parseInt(finalBpmInput.value) || 0;
    const inc = parseInt(incrementInput.value) || 5;
    const bars = parseInt(barsInput.value) || 4;
    const totalSec = calculateEstimatedTime(initBpm, finBpm, inc, bars);
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.round(totalSec % 60);
    estimatedTimeDisplay.textContent = `Estimated time: ${minutes} min ${seconds} sec`;
}

// Debounce the update function to allow smoother interaction.
let debounceTimer;
function updateEstimatedTimeDisplayDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateEstimatedTimeDisplay, 300);
}

// Update estimated time when any Speed Mode input changes.
initialBpmInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
finalBpmInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
incrementInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
barsInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);

// Update estimated time immediately on every input change.
initialBpmInput.addEventListener('input', updateEstimatedTimeDisplay);
finalBpmInput.addEventListener('input', updateEstimatedTimeDisplay);
incrementInput.addEventListener('input', updateEstimatedTimeDisplay);
barsInput.addEventListener('input', updateEstimatedTimeDisplay);

// Call once on load to show the correct value.
updateEstimatedTimeDisplay();

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
  if (!isPlaying) {
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
// ---------------------
// 8) Swipe Toggle Function for Speed Icon (Improved)
// ---------------------
(function () {
  const icon = speedIcon;
  icon.style.touchAction = 'none';

  let swipeStartX = null;
  let isDragging = false;

  const SWIPE_THRESHOLD = 30;

  // Remove any transitions when starting to drag
  icon.addEventListener('pointerdown', (e) => {
    // Only allow swiping when no mode is active (state "off")
    if (icon.dataset.state !== "off") return;
    
    swipeStartX = e.clientX;
    isDragging = false;
    icon.setPointerCapture(e.pointerId);
    icon.style.transition = 'none';
  });

  // Move the icon as you drag; only works if swipeStartX was set.
  icon.addEventListener('pointermove', (e) => {
    if (swipeStartX === null) return;
    const deltaX = e.clientX - swipeStartX;
    isDragging = true;
    icon.style.transform = `translateX(${deltaX}px)`;
    e.preventDefault();
  });

  // Decide whether to toggle mode when releasing
  icon.addEventListener('pointerup', handlePointerEnd);
  icon.addEventListener('pointercancel', handlePointerEnd);

  function handlePointerEnd(e) {
    // If swiping never started, exit early
    if (swipeStartX === null) return;
    
    const deltaX = e.clientX - (swipeStartX || 0);
    icon.style.transition = 'transform 0.2s ease-out';

    if (isDragging && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      icon.dataset.swiped = 'true';
      const currentSrc = icon.getAttribute('src');
      // Toggle between speed and random only when swiping is allowed.
      if (currentSrc.includes('speed_')) {
        icon.setAttribute('src', currentSrc.includes('speed_off.png')
          ? 'icons/random_off.png'
          : 'icons/speed_off.png');
      } else {
        icon.setAttribute('src', currentSrc.includes('random_off.png')
          ? 'icons/speed_off.png'
          : 'icons/random_off.png');
      }
    }

    // Snap back
    icon.style.transform = 'translateX(0px)';
    swipeStartX = null;
    isDragging = false;
  }
})();

// Random Mode elements
const randomModePopup = document.getElementById('randomModePopup');
const closeRandomPopup = document.getElementById('closeRandomPopup');
const saveRandomMode = document.getElementById('saveRandomMode');
const randomPercentInput = document.getElementById('randomPercent');
const randomBarsInput = document.getElementById('randomBars');

function loadRandomModeSettings() {
  const storedRandomPercent = localStorage.getItem('randomPercent');
  const storedRandomBars = localStorage.getItem('randomBars');
  randomPercentInput.value = storedRandomPercent ? parseInt(storedRandomPercent) : 50;
  randomBarsInput.value = storedRandomBars ? parseInt(storedRandomBars) : 10;
}

function saveRandomModeSettings() {
  localStorage.setItem('randomPercent', randomPercentInput.value);
  localStorage.setItem('randomBars', randomBarsInput.value);
}

// Returns an array of booleans (true => silent) for each bar. First bar is never silent.
function getRandomBarsSilenced(totalBars, randomPercent) {
  const result = new Array(totalBars).fill(false);
  // First bar always hearable
  const toMute = Math.floor((randomPercent / 100) * (totalBars - 1));
  let indexes = [...Array(totalBars - 1).keys()].map(i => i + 1); // bars [1..(totalBars-1)]
  // Shuffle array
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  // Mark first N as silent
  indexes.slice(0, toMute).forEach(idx => result[idx] = true);
  return result;
}

closeRandomPopup.addEventListener('click', () => {
  randomModePopup.style.display = 'none';
});

saveRandomMode.addEventListener('click', () => {
  saveRandomModeSettings();
  buildRandomSilencePattern(); 
  randomModeEnabled = true;   // Turn on random mode
  randomModePopup.style.display = 'none';
});
