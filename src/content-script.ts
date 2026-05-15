// Content Script - Injected into Crunchyroll pages

import { initializeSubtitleOverlay } from './subtitle-overlay';
import { AudioProcessor } from './audio-processor';
import { TranscriptionService } from './transcription-service';
import { TranslationService } from './translation-service';
import { CrunchyrollDetector } from './crunchyroll-detector';
import type { SubtitleLine, AudioChunk, ExtensionState } from './types';

class CrunchyrollSubtitleEngine {
  private audioProcessor: AudioProcessor | null = null;
  private transcriptionService: TranscriptionService | null = null;
  private translationService: TranslationService | null = null;
  private crunchyrollDetector: CrunchyrollDetector | null = null;
  private extensionState: ExtensionState | null = null;
  private isRunning = false;
  private audioStream: MediaStream | null = null;
  private subtitleQueue: SubtitleLine[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      console.log('[ContentScript] Initializing subtitle engine...');

      // Get extension state from background
      const state = await this.getExtensionState();
      this.extensionState = state;

      // Initialize Crunchyroll detector
      this.crunchyrollDetector = new CrunchyrollDetector();
      await this.crunchyrollDetector.waitForPlayer();

      const player = this.crunchyrollDetector.getPlayer();
      if (!player) {
        console.error('[ContentScript] Could not find Crunchyroll player');
        return;
      }

      console.log('[ContentScript] Crunchyroll player detected');

      // Initialize subtitle overlay
      initializeSubtitleOverlay(player.element, this.extensionState.settings);

      // Initialize audio processor
      this.audioProcessor = new AudioProcessor();

      // Initialize transcription service
      this.transcriptionService = new TranscriptionService(
        this.extensionState.modelConfig.whisper.model
      );

      // Initialize translation service
      this.translationService = new TranslationService(
        this.extensionState.modelConfig.translation.model
      );

      // Setup player event listeners
      this.setupPlayerListeners(player);

      console.log('[ContentScript] Subtitle engine initialized successfully');
    } catch (error) {
      console.error('[ContentScript] Initialization error:', error);
    }
  }

  private setupPlayerListeners(player: any) {
    player.video.addEventListener('play', () => {
      console.log('[ContentScript] Video playing');
      this.startAudioCapture();
    });

    player.video.addEventListener('pause', () => {
      console.log('[ContentScript] Video paused');
      this.stopAudioCapture();
    });

    player.video.addEventListener('ended', () => {
      console.log('[ContentScript] Video ended');
      this.stopAudioCapture();
    });
  }

  private async startAudioCapture() {
    if (this.isRunning || !this.extensionState?.settings.enabled) return;

    try {
      this.isRunning = true;
      console.log('[ContentScript] Starting audio capture...');

      // Get audio stream from current tab
      const audioConstraints = {
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
          },
        },
        video: false,
      } as any;

      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      this.audioStream = stream;

      // Start processing audio
      this.processAudio(stream);
    } catch (error) {
      console.error('[ContentScript] Audio capture error:', error);
      this.isRunning = false;
    }
  }

  private stopAudioCapture() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.isRunning = false;
    console.log('[ContentScript] Audio capture stopped');
  }

  private async processAudio(stream: MediaStream) {
    if (!this.audioProcessor || !this.transcriptionService) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = async (e) => {
        if (!this.isRunning) return;

        const audioData = e.inputBuffer.getChannelData(0);
        const chunk: AudioChunk = {
          data: new Float32Array(audioData),
          timestamp: audioContext.currentTime,
        };

        // Process audio chunk
        const transcription = await this.transcriptionService.transcribe(chunk);

        if (transcription && transcription.isFinal) {
          // Translate transcription
          const translation = await this.translationService.translate(
            transcription.text,
            'ja',
            'pl'
          );

          const subtitleLine: SubtitleLine = {
            id: `${Date.now()}`,
            startTime: transcription.timestamp,
            endTime: transcription.timestamp + 3000,
            japaneseText: transcription.text,
            polishText: translation.translatedText,
            confidence: transcription.confidence,
          };

          // Add to subtitle queue and display
          this.subtitleQueue.push(subtitleLine);
          this.displaySubtitle(subtitleLine);
        }
      };
    } catch (error) {
      console.error('[ContentScript] Audio processing error:', error);
    }
  }

  private displaySubtitle(subtitle: SubtitleLine) {
    // Send to subtitle overlay
    window.postMessage(
      {
        type: 'DISPLAY_SUBTITLE',
        payload: subtitle,
      },
      '*'
    );
  }

  private getExtensionState(): Promise<ExtensionState> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
        resolve(state);
      });
    });
  }
}

// Only initialize on Crunchyroll pages
if (window.location.hostname.includes('crunchyroll.com')) {
  const engine = new CrunchyrollSubtitleEngine();
}

export {};
