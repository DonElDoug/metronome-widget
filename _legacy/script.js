// ----------------------------------------------------
// Metronome & Timer Combined Core Logic (Core Only – Speed/Random mode code removed)
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
const MAX_COUNTDOWN_MS = 30 * 60 * 1000; // 30 minutes in ms

// ---------------------
// 3) Metronome Functions
// ---------------------
function updateBpmDisplay() {
  bpmDisplay.textContent = bpm;
}

// Preload click sound into AudioContext buffer (for mobile)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let clickBuffer = null;

fetch('audio/click.wav')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  .then(buffer => { clickBuffer = buffer; })
  .catch(err => console.error('Error loading click sound:', err));

function playClickSound() {
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

// ---------------------
// 4) Core Interval (includes bridging to Speed & Random Modes)
// ---------------------
function resetInterval() {
  if (intervalId) clearInterval(intervalId);
  const intervalMs = 60000 / bpm;
  intervalId = setInterval(() => {
    if (randomModeEnabled) {
      // In Random Mode, check if current bar is silent.
      if (!randomSilencePattern[randomBarCounter]) {
        playClickSound();
      }
      randomClickCounter++;
      if (randomClickCounter >= 4) {
        randomClickCounter = 0;
        randomBarCounter++;
        if (randomBarCounter >= randomSilencePattern.length) {
          stopMetronome();
          randomModeEnabled = false;
          speedIcon.setAttribute('src', 'icons/random_off.png');
          fluteAudio.currentTime = 0;
          fluteAudio.play();
          currentMode = MODE_0;
          showResetIcon();
          return;
        }
      }
    } else {
      playClickSound();
    }
    // Call Speed Mode BPM increment (defined in speed_mode.js)
    incrementBpm();
  }, intervalMs);
}

// ---------------------
// 5) Metronome Start/Stop Functions
// ---------------------
function startMetronome() {
  if (!isPlaying) {
    isPlaying = true;
    playPauseBtn.src = 'icons/pause_icon.png';
    resetInterval();

    if (currentMode === MODE_0) {
      currentMode = timerMs === 0 ? MODE_2 : MODE_1;
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
// 6) BPM Buttons
// ---------------------
minusBtn.addEventListener('click', (event) => {
  if (event.ctrlKey) {
    bpm = (bpm % 5 !== 0) ? Math.floor(bpm / 5) * 5 : Math.max(MIN_BPM, bpm - 5);
  } else {
    bpm = Math.max(MIN_BPM, bpm - 1);
  }
  updateBpmDisplay();
  if (isPlaying) resetInterval();
});

plusBtn.addEventListener('click', (event) => {
  if (event.ctrlKey) {
    bpm = (bpm % 5 !== 0) ? Math.ceil(bpm / 5) * 5 : Math.min(MAX_BPM, bpm + 5);
  } else {
    bpm = Math.min(MAX_BPM, bpm + 1);
  }
  updateBpmDisplay();
  if (isPlaying) resetInterval();
});

// ---------------------
// 7) Play/Pause Toggle
// ---------------------
playPauseBtn.addEventListener('click', () => {
  isPlaying ? stopMetronome() : startMetronome();
});

// Initialize display
updateBpmDisplay();

// ---------------------
// 8) Tap Tempo & Inline Edit on BPM Display
// ---------------------
let tapTimes = [];
const TAP_RESET_DELAY = 2000;

bpmDisplay.addEventListener('click', () => {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > TAP_RESET_DELAY) {
    tapTimes = [];
  }
  tapTimes.push(now);
  if (tapTimes.length >= 2) {
    const intervalSum = tapTimes[tapTimes.length - 1] - tapTimes[0];
    const averageInterval = intervalSum / (tapTimes.length - 1);
    const newBpm = Math.round(60000 / averageInterval);
    bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, newBpm));
    updateBpmDisplay();
    if (isPlaying) resetInterval();
  }
});

bpmDisplay.addEventListener('dblclick', function () {
  bpmDisplay.setAttribute('contenteditable', 'true');
  bpmDisplay.style.backgroundColor = 'transparent';
  bpmDisplay.style.outline = 'none';
  bpmDisplay.focus();
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
  if (isPlaying) resetInterval();
});

bpmDisplay.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    bpmDisplay.blur();
  }
});

// ---------------------
// 9) Speed Icon (Mode Toggle) Event Handler
// ---------------------
const speedIcon = document.getElementById('speedIcon');
speedIcon.addEventListener('click', (e) => {
  // Ignore click if swipe just occurred
  if (speedIcon.dataset.swiped === "true") {
    speedIcon.dataset.swiped = "false";
    return;
  }
  
  const currentSrc = speedIcon.getAttribute('src');
  
  // Activate Speed Mode (off -> on)
  if (currentSrc.includes('speed_off.png')) {
    speedIcon.setAttribute('src', 'icons/speed_on.png');
    speedIcon.dataset.mode = "speed";
    speedIcon.dataset.state = "on";
    loadSpeedModeSettings();
    updateEstimatedTimeDisplay();
    speedModePopup.style.display = 'block';
    currentMode = MODE_0;
    timerMs = 0;
    setTimerDisplay(timerMs);
    randomModeEnabled = false;
  
  // Deactivate Speed Mode (on -> off) when paused
  } else if (currentSrc.includes('speed_on.png')) {
    if (isPlaying) return;
    speedIcon.setAttribute('src', 'icons/speed_off.png');
    speedIcon.dataset.state = "off";
    speedModePopup.style.display = 'none';
    speedModeEnabled = false;
    
    // RESET progress indicator when speed mode is deactivated
    clickCount = 0;
    updateProgressIndicator();
  
  // Activate Random Mode (off -> on)
  } else if (currentSrc.includes('random_off.png')) {
    speedIcon.setAttribute('src', 'icons/random_on.png');
    speedIcon.dataset.mode = "random";
    speedIcon.dataset.state = "on";
    loadRandomModeSettings();
    buildRandomSilencePattern();
    randomModeEnabled = true;
    randomModePopup.style.display = 'block';
  
  // Deactivate Random Mode (on -> off) when paused
  } else if (currentSrc.includes('random_on.png')) {
    if (isPlaying) return;
    speedIcon.setAttribute('src', 'icons/random_off.png');
    speedIcon.dataset.state = "off";
    randomModePopup.style.display = 'none';
    randomModeEnabled = false;
  }
});

// ---------------------
// 10) Timer Logic (MS conversion, display update, and rAF loop)
// ---------------------
function parseTimeString(str) {
  const [mmss, ff] = str.split(';');
  const [mm, ss] = mmss.split(':');
  return Number(mm) * 60000 + Number(ss) * 1000 + Number(ff) * 10;
}

function formatTime(ms) {
  if (ms < 0) ms = 0;
  const totalHundredths = Math.floor(ms / 10);
  const hundredths = totalHundredths % 100;
  const totalSeconds = Math.floor(totalHundredths / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')};${String(hundredths).padStart(2, '0')}`;
}

function setTimerDisplay(ms) {
  timerDisplay.textContent = formatTime(ms);
}

function updateTimer(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (currentMode === MODE_1) {
    timerMs -= deltaMs;
    if (timerMs <= 0) {
      timerMs = 0;
      setTimerDisplay(timerMs);
      fluteAudio.currentTime = 0;
      fluteAudio.play();
      stopMetronome();
      currentMode = MODE_0;
      return;
    }
    setTimerDisplay(timerMs);
  } else if (currentMode === MODE_2) {
    timerMs += deltaMs;
    setTimerDisplay(timerMs);
  }

  if (isPlaying) timerRAF = requestAnimationFrame(updateTimer);
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
  if (currentMode === MODE_2) showResetIcon();
}

// ---------------------
// 11) Timer UI Interactions
// ---------------------
timerDisplay.addEventListener('click', () => {
  if (!isPlaying && currentMode === MODE_0) {
    timerMs = Math.min(timerMs + 300000, MAX_COUNTDOWN_MS);
    setTimerDisplay(timerMs);
  }
});

resetIcon.addEventListener('click', () => {
  if (!isPlaying) {
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
// 12) Swipe Toggle for Speed Icon
// ---------------------
(function () {
  const icon = speedIcon;
  icon.style.touchAction = 'none';
  let swipeStartX = null;
  let isDragging = false;
  const SWIPE_THRESHOLD = 30;

  icon.addEventListener('pointerdown', (e) => {
    if (icon.dataset.state !== "off") return;
    swipeStartX = e.clientX;
    isDragging = false;
    icon.setPointerCapture(e.pointerId);
    icon.style.transition = 'none';
  });

  icon.addEventListener('pointermove', (e) => {
    if (swipeStartX === null) return;
    const deltaX = e.clientX - swipeStartX;
    isDragging = true;
    icon.style.transform = `translateX(${deltaX}px)`;
    e.preventDefault();
  });

  icon.addEventListener('pointerup', handlePointerEnd);
  icon.addEventListener('pointercancel', handlePointerEnd);

  function handlePointerEnd(e) {
    if (swipeStartX === null) return;
    const deltaX = e.clientX - swipeStartX;
    icon.style.transition = 'transform 0.2s ease-out';
    if (isDragging && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      icon.dataset.swiped = 'true';
      const currentSrc = icon.getAttribute('src');
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
    icon.style.transform = 'translateX(0px)';
    swipeStartX = null;
    isDragging = false;
  }
})();

// ---------------------
// 13) Settings (Theme: Background, Font, Accent)
// ---------------------
const settingsIcon = document.getElementById('settingsIcon');
const settingsPopup = document.getElementById('settingsPopup');
const closeSettingsPopup = document.getElementById('closeSettingsPopup');
const saveSettings = document.getElementById('saveSettings');

const bgColorPicker = document.getElementById('bgColorPicker');
const fontColorPicker = document.getElementById('fontColorPicker');
const accentColorPicker = document.getElementById('accentColorPicker');

// Helper to darken color for hover state
function darkenColor(hex, amount = -20) {
  let usePound = false;
  if (hex[0] === "#") {
    hex = hex.slice(1);
    usePound = true;
  }
  let num = parseInt(hex, 16);
  let r = (num >> 16) + amount;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  
  let b = ((num >> 8) & 0x00FF) + amount;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  
  let g = (num & 0x0000FF) + amount;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function applyTheme(bg, font, accent) {
  const root = document.documentElement;
  root.style.setProperty('--bg-color', bg);
  root.style.setProperty('--text-color', font);
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--accent-hover', darkenColor(accent, -20));
}

// Load saved theme
function loadTheme() {
  const savedBg = localStorage.getItem('theme_bg') || '#262626';
  const savedFont = localStorage.getItem('theme_font') || '#ffffff';
  const savedAccent = localStorage.getItem('theme_accent') || '#29be6f';

  bgColorPicker.value = savedBg;
  fontColorPicker.value = savedFont;
  accentColorPicker.value = savedAccent;

  applyTheme(savedBg, savedFont, savedAccent);
}

// Settings icon click
settingsIcon.addEventListener('click', () => {
  settingsPopup.style.display = 'block';
});

// Close settings popup
closeSettingsPopup.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
  // Revert to saved if cancelled? 
  // For now, we keep the live changes or we could reload. 
  // Let's reload to ensure "Cancel" behavior if user didn't click save.
  loadTheme(); 
});

// Live Preview Listeners
bgColorPicker.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--bg-color', e.target.value);
});

fontColorPicker.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--text-color', e.target.value);
});

accentColorPicker.addEventListener('input', (e) => {
  const accent = e.target.value;
  document.documentElement.style.setProperty('--accent-color', accent);
  document.documentElement.style.setProperty('--accent-hover', darkenColor(accent, -20));
});

// Save settings
saveSettings.addEventListener('click', () => {
  const bg = bgColorPicker.value;
  const font = fontColorPicker.value;
  const accent = accentColorPicker.value;

  localStorage.setItem('theme_bg', bg);
  localStorage.setItem('theme_font', font);
  localStorage.setItem('theme_accent', accent);

  applyTheme(bg, font, accent);
  settingsPopup.style.display = 'none';
});

// Initialize theme on load
loadTheme();
