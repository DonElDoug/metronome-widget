// ----------------------------------------------------
// Metronome & Timer Combined Core Logic
// Refactored for Performance (Web Audio Scheduler) & Structure
// ----------------------------------------------------

// ==========================================
// 1. Metronome Engine (Web Audio Scheduler)
// ==========================================
class MetronomeEngine {
    constructor(audioContext, onTick) {
        this.audioContext = audioContext;
        this.onTick = onTick; // Callback(time)
        this.isPlaying = false;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // sec
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.bpm = 100;
        
        this.clickBuffer = null;
        this.loadSound('audio/click.wav');
    }

    async loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.clickBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (err) {
            console.error('Error loading sound:', err);
        }
    }

    start() {
        if (this.isPlaying) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.isPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.onTick(this.nextNoteTime);
            this.nextNote();
        }
        if (this.isPlaying) {
            this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
        }
    }

    playClickAt(time) {
        if (this.clickBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.clickBuffer;
            source.connect(this.audioContext.destination);
            source.start(time);
        }
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
    }
}

// ==========================================
// 2. Metronome App (Controller & State)
// ==========================================
class MetronomeApp {
    constructor() {
        // Constants
        this.MIN_BPM = 20;
        this.MAX_BPM = 300;
        this.MODE_TIMER_INITIAL = 0;
        this.MODE_TIMER_COUNTDOWN = 1;
        this.MODE_TIMER_STOPWATCH = 2;
        this.MAX_COUNTDOWN_MS = 30 * 60 * 1000;

        // State
        this.bpm = 100;
        this.isPlaying = false;
        this.timerMode = this.MODE_TIMER_INITIAL;
        this.timerMs = 0;
        
        // Audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.engine = new MetronomeEngine(this.audioContext, (time) => this.handleTick(time));
        this.fluteAudio = new Audio('audio/flute_japan.mp3');

        // Strategies
        this.strategies = {
            NORMAL: {
                shouldPlay: () => true,
                onBeat: () => {}
            }
        };
        this.activeStrategyKey = 'NORMAL';

        // UI References
        this.ui = {
            bpmDisplay: document.getElementById('bpmDisplay'),
            minusBtn: document.getElementById('minusBtn'),
            plusBtn: document.getElementById('plusBtn'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            timerDisplay: document.querySelector('.timer-display'),
            resetIcon: document.querySelector('.reset-button'),
            speedIcon: document.getElementById('speedIcon'),
            speedModePopup: document.getElementById('speedModePopup'),
            randomModePopup: document.getElementById('randomModePopup')
        };

        // Timer Animation
        this.lastTimestamp = 0;
        this.timerRAF = null;

        // Tap Tempo
        this.tapTimes = [];
        this.TAP_RESET_DELAY = 2000;

        this.init();
    }

    get activeStrategy() {
        return this.strategies[this.activeStrategyKey] || this.strategies.NORMAL;
    }

    init() {
        this.bindEvents();
        this.updateBpmDisplay();
        this.engine.bpm = this.bpm;
        
        // Expose app to global scope for other scripts to register strategies
        window.metronomeApp = this;
        
        // Emit ready event for strategies to register
        window.dispatchEvent(new CustomEvent('metronome:ready', { detail: this }));
    }

    registerStrategy(key, strategy) {
        this.strategies[key] = strategy;
    }

    setStrategy(key) {
        if (this.strategies[key]) {
            this.activeStrategyKey = key;
            // Reset strategy state if needed
            if (this.strategies[key].reset) {
                this.strategies[key].reset();
            }
        }
    }

    // --- Core Logic ---

    handleTick(time) {
        // 1. Check Strategy
        if (this.activeStrategy.shouldPlay()) {
            this.engine.playClickAt(time);
        }
        
        // 2. Strategy Logic (e.g. increment bar count)
        this.activeStrategy.onBeat(this);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    updateIcon(element, iconName) {
        if (window.lucide && window.lucide.icons[iconName]) {
            element.innerHTML = window.lucide.icons[iconName].toSvg();
            // Re-initialize icons after dynamic content change
            if (window.lucide.createIcons) {
                window.lucide.createIcons({ icons: { [iconName]: window.lucide.icons[iconName] } });
            }
        }
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.updateIcon(this.ui.playPauseBtn, 'pause');
        
        this.engine.start();

        // Timer Logic
        if (this.timerMode === this.MODE_TIMER_INITIAL) {
            this.timerMode = (this.timerMs === 0) ? this.MODE_TIMER_STOPWATCH : this.MODE_TIMER_COUNTDOWN;
        }
        this.hideResetIcon();
        this.startTimerRAF();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.updateIcon(this.ui.playPauseBtn, 'play');
        
        this.engine.stop();
        this.pauseTimerRAF();
    }

    setBpm(newBpm) {
        // Input validation
        if (isNaN(newBpm) || !isFinite(newBpm)) {
            console.warn('Invalid BPM value:', newBpm);
            return;
        }
        
        this.bpm = Math.min(this.MAX_BPM, Math.max(this.MIN_BPM, Math.round(newBpm)));
        this.engine.bpm = this.bpm;
        this.updateBpmDisplay();
    }

    updateBpmDisplay() {
        this.ui.bpmDisplay.textContent = this.bpm;
    }

    // --- Timer Logic ---

    startTimerRAF() {
        this.lastTimestamp = 0;
        this.timerRAF = requestAnimationFrame((ts) => this.updateTimer(ts));
    }

    pauseTimerRAF() {
        if (this.timerRAF) {
            cancelAnimationFrame(this.timerRAF);
            this.timerRAF = null;
        }
        if (this.timerMode === this.MODE_TIMER_STOPWATCH) this.showResetIcon();
    }

    updateTimer(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaMs = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (this.timerMode === this.MODE_TIMER_COUNTDOWN) {
            this.timerMs -= deltaMs;
            if (this.timerMs <= 0) {
                this.timerMs = 0;
                this.setTimerDisplay(this.timerMs);
                this.fluteAudio.currentTime = 0;
                this.fluteAudio.play();
                this.stop();
                this.timerMode = this.MODE_TIMER_INITIAL;
                return;
            }
        } else if (this.timerMode === this.MODE_TIMER_STOPWATCH) {
            this.timerMs += deltaMs;
        }
        
        this.setTimerDisplay(this.timerMs);

        if (this.isPlaying) {
            this.timerRAF = requestAnimationFrame((ts) => this.updateTimer(ts));
        }
    }

    setTimerDisplay(ms) {
        this.ui.timerDisplay.textContent = this.formatTime(ms);
    }

    formatTime(ms) {
        if (ms < 0) ms = 0;
        const totalHundredths = Math.floor(ms / 10);
        const hundredths = totalHundredths % 100;
        const totalSeconds = Math.floor(totalHundredths / 100);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')};${String(hundredths).padStart(2, '0')}`;
    }

    showResetIcon() { this.ui.resetIcon.style.display = 'block'; }
    hideResetIcon() { this.ui.resetIcon.style.display = 'none'; }

    // --- Event Binding ---

    bindEvents() {
        // Play/Pause
        this.ui.playPauseBtn.addEventListener('click', () => this.togglePlay());

        // BPM Buttons
        this.ui.minusBtn.addEventListener('click', (e) => {
            const step = e.ctrlKey ? 5 : 1;
            const target = e.ctrlKey ? (this.bpm % 5 !== 0 ? Math.floor(this.bpm / 5) * 5 : this.bpm - 5) : this.bpm - 1;
            this.setBpm(target);
        });

        this.ui.plusBtn.addEventListener('click', (e) => {
            const step = e.ctrlKey ? 5 : 1;
            const target = e.ctrlKey ? (this.bpm % 5 !== 0 ? Math.ceil(this.bpm / 5) * 5 : this.bpm + 5) : this.bpm + 1;
            this.setBpm(target);
        });

        // Tap Tempo
        this.ui.bpmDisplay.addEventListener('click', () => this.handleTapTempo());
        
        // Inline Edit
        this.ui.bpmDisplay.addEventListener('dblclick', () => this.enableBpmEdit());
        this.ui.bpmDisplay.addEventListener('blur', () => this.finishBpmEdit());
        this.ui.bpmDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.ui.bpmDisplay.blur(); }
        });

        // Timer Interactions
        this.ui.timerDisplay.addEventListener('click', () => {
            if (!this.isPlaying && this.timerMode === this.MODE_TIMER_INITIAL) {
                this.timerMs = Math.min(this.timerMs + 300000, this.MAX_COUNTDOWN_MS);
                this.setTimerDisplay(this.timerMs);
            }
        });

        this.ui.resetIcon.addEventListener('click', () => {
            if (!this.isPlaying) {
                this.timerMs = 0;
                this.setTimerDisplay(0);
                this.timerMode = this.MODE_TIMER_INITIAL;
                this.hideResetIcon();
            }
        });

        // Speed Icon (Mode Toggle)
        this.ui.speedIcon.addEventListener('click', (e) => this.handleModeToggle(e));
        
        // Initialize Swipe
        this.initSwipe();
    }

    handleTapTempo() {
        const now = performance.now();
        if (this.tapTimes.length && now - this.tapTimes[this.tapTimes.length - 1] > this.TAP_RESET_DELAY) {
            this.tapTimes = [];
        }
        this.tapTimes.push(now);
        if (this.tapTimes.length >= 2) {
            const intervalSum = this.tapTimes[this.tapTimes.length - 1] - this.tapTimes[0];
            const avg = intervalSum / (this.tapTimes.length - 1);
            this.setBpm(Math.round(60000 / avg));
        }
    }

    enableBpmEdit() {
        this.ui.bpmDisplay.setAttribute('contenteditable', 'true');
        this.ui.bpmDisplay.style.backgroundColor = 'transparent';
        this.ui.bpmDisplay.style.outline = 'none';
        this.ui.bpmDisplay.focus();
        // Select all
        const range = document.createRange();
        range.selectNodeContents(this.ui.bpmDisplay);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    finishBpmEdit() {
        let val = parseInt(this.ui.bpmDisplay.textContent);
        if (isNaN(val)) val = this.bpm;
        this.setBpm(val);
        this.ui.bpmDisplay.removeAttribute('contenteditable');
    }

    handleModeToggle(e) {
        if (this.ui.speedIcon.dataset.swiped === "true") {
            this.ui.speedIcon.dataset.swiped = "false";
            return;
        }
        
        const mode = this.ui.speedIcon.dataset.mode;
        const state = this.ui.speedIcon.dataset.state;
        
        if (mode === 'speed' && state === 'off') {
            // Activate Speed Mode
            this.ui.speedIcon.dataset.state = "on";
            this.updateIcon(this.ui.speedIcon, 'bolt');
            
            // Open Popup and notify strategy
            const strategy = this.strategies['SPEED'];
            if (strategy && strategy.openPopup) {
                strategy.openPopup();
            }
            this.ui.speedModePopup.style.display = 'flex';
            
            // Reset Timer
            this.timerMode = this.MODE_TIMER_INITIAL;
            this.timerMs = 0;
            this.setTimerDisplay(0);
            
        } else if (mode === 'speed' && state === 'on') {
            // Deactivate Speed Mode
            if (this.isPlaying) this.stop();
            this.ui.speedIcon.dataset.state = "off";
            this.updateIcon(this.ui.speedIcon, 'zap');
            this.ui.speedModePopup.style.display = 'none';
            
            this.setStrategy('NORMAL');
            const strategy = this.strategies['SPEED'];
            if (strategy && strategy.reset) {
                strategy.reset();
            }

        } else if (mode === 'random' && state === 'off') {
            // Activate Random Mode
            this.ui.speedIcon.dataset.state = "on";
            this.updateIcon(this.ui.speedIcon, 'shuffle');
            
            const strategy = this.strategies['RANDOM'];
            if (strategy && strategy.openPopup) {
                strategy.openPopup();
            }
            this.ui.randomModePopup.style.display = 'flex';

        } else if (mode === 'random' && state === 'on') {
            // Deactivate Random Mode
            if (this.isPlaying) this.stop();
            this.ui.speedIcon.dataset.state = "off";
            this.updateIcon(this.ui.speedIcon, 'shuffle');
            this.ui.randomModePopup.style.display = 'none';
            
            this.setStrategy('NORMAL');
        }
    }

    initSwipe() {
        const icon = this.ui.speedIcon;
        icon.style.touchAction = 'none';
        let swipeStartX = null;
        let isDragging = false;
        const SWIPE_THRESHOLD = 20; // Reduced threshold

        icon.addEventListener('pointerdown', (e) => {
            swipeStartX = e.clientX;
            isDragging = false;
            icon.setPointerCapture(e.pointerId);
            icon.style.transition = 'none';
        });

        icon.addEventListener('pointermove', (e) => {
            if (swipeStartX === null) return;
            const deltaX = e.clientX - swipeStartX;
            if (Math.abs(deltaX) > 5) isDragging = true;
            
            if (isDragging) {
                icon.style.transform = `translateX(${deltaX}px)`;
                e.preventDefault();
            }
        });

        const handleEnd = (e) => {
            if (swipeStartX === null) return;
            const deltaX = e.clientX - swipeStartX;
            icon.style.transition = 'transform 0.2s ease-out';
            
            if (isDragging && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
                icon.dataset.swiped = 'true';
                
                const currentMode = icon.dataset.mode;
                const wasActive = icon.dataset.state === 'on';
                
                // Switch to the other mode
                if (currentMode === 'speed') {
                    icon.dataset.mode = 'random';
                    
                    // If was active, switch to random mode and keep it active
                    if (wasActive) {
                        icon.dataset.state = 'on';
                        this.updateIcon(icon, 'shuffle');
                        this.ui.speedModePopup.style.display = 'none';
                        this.setStrategy('RANDOM');
                    } else {
                        icon.dataset.state = 'off';
                        this.updateIcon(icon, 'shuffle');
                    }
                } else {
                    icon.dataset.mode = 'speed';
                    
                    // If was active, switch to speed mode and keep it active
                    if (wasActive) {
                        icon.dataset.state = 'on';
                        this.updateIcon(icon, 'bolt');
                        this.ui.randomModePopup.style.display = 'none';
                        this.setStrategy('SPEED');
                    } else {
                        icon.dataset.state = 'off';
                        this.updateIcon(icon, 'zap');
                    }
                }

                // Auto-reset swiped flag to prevent stuck state
                setTimeout(() => { icon.dataset.swiped = 'false'; }, 100);
            }
            
            icon.style.transform = 'translateX(0px)';
            swipeStartX = null;
            isDragging = false;
        };

        icon.addEventListener('pointerup', handleEnd);
        icon.addEventListener('pointercancel', handleEnd);
    }
}

// Initialize App
const app = new MetronomeApp();

// ==========================================
// 3. Settings Manager (Theme & UI)
// ==========================================
class SettingsManager {
    constructor() {
        this.ui = {
            settingsIcon: document.getElementById('settingsIcon'),
            settingsPopup: document.getElementById('settingsPopup'),
            closeSettingsPopup: document.getElementById('closeSettingsPopup'),
            bgSwatches: document.querySelectorAll('.color-swatch[data-type="bg"]'),
            textSwatches: document.querySelectorAll('.color-swatch[data-type="text"]'),
            customBgInput: document.getElementById('customBgInput'),
            customTextInput: document.getElementById('customTextInput'),
            root: document.documentElement
        };
        
        this.bindEvents();
        this.loadSettings();
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        } else {
            console.warn("Lucide icons library not found.");
        }
    }

    bindEvents() {
        if (this.ui.settingsIcon) {
            this.ui.settingsIcon.addEventListener('click', () => {
                this.ui.settingsPopup.style.display = 'block';
            });
        }

        if (this.ui.closeSettingsPopup) {
            this.ui.closeSettingsPopup.addEventListener('click', () => {
                this.ui.settingsPopup.style.display = 'none';
            });
        }

        // Background Swatches
        this.ui.bgSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setBgColor(color);
            });
        });

        // Text Swatches
        this.ui.textSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setTextColor(color);
            });
        });

        // Custom Inputs
        if (this.ui.customBgInput) {
            this.ui.customBgInput.addEventListener('input', (e) => {
                this.setBgColor(e.target.value, false); // Live preview, don't save yet
            });
            this.ui.customBgInput.addEventListener('change', (e) => {
                this.setBgColor(e.target.value, true); // Save on commit
            });
        }

        if (this.ui.customTextInput) {
            this.ui.customTextInput.addEventListener('input', (e) => {
                this.setTextColor(e.target.value, false);
            });
            this.ui.customTextInput.addEventListener('change', (e) => {
                this.setTextColor(e.target.value, true);
            });
        }
    }

    setBgColor(color, save = true) {
        this.ui.root.style.setProperty('--bg-color', color);
        this.updateActiveSwatch(this.ui.bgSwatches, color);
        if (save) localStorage.setItem('themeBgColor', color);
    }

    setTextColor(color, save = true) {
        this.ui.root.style.setProperty('--text-color', color);
        this.updateActiveSwatch(this.ui.textSwatches, color);
        if (save) localStorage.setItem('themeTextColor', color);
    }

    updateActiveSwatch(swatches, color) {
        swatches.forEach(s => s.classList.remove('active'));
        // Try to find exact match
        const activeSwatch = Array.from(swatches).find(s => s.dataset.color.toLowerCase() === color.toLowerCase());
        if (activeSwatch) activeSwatch.classList.add('active');
    }

    loadSettings() {
        const savedBg = localStorage.getItem('themeBgColor');
        const savedText = localStorage.getItem('themeTextColor');

        if (savedBg) {
            this.setBgColor(savedBg);
            if (this.ui.customBgInput) this.ui.customBgInput.value = savedBg;
        } else {
            this.setBgColor('#262626'); // Default
        }

        if (savedText) {
            this.setTextColor(savedText);
            if (this.ui.customTextInput) this.ui.customTextInput.value = savedText;
        } else {
            this.setTextColor('#ffffff'); // Default
        }
    }
}

// Initialize Settings
const settingsManager = new SettingsManager();

