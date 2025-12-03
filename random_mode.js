// ---------- Random Mode Variables ----------
let randomModeEnabled = false;
let randomSilencePattern = [];
let randomBarCounter = 0;
let randomClickCounter = 0;

const randomModePopup = document.getElementById('randomModePopup');
const closeRandomPopup = document.getElementById('closeRandomPopup');
const saveRandomMode = document.getElementById('saveRandomMode');
const randomPercentInput = document.getElementById('randomPercent');
const randomBarsInput = document.getElementById('randomBars');

// ---------- Random Mode Functions ----------
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

function getRandomBarsSilenced(totalBars, randomPercent) {
    const result = new Array(totalBars).fill(false);
    // First bar always audible
    const toMute = Math.floor((randomPercent / 100) * (totalBars - 1));
    let indexes = [...Array(totalBars - 1).keys()].map(i => i + 1);
    // Shuffle array
    for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    indexes.slice(0, toMute).forEach(idx => result[idx] = true);
    return result;
}

function buildRandomSilencePattern() {
    const totalBars = parseInt(randomBarsInput.value) || 10;
    const randomPercent = parseInt(randomPercentInput.value) || 50;
    randomSilencePattern = getRandomBarsSilenced(totalBars, randomPercent);
    randomBarCounter = 0;
    randomClickCounter = 0;
}

// ---------- Random Mode Event Listeners ----------
closeRandomPopup.addEventListener('click', () => {
    randomModePopup.style.display = 'none';
});

saveRandomMode.addEventListener('click', () => {
    saveRandomModeSettings();
    buildRandomSilencePattern(); 
    randomModeEnabled = true;
    randomModePopup.style.display = 'none';
});