# Development Guide

This guide is for developers who want to contribute to or modify the Metronome Widget.

## Project Structure

```
metronome-widget/
├── index.html          # Main HTML file
├── audio/              # Audio files
│   ├── click.wav       # Classic click sound
│   ├── flute_japan.mp3 # Alternative flute sound
│   └── peaks/          # Audio waveform data
├── icons/              # UI icons
│   ├── play_icon.png
│   ├── pause_icon.png
│   ├── plus_icon.png
│   ├── minus_icon.png
│   ├── settings.png
│   ├── refresh_icon.png
│   ├── random_on.png
│   ├── random_off.png
│   ├── speed_on.png
│   └── speed_off.png
├── font/               # Custom fonts
│   └── iAWriterMonoS-Regular.ttf
└── assets/             # Compiled assets (generated)
    ├── index-*.js      # JavaScript bundle
    └── index-*.css     # CSS bundle
```

## Technology Stack

The Metronome Widget is built with:
- **HTML5**: Semantic markup
- **JavaScript/TypeScript**: Application logic (bundled with Vite)
- **CSS3**: Styling
- **Web Audio API**: Precise audio timing and playback
- **Vite**: Build tool and bundler

## Development Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager
- Git
- A code editor (VS Code, Sublime Text, etc.)

### Setting Up the Development Environment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/DonElDoug/metronome-widget.git
   cd metronome-widget
   ```

2. **Install Dependencies** (if applicable)
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

## Building for Production

### Create Production Build

```bash
npm run build
# or
yarn build
```

This will:
- Bundle and minify JavaScript
- Optimize CSS
- Process assets
- Output to `dist/` directory

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Architecture

### Core Components

The metronome likely consists of these key components:

1. **Timer/Scheduler**: Manages precise timing using Web Audio API
2. **Audio Engine**: Loads and plays audio samples
3. **UI Controller**: Handles user interactions
4. **State Manager**: Tracks tempo, playing state, settings
5. **Settings Manager**: Persists user preferences

### Web Audio API Implementation

The metronome uses Web Audio API for precise timing:

```javascript
// Example: Basic Web Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load audio file
async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Schedule audio with precise timing
function scheduleClick(time) {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(time);
}
```

## Adding New Features

### Adding a New Sound

1. Add audio file to `audio/` directory
2. Update sound selector in settings
3. Load audio buffer in audio engine
4. Add UI option for sound selection

### Adding New Controls

1. Create icon in appropriate size (PNG format)
2. Add to `icons/` directory
3. Update UI component
4. Wire up event handlers
5. Update state management

### Modifying Tempo Range

1. Locate tempo configuration
2. Update min/max BPM values
3. Update increment/decrement logic
4. Test edge cases

## Code Style

### JavaScript/TypeScript
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use arrow functions where appropriate
- Add JSDoc comments for complex functions

### CSS
- Use semantic class names
- Follow BEM naming convention if applicable
- Keep specificity low
- Use CSS custom properties for theming

### HTML
- Use semantic HTML5 elements
- Include proper ARIA labels
- Ensure accessibility

## Testing

### Manual Testing Checklist

- [ ] Metronome starts and stops correctly
- [ ] Tempo adjustments work
- [ ] Audio plays without glitches
- [ ] All icons display correctly
- [ ] Settings persist (if applicable)
- [ ] Works on different browsers
- [ ] Works on mobile devices
- [ ] Keyboard shortcuts function
- [ ] No console errors

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### GitHub Pages Deployment

The project is deployed using GitHub Pages:

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   # or manually commit dist/ to gh-pages branch
   ```

3. **Configure Repository Settings**
   - Go to repository Settings
   - Navigate to Pages section
   - Select gh-pages branch
   - Save configuration

### Manual Deployment

1. Build the project
2. Copy contents of `dist/` or root directory
3. Upload to your web hosting
4. Ensure proper MIME types for audio files

## Contributing

### Contribution Guidelines

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style
   - Test thoroughly

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: description of your feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Commit Message Format

```
Type: Short description

Longer description if necessary

Fixes #issue-number
```

Types:
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Modification to existing feature
- `Docs:` Documentation changes
- `Style:` Code style changes
- `Refactor:` Code refactoring
- `Test:` Adding tests
- `Chore:` Maintenance tasks

## Common Development Tasks

### Adding a New Audio Sample

1. Prepare audio file (WAV or MP3, preferably < 100KB)
2. Add to `audio/` directory
3. Update audio loader configuration
4. Add UI selection option
5. Test audio playback

### Changing Visual Theme

1. Locate CSS custom properties
2. Update color values
3. Test in different browsers
4. Ensure sufficient contrast for accessibility

### Improving Timing Accuracy

1. Review Web Audio API implementation
2. Use `audioContext.currentTime` for scheduling
3. Implement lookahead scheduling
4. Test with performance monitoring

## Performance Optimization

### Tips for Better Performance

1. **Lazy Load Audio**: Load audio files only when needed
2. **Optimize Images**: Compress icons and images
3. **Minimize Reflows**: Batch DOM updates
4. **Use Web Workers**: For complex calculations
5. **Cache Resources**: Implement service worker for offline support

## Troubleshooting Development Issues

### Build Errors
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Review Vite configuration

### Audio Timing Issues
- Use Web Audio API clock, not `setTimeout`
- Implement lookahead scheduling
- Test on different devices

### Icon Display Issues
- Check file paths
- Verify image formats
- Test in different browsers

## Resources

### Documentation
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vite Documentation](https://vitejs.dev/)
- [GitHub Pages](https://pages.github.com/)

### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Wave Accessibility Tool](https://wave.webaim.org/)

## License

See the repository's LICENSE file for licensing information.

## Getting Help

- Open an issue on GitHub
- Check existing issues and discussions
- Review this documentation
- Contact the maintainers
