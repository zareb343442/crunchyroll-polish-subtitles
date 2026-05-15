# Crunchyroll Polish AI Subtitles

A free, open-source browser extension that generates accurate Polish subtitles for Crunchyroll anime in real time using local AI models directly in the browser.

## Features

- **Completely Free** - No subscriptions, trials, or premium features
- **Fully Offline** - Works entirely locally after model download
- **Real-time Processing** - 1-3 second latency
- **Multi-browser Support** - Chrome, Firefox, Edge, Brave
- **AI-Powered** - Uses Whisper for speech recognition and NLLB-200/MarianMT for translation
- **GPU Acceleration** - WebGPU support with CPU fallback
- **Highly Customizable** - Font size, color, position, opacity, dual subtitles
- **Smart Processing** - Voice Activity Detection, contextual translation, honorific preservation
- **Anime-Optimized** - Handles slang, names, emotional speech

## Installation

### Chrome/Edge/Brave

1. Clone the repository:
```bash
git clone https://github.com/zareb343442/crunchyroll-polish-subtitles.git
cd crunchyroll-polish-subtitles
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Open `chrome://extensions` (or `edge://extensions` for Edge)
5. Enable "Developer mode" (top right)
6. Click "Load unpacked"
7. Select the `dist` folder

### Firefox

1. Build the extension:
```bash
npm run build:firefox
```

2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the manifest.json from the dist folder

## Usage

1. Go to any Crunchyroll anime page
2. Click the extension icon in your toolbar
3. Enable subtitles if not already enabled
4. Customize settings as needed (font size, color, position, etc.)
5. Play an episode - subtitles will appear automatically

## Settings

- **Font Size** - 12px to 40px
- **Color** - Choose any subtitle color
- **Opacity** - 0-100%
- **Position** - Bottom, Middle, or Top
- **Show Japanese** - Toggle original Japanese subtitles
- **Show Polish** - Toggle Polish translation
- **Subtitle Delay** - Adjust timing (±1000ms)

## Architecture

- **Manifest V3** - Modern extension standard
- **TypeScript** - Type-safe development
- **Transformers.js** - Local AI models
- **WebGPU** - GPU acceleration
- **ONNX Runtime Web** - Optimized inference
- **Shadow DOM** - Isolated subtitle overlay
- **Web Audio API** - Audio capture

## Models Used

- **Whisper Small** - Japanese speech recognition
- **NLLB-200 Distilled** - Japanese to Polish translation
- **Silero VAD** - Voice activity detection

## Performance

- Models cache locally after first download
- ~500MB total model size (compressed)
- Works on mid-range gaming laptops
- 1-3 second subtitle latency
- GPU acceleration when available

## Privacy & Security

- ✅ Everything runs locally in your browser
- ✅ No data sent to servers
- ✅ No cloud processing
- ✅ No tracking or analytics
- ✅ Open-source code

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please feel free to submit PRs.

## Support

For issues, feature requests, or questions, please open a GitHub issue.

## Disclaimer

This extension is for educational and personal use. Please respect copyright and use Crunchyroll's official service where available.
