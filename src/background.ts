// Background Service Worker for extension

import type { ExtensionState, SubtitleSettings } from './types';

const DEFAULT_SETTINGS: SubtitleSettings = {
  enabled: true,
  fontSize: 20,
  color: '#FFFFFF',
  opacity: 1,
  outlineWidth: 2,
  outlineColor: '#000000',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backgroundOpacity: 0.5,
  position: 'bottom',
  showJapanese: true,
  showPolish: true,
  fontFamily: 'Arial, sans-serif',
  subtitleDelay: 0,
};

let extensionState: ExtensionState = {
  isActive: false,
  isProcessing: false,
  settings: DEFAULT_SETTINGS,
  modelConfig: {
    whisper: {
      model: 'small',
      language: 'ja',
    },
    translation: {
      model: 'nllb-200-distilled',
    },
    vad: {
      enabled: true,
      model: 'silero',
    },
  },
};

// Initialize extension state from storage
chrome.storage.local.get(['settings', 'modelConfig'], (result) => {
  if (result.settings) {
    extensionState.settings = { ...DEFAULT_SETTINGS, ...result.settings };
  }
  if (result.modelConfig) {
    extensionState.modelConfig = { ...extensionState.modelConfig, ...result.modelConfig };
  }
  console.log('[Background] Extension state initialized', extensionState);
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATE') {
    sendResponse(extensionState);
  } else if (request.type === 'UPDATE_SETTINGS') {
    extensionState.settings = { ...extensionState.settings, ...request.payload };
    chrome.storage.local.set({ settings: extensionState.settings });
    sendResponse({ success: true });
  } else if (request.type === 'UPDATE_MODEL_CONFIG') {
    extensionState.modelConfig = { ...extensionState.modelConfig, ...request.payload };
    chrome.storage.local.set({ modelConfig: extensionState.modelConfig });
    sendResponse({ success: true });
  } else if (request.type === 'SET_ACTIVE') {
    extensionState.isActive = request.payload;
    sendResponse({ success: true });
  } else if (request.type === 'SET_PROCESSING') {
    extensionState.isProcessing = request.payload;
    sendResponse({ success: true });
  }
});

// Handle tab capture for audio
chrome.tabCapture.onStatusChanged.addListener((info) => {
  console.log('[Background] Tab capture status:', info);
});

// Listen for tab updates to detect Crunchyroll
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('crunchyroll.com')) {
    console.log('[Background] Crunchyroll page loaded:', tab.url);
    // Content script will auto-initialize on Crunchyroll pages
  }
});

export {};
