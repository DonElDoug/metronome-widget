// ----------------------------------------------------
// Random Mode Strategy
// ----------------------------------------------------

class RandomModeStrategy {
    constructor() {
        this.pattern = [];
        this.barCounter = 0;
        this.clickCounter = 0;
        this.ui = {}; // Initialize empty
    }

    init() {
        this.ui = {
            popup: document.getElementById('randomModePopup'),
            closeBtn: document.getElementById('closeRandomPopup'),
            saveBtn: document.getElementById('saveRandomMode'),
            percentInput: document.getElementById('randomPercent'),
            barsInput: document.getElementById('randomBars')
        };
        this.bindEvents();
    }

    bindEvents() {
        if (this.ui.closeBtn) {
            this.ui.closeBtn.addEventListener('click', () => {
                this.ui.popup.style.display = 'none';
            });
        }

        if (this.ui.saveBtn) {
            this.ui.saveBtn.addEventListener('click', () => {
                this.saveSettings();
                this.buildPattern();
                if (window.metronomeApp) {
                    window.metronomeApp.setStrategy('RANDOM');
                    this.ui.popup.style.display = 'none';
                }
            });
        }
    }

    loadSettings() {
        const p = localStorage.getItem('randomPercent');
        const b = localStorage.getItem('randomBars');
        this.ui.percentInput.value = p ? parseInt(p) : 50;
        this.ui.barsInput.value = b ? parseInt(b) : 10;
    }

    saveSettings() {
        const percent = parseInt(this.ui.percentInput.value);
        const bars = parseInt(this.ui.barsInput.value);

        // Validation
        if (isNaN(percent) || percent < 0 || percent > 100) {
            alert('Random % must be between 0 and 100');
            return;
        }
        if (isNaN(bars) || bars < 1 || bars > 100) {
            alert('Bars must be between 1 and 100');
            return;
        }

        localStorage.setItem('randomPercent', percent);
        localStorage.setItem('randomBars', bars);
    }

    openPopup() {
        this.loadSettings();
        this.buildPattern();
    }

    buildPattern() {
        const totalBars = parseInt(this.ui.barsInput.value) || 10;
        const percent = parseInt(this.ui.percentInput.value) || 50;
        this.pattern = this.generatePattern(totalBars, percent);
        this.barCounter = 0;
        this.clickCounter = 0;
    }

    generatePattern(total, percent) {
        const result = new Array(total).fill(false);
        // First bar always audible (index 0 is false)
        const toMute = Math.floor((percent / 100) * (total - 1));
        let indexes = [...Array(total - 1).keys()].map(i => i + 1);
        // Shuffle
        for (let i = indexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }
        indexes.slice(0, toMute).forEach(idx => result[idx] = true);
        return result;
    }

    // --- Strategy Interface ---

    shouldPlay() {
        // If current bar is silenced (true), return false
        return !this.pattern[this.barCounter];
    }

    onBeat(app) {
        this.clickCounter++;
        if (this.clickCounter >= 4) {
            this.clickCounter = 0;
            this.barCounter++;
            
            if (this.barCounter >= this.pattern.length) {
                // Finished
                app.stop();
                app.setStrategy('NORMAL');
                
                // Reset UI
                app.ui.speedIcon.dataset.state = 'off';
                app.ui.speedIcon.style.opacity = '';
                app.ui.speedIcon.style.color = '';
                
                app.fluteAudio.currentTime = 0;
                app.fluteAudio.play();
                app.timerMode = app.MODE_TIMER_INITIAL;
                app.showResetIcon();
            }
        }
    }
    
    reset() {
        this.barCounter = 0;
        this.clickCounter = 0;
    }
}

const randomModeStrategy = new RandomModeStrategy();

// Register when app is ready (event-driven)
window.addEventListener('metronome:ready', (e) => {
    const app = e.detail;
    randomModeStrategy.init();
    app.registerStrategy('RANDOM', randomModeStrategy);
});
