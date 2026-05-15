// Type definitions for the extension

export interface SubtitleLine {
  id: string;
  startTime: number;
  endTime: number;
  japaneseText: string;
  polishText: string;
  confidence: number;
}

export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
}

export interface TranscriptionResult {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: number;
  color: string;
  opacity: number;
  outlineWidth: number;
  outlineColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'bottom' | 'middle' | 'top';
  showJapanese: boolean;
  showPolish: boolean;
  fontFamily: string;
  subtitleDelay: number; // in milliseconds
}

export interface ModelConfig {
  whisper: {
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language: string;
  };
  translation: {
    model: 'nllb-200-distilled' | 'mariannmt-ja-pl';
  };
  vad: {
    enabled: boolean;
    model: 'silero' | 'webrtc';
  };
}

export interface ExtensionState {
  isActive: boolean;
  isProcessing: boolean;
  currentVideo?: string;
  settings: SubtitleSettings;
  modelConfig: ModelConfig;
  models?: {
    whisper?: any;
    translator?: any;
    vad?: any;
  };
}

export interface CrunchyrollPlayer {
  element: HTMLElement;
  video: HTMLVideoElement;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}
