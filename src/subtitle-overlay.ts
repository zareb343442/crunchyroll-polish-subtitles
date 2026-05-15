// Subtitle overlay system using Shadow DOM

import type { SubtitleSettings, SubtitleLine } from './types';

let overlayContainer: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let subtitleElement: HTMLElement | null = null;
let currentSettings: SubtitleSettings | null = null;
let displayQueue: SubtitleLine[] = [];
let currentSubtitle: SubtitleLine | null = null;
let displayTimeout: NodeJS.Timeout | null = null;

const SUBTITLE_STYLES = `
  :host {
    all: initial;
    font-family: Arial, sans-serif;
    position: fixed;
    bottom: 20px;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 2147483647;
  }

  .subtitle-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    pointer-events: none;
  }

  .subtitle-line {
    font-size: 20px;
    font-weight: 500;
    text-align: center;
    padding: 8px 16px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-width: 90vw;
    animation: fadeIn 0.3s ease-in;
  }

  .subtitle-japanese {
    color: #ffff00;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    font-size: 18px;
  }

  .subtitle-polish {
    color: #ffffff;
    background: rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(10px);
    }
  }
`;

export function initializeSubtitleOverlay(playerElement: HTMLElement, settings: SubtitleSettings) {
  currentSettings = settings;

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'crunchyroll-subtitle-overlay';
  playerElement.appendChild(overlayContainer);

  // Create shadow DOM
  shadowRoot = overlayContainer.attachShadow({ mode: 'open' });

  // Add styles
  const styleElement = document.createElement('style');
  styleElement.textContent = SUBTITLE_STYLES;
  shadowRoot.appendChild(styleElement);

  // Create subtitle container
  subtitleElement = document.createElement('div');
  subtitleElement.className = 'subtitle-container';
  shadowRoot.appendChild(subtitleElement);

  // Listen for subtitle messages from content script
  window.addEventListener('message', handleSubtitleMessage);

  console.log('[SubtitleOverlay] Initialized successfully');
}

function handleSubtitleMessage(event: MessageEvent) {
  if (event.source !== window) return;

  if (event.data.type === 'DISPLAY_SUBTITLE') {
    const subtitle = event.data.payload as SubtitleLine;
    displaySubtitle(subtitle);
  } else if (event.data.type === 'UPDATE_SETTINGS') {
    currentSettings = { ...currentSettings, ...event.data.payload };
    updateOverlayStyles();
  } else if (event.data.type === 'CLEAR_SUBTITLES') {
    clearSubtitles();
  }
}

function displaySubtitle(subtitle: SubtitleLine) {
  if (!subtitleElement || !currentSettings) return;

  // Clear previous timeout
  if (displayTimeout) {
    clearTimeout(displayTimeout);
  }

  // Clear previous content
  subtitleElement.innerHTML = '';
  currentSubtitle = subtitle;

  // Create subtitle lines
  if (currentSettings.showJapanese && subtitle.japaneseText) {
    const japaneseDiv = document.createElement('div');
    japaneseDiv.className = 'subtitle-line subtitle-japanese';
    japaneseDiv.textContent = subtitle.japaneseText;
    subtitleElement.appendChild(japaneseDiv);
  }

  if (currentSettings.showPolish && subtitle.polishText) {
    const polishDiv = document.createElement('div');
    polishDiv.className = 'subtitle-line subtitle-polish';
    polishDiv.textContent = subtitle.polishText;
    subtitleElement.appendChild(polishDiv);
  }

  // Apply custom settings
  applyCustomStyles(subtitleElement);

  // Auto-hide subtitle after duration
  const duration = Math.max(subtitle.endTime - subtitle.startTime, 3000);
  displayTimeout = setTimeout(() => {
    fadeOutSubtitle();
  }, duration);
}

function applyCustomStyles(element: HTMLElement) {
  if (!currentSettings) return;

  const lines = element.querySelectorAll('.subtitle-line');
  lines.forEach((line) => {
    const htmlLine = line as HTMLElement;
    htmlLine.style.fontSize = `${currentSettings.fontSize}px`;
    htmlLine.style.color = currentSettings.color;
    htmlLine.style.opacity = currentSettings.opacity.toString();
  });

  const polishLines = element.querySelectorAll('.subtitle-polish');
  polishLines.forEach((line) => {
    const htmlLine = line as HTMLElement;
    htmlLine.style.backgroundColor = currentSettings.backgroundColor;
  });
}

function updateOverlayStyles() {
  if (!overlayContainer || !currentSettings) return;

  overlayContainer.style.bottom = currentSettings.position === 'bottom' ? '20px' : '50%';
  overlayContainer.style.top = currentSettings.position === 'top' ? '20px' : 'auto';

  if (subtitleElement) {
    applyCustomStyles(subtitleElement);
  }
}

function fadeOutSubtitle() {
  if (!subtitleElement) return;

  subtitleElement.style.animation = 'fadeOut 0.3s ease-out';
  setTimeout(() => {
    if (subtitleElement) {
      subtitleElement.innerHTML = '';
      subtitleElement.style.animation = '';
    }
  }, 300);
}

function clearSubtitles() {
  if (displayTimeout) {
    clearTimeout(displayTimeout);
  }
  if (subtitleElement) {
    subtitleElement.innerHTML = '';
  }
  displayQueue = [];
  currentSubtitle = null;
}

export function updateSubtitleSettings(newSettings: Partial<SubtitleSettings>) {
  if (!currentSettings) return;
  currentSettings = { ...currentSettings, ...newSettings };
  updateOverlayStyles();
}

export function getSubtitleOverlay() {
  return shadowRoot?.querySelector('.subtitle-container') as HTMLElement | null;
}
