// ---------- Speed Mode Variables ----------
let speedModeEnabled = false;
let initialBpm = 100;
let finalBpm = 120;
let speedIncrement = 5;
let barsPerIncrement = 4;
let clickCount = 0;

const speedModePopup = document.getElementById('speedModePopup');
const closePopup = document.getElementById('closePopup');
const saveSpeedMode = document.getElementById('saveSpeedMode');
const initialBpmInput = document.getElementById('initialBpm');
const finalBpmInput = document.getElementById('finalBpm');
const incrementInput = document.getElementById('increment');
const barsInput = document.getElementById('bars');
const estimatedTimeDisplay = document.getElementById('estimatedTime');

const progressBar = document.querySelector('.progress-bar');
let circumference = 0;  // this will be dynamically updated

let debounceTimer;

// ---------- Speed Mode Functions ----------

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

function calculateEstimatedTime(initial, fin, increment, bars, clicks = 4) {
    // If initial is at or above target, simulate a single lap.
    if (initial >= fin) return (bars * clicks * 60) / initial;

    let totalSeconds = 0;
    let currentBpm = initial;
    // Add segments for each lap until reaching the final BPM
    while (currentBpm < fin) {
        totalSeconds += (bars * clicks * 60) / currentBpm;
        let newBpm = currentBpm + increment;
        if (newBpm >= fin) {
            // The next lap will be at final BPM
            currentBpm = fin;
        } else {
            currentBpm = newBpm;
        }
    }
    // Add one extra lap at the final BPM
    totalSeconds += (bars * clicks * 60) / fin;
    return totalSeconds;
}

function updateEstimatedTimeDisplay() {
    const initBpm = parseInt(initialBpmInput.value) || 0;
    const finBpm  = parseInt(finalBpmInput.value) || 0;
    const inc     = parseInt(incrementInput.value) || 5;
    const bars    = parseInt(barsInput.value) || 4;
    const totalSec = calculateEstimatedTime(initBpm, finBpm, inc, bars);
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.round(totalSec % 60);
    estimatedTimeDisplay.textContent = `Estimated time: ${minutes} min ${seconds} sec`;
}

function updateEstimatedTimeDisplayDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateEstimatedTimeDisplay, 300);
}

// ---------- Speed Mode Event Listeners ----------
closePopup.addEventListener('click', () => {
    speedModePopup.style.display = 'none';
});

saveSpeedMode.addEventListener('click', () => {
    saveSpeedModeSettings();
    speedModeEnabled = true;
    // Assumes bpm, updateBpmDisplay, etc. are defined in script.js
    bpm = initialBpm;
    updateBpmDisplay();
    speedModePopup.style.display = 'none';
});

initialBpmInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
finalBpmInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
incrementInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);
barsInput.addEventListener('input', updateEstimatedTimeDisplayDebounced);

initialBpmInput.addEventListener('input', updateEstimatedTimeDisplay);
finalBpmInput.addEventListener('input', updateEstimatedTimeDisplay);
incrementInput.addEventListener('input', updateEstimatedTimeDisplay);
barsInput.addEventListener('input', updateEstimatedTimeDisplay);

updateEstimatedTimeDisplay();

// ---------- Speed Mode Increment Function ----------

function incrementBpm() {
    // This function is called from script.js (via resetInterval)
    if (speedModeEnabled && isPlaying) {
        clickCount++;
        updateProgressIndicator();  // update progress after each click
        
        if (clickCount >= barsPerIncrement * 4) {
            clickCount = 0;
            updateProgressIndicator();  // reset indicator
            if (bpm < finalBpm) {
                // Increase BPM but do not pass finalBpm.
                let newBpm = bpm + speedIncrement;
                if (newBpm >= finalBpm) {
                    bpm = finalBpm; // set final BPM and complete the lap
                } else {
                    bpm = newBpm;
                }
                updateBpmDisplay();
                resetInterval();
            } else {
                // Already at final BPM: complete this lap and then stop.
                stopMetronome();
                // Optionally, reset bpm (if desired)
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

// Use the already-defined global variable "progressBar"
function updateProgressIndicator() {
    if (!progressBar) return;
    const totalClicks = barsPerIncrement * 4;  // a lap consists of these many clicks
    let progress = clickCount / totalClicks;   // value between 0 and 1
    let offset = circumference * (1 - progress);
    progressBar.style.strokeDashoffset = offset;
}

function adjustProgressIndicatorSizing() {
    const playIcon = document.getElementById('playPauseBtn');
    const circleContainer = document.querySelector('.play-circle-container');
    const progressIndicator = document.querySelector('.progress-indicator');
    const progressBg = document.querySelector('.progress-bg');
    const progressBarEl = document.querySelector('.progress-bar');

    // Get the current play icon size (assume square)
    const iconRect = playIcon.getBoundingClientRect();
    const iconSize = iconRect.width;
    // Set container size to be 10% larger than the icon
    const containerSize = iconSize * 1.1;

    // Update container and SVG sizes
    circleContainer.style.width = containerSize + 'px';
    circleContainer.style.height = containerSize + 'px';
    progressIndicator.style.width = containerSize + 'px';
    progressIndicator.style.height = containerSize + 'px';
    // Set the viewBox so our SVG coordinates run from 0 to containerSize
    progressIndicator.setAttribute('viewBox', `0 0 ${containerSize} ${containerSize}`);

    // Define stroke width relative to container size (10% in this example)
    const strokeW = containerSize * 0.1;
    // Calculate circle radius: half container minus half of stroke
    const radius = containerSize / 2 - strokeW / 2;
    const center = containerSize / 2;

    // Configure background circle
    progressBg.setAttribute('cx', center);
    progressBg.setAttribute('cy', center);
    progressBg.setAttribute('r', radius);
    progressBg.setAttribute('fill', 'none');
    progressBg.setAttribute('stroke', '#ccc');
    progressBg.setAttribute('stroke-width', strokeW);

    // Configure progress circle
    progressBarEl.setAttribute('cx', center);
    progressBarEl.setAttribute('cy', center);
    progressBarEl.setAttribute('r', radius);
    progressBarEl.setAttribute('fill', 'none');
    progressBarEl.setAttribute('stroke', '#29be6f');
    progressBarEl.setAttribute('stroke-width', strokeW);

    // Calculate new circumference and update dash values.
    const newCircumference = 2 * Math.PI * radius;
    progressBarEl.setAttribute('stroke-dasharray', newCircumference);
    progressBarEl.setAttribute('stroke-dashoffset', newCircumference);

    // Update global circumference for progress updates.
    circumference = newCircumference;
}

// Call this function when DOM is ready (or at the start of speed mode)
document.addEventListener('DOMContentLoaded', adjustProgressIndicatorSizing);
// Also call adjustProgressIndicatorSizing() just before starting speed mode if needed.