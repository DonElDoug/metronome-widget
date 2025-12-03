// ----------------------------------------------------
// Speed Mode Strategy
// ----------------------------------------------------

class SpeedModeStrategy {
    constructor() {
        this.initialBpm = 100;
        this.finalBpm = 120;
        this.speedIncrement = 5;
        this.barsPerIncrement = 4;
        this.clickCount = 0;
        
        this.ui = {}; // Initialize empty
        
        this.circumference = 0;
        this.debounceTimer = null;
    }

    init() {
        this.ui = {
            popup: document.getElementById('speedModePopup'),
            closeBtn: document.getElementById('closePopup'),
            saveBtn: document.getElementById('saveSpeedMode'),
            initialBpmInput: document.getElementById('initialBpm'),
            finalBpmInput: document.getElementById('finalBpm'),
            incrementInput: document.getElementById('increment'),
            barsInput: document.getElementById('bars'),
            estimatedTimeDisplay: document.getElementById('estimatedTime'),
            progressBar: document.querySelector('.progress-bar')
        };

        this.bindEvents();
        this.loadSettings();
        this.adjustProgressIndicatorSizing();
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
                // Enable Speed Mode
                if (window.metronomeApp) {
                    window.metronomeApp.setBpm(this.initialBpm);
                    window.metronomeApp.setStrategy('SPEED');
                    this.ui.popup.style.display = 'none';
                }
            });
        }

        const update = () => this.updateEstimatedTimeDisplayDebounced();
        if (this.ui.initialBpmInput) this.ui.initialBpmInput.addEventListener('input', update);
        if (this.ui.finalBpmInput) this.ui.finalBpmInput.addEventListener('input', update);
        if (this.ui.incrementInput) this.ui.incrementInput.addEventListener('input', update);
        if (this.ui.barsInput) this.ui.barsInput.addEventListener('input', update);
    }

    loadSettings() {
        this.initialBpm = parseInt(localStorage.getItem('initialBpm')) || 100;
        this.finalBpm = parseInt(localStorage.getItem('finalBpm')) || 180;
        this.speedIncrement = parseInt(localStorage.getItem('increment')) || 5;
        this.barsPerIncrement = parseInt(localStorage.getItem('bars')) || 16;

        if (this.ui.initialBpmInput) this.ui.initialBpmInput.value = this.initialBpm;
        if (this.ui.finalBpmInput) this.ui.finalBpmInput.value = this.finalBpm;
        if (this.ui.incrementInput) this.ui.incrementInput.value = this.speedIncrement;
        if (this.ui.barsInput) this.ui.barsInput.value = this.barsPerIncrement;
    }

    saveSettings() {
        const initial = parseInt(this.ui.initialBpmInput.value);
        const final = parseInt(this.ui.finalBpmInput.value);
        const increment = parseInt(this.ui.incrementInput.value);
        const bars = parseInt(this.ui.barsInput.value);

        // Validation
        if (isNaN(initial) || initial < 20 || initial > 300) {
            alert('Initial BPM must be between 20 and 300');
            return;
        }
        if (isNaN(final) || final < 20 || final > 300) {
            alert('Final BPM must be between 20 and 300');
            return;
        }
        if (initial >= final) {
            alert('Initial BPM must be less than Final BPM');
            return;
        }
        if (isNaN(increment) || increment < 1 || increment > 50) {
            alert('Increment must be between 1 and 50');
            return;
        }
        if (isNaN(bars) || bars < 1 || bars > 100) {
            alert('Bars must be between 1 and 100');
            return;
        }

        this.initialBpm = initial;
        this.finalBpm = final;
        this.speedIncrement = increment;
        this.barsPerIncrement = bars;

        localStorage.setItem('initialBpm', this.initialBpm);
        localStorage.setItem('finalBpm', this.finalBpm);
        localStorage.setItem('increment', this.speedIncrement);
        localStorage.setItem('bars', this.barsPerIncrement);
    }

    calculateEstimatedTime(initial, fin, increment, bars, clicks = 4) {
        if (initial >= fin) return (bars * clicks * 60) / initial;
        let totalSeconds = 0;
        let currentBpm = initial;
        while (currentBpm < fin) {
            totalSeconds += (bars * clicks * 60) / currentBpm;
            let newBpm = currentBpm + increment;
            if (newBpm >= fin) currentBpm = fin;
            else currentBpm = newBpm;
        }
        totalSeconds += (bars * clicks * 60) / fin;
        return totalSeconds;
    }

    updateEstimatedTimeDisplay() {
        if (!this.ui.initialBpmInput) return; // Safety check
        const initBpm = parseInt(this.ui.initialBpmInput.value) || 0;
        const finBpm  = parseInt(this.ui.finalBpmInput.value) || 0;
        const inc     = parseInt(this.ui.incrementInput.value) || 5;
        const bars    = parseInt(this.ui.barsInput.value) || 4;
        const totalSec = this.calculateEstimatedTime(initBpm, finBpm, inc, bars);
        const minutes = Math.floor(totalSec / 60);
        const seconds = Math.round(totalSec % 60);
        if (this.ui.estimatedTimeDisplay) {
            this.ui.estimatedTimeDisplay.textContent = `Estimated time: ${minutes} min ${seconds} sec`;
        }
    }

    updateEstimatedTimeDisplayDebounced() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.updateEstimatedTimeDisplay(), 300);
    }

    openPopup() {
        this.loadSettings();
        this.updateEstimatedTimeDisplay();
    }

    // --- Strategy Interface ---

    shouldPlay() { return true; }

    onBeat(app) {
        this.clickCount++;
        this.updateProgressIndicator();
        
        if (this.clickCount >= this.barsPerIncrement * 4) {
            this.clickCount = 0;
            this.updateProgressIndicator();
            
            if (app.bpm < this.finalBpm) {
                let newBpm = app.bpm + this.speedIncrement;
                if (newBpm >= this.finalBpm) {
                    app.setBpm(this.finalBpm);
                } else {
                    app.setBpm(newBpm);
                }
            } else {
                // Finished
                app.stop();
                app.setBpm(this.initialBpm);
                app.setStrategy('NORMAL');
                
                app.ui.speedIcon.dataset.state = 'off';
                app.ui.speedIcon.style.opacity = '';
                app.ui.speedIcon.style.color = '';
                
                app.fluteAudio.currentTime = 0;
                app.fluteAudio.play();
                app.timerMode = app.MODE_TIMER_INITIAL;
            }
        }
    }
    
    reset() {
        this.clickCount = 0;
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        if (!this.ui.progressBar) return;
        const totalClicks = this.barsPerIncrement * 4;
        let progress = this.clickCount / totalClicks;
        let offset = this.circumference * (1 - progress);
        this.ui.progressBar.style.strokeDashoffset = offset;
    }

    adjustProgressIndicatorSizing() {
        const playIcon = document.getElementById('playPauseBtn');
        if (!playIcon) return;
        
        const circleContainer = document.querySelector('.play-circle-container');
        const progressIndicator = document.querySelector('.progress-indicator');
        const progressBg = document.querySelector('.progress-bg');
        const progressBarEl = document.querySelector('.progress-bar');

        const iconRect = playIcon.getBoundingClientRect();
        const iconSize = iconRect.width || 40; // Fallback
        const containerSize = iconSize * 1.1;

        if (circleContainer) {
            circleContainer.style.width = containerSize + 'px';
            circleContainer.style.height = containerSize + 'px';
        }
        if (progressIndicator) {
            progressIndicator.style.width = containerSize + 'px';
            progressIndicator.style.height = containerSize + 'px';
            progressIndicator.setAttribute('viewBox', `0 0 ${containerSize} ${containerSize}`);
        }

        const strokeW = containerSize * 0.1;
        const radius = containerSize / 2 - strokeW / 2;
        const center = containerSize / 2;

        if (progressBg) {
            progressBg.setAttribute('cx', center);
            progressBg.setAttribute('cy', center);
            progressBg.setAttribute('r', radius);
            progressBg.setAttribute('stroke-width', strokeW);
        }

        if (progressBarEl) {
            progressBarEl.setAttribute('cx', center);
            progressBarEl.setAttribute('cy', center);
            progressBarEl.setAttribute('r', radius);
            progressBarEl.setAttribute('stroke-width', strokeW);

            const newCircumference = 2 * Math.PI * radius;
            progressBarEl.setAttribute('stroke-dasharray', newCircumference);
            progressBarEl.setAttribute('stroke-dashoffset', newCircumference);
            this.circumference = newCircumference;
        }
    }
}

const speedModeStrategy = new SpeedModeStrategy();

// Register when app is ready (event-driven)
window.addEventListener('metronome:ready', (e) => {
    const app = e.detail;
    speedModeStrategy.init();
    app.registerStrategy('SPEED', speedModeStrategy);
});
