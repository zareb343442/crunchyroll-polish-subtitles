// Whisper-based speech recognition service

import type { AudioChunk, TranscriptionResult } from './types';

export class TranscriptionService {
  private model: any = null;
  private modelName: string;
  private isInitialized = false;
  private buffer: Float32Array = new Float32Array();
  private contextWindow: Float32Array[] = [];
  private maxContextLength = 5; // Keep last 5 chunks for context

  constructor(modelName: 'tiny' | 'base' | 'small' | 'medium' | 'large' = 'small') {
    this.modelName = modelName;
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      console.log(`[TranscriptionService] Loading Whisper model: ${this.modelName}`);

      // Import transformers.js for Whisper
      const { pipeline } = await import('@xenova/transformers');

      this.model = await pipeline('automatic-speech-recognition', `Xenova/whisper-${this.modelName}`, {
        quantized: true, // Use quantized version for performance
        device: 'webgpu', // Use WebGPU if available
      });

      this.isInitialized = true;
      console.log('[TranscriptionService] Model initialized successfully');
    } catch (error) {
      console.error('[TranscriptionService] Model initialization failed:', error);
      // Fallback to CPU
      try {
        const { pipeline } = await import('@xenova/transformers');
        this.model = await pipeline('automatic-speech-recognition', `Xenova/whisper-${this.modelName}`);
        this.isInitialized = true;
        console.log('[TranscriptionService] Model initialized on CPU fallback');
      } catch (fallbackError) {
        console.error('[TranscriptionService] CPU fallback also failed:', fallbackError);
      }
    }
  }

  async transcribe(chunk: AudioChunk): Promise<TranscriptionResult | null> {
    if (!this.isInitialized || !this.model) {
      console.warn('[TranscriptionService] Model not initialized');
      return null;
    }

    try {
      // Add chunk to context window
      this.contextWindow.push(chunk.data);
      if (this.contextWindow.length > this.maxContextLength) {
        this.contextWindow.shift();
      }

      // Combine chunks for context
      const combinedAudio = this.combineAudioChunks(this.contextWindow);

      // Perform transcription
      const result = await this.model(combinedAudio, {
        language: 'ja',
        return_timestamps: true,
      });

      if (result && result.text) {
        return {
          text: result.text,
          timestamp: chunk.timestamp,
          confidence: result.confidence || 0.5,
          isFinal: true,
        };
      }
    } catch (error) {
      console.error('[TranscriptionService] Transcription error:', error);
    }

    return null;
  }

  private combineAudioChunks(chunks: Float32Array[]): Float32Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined;
  }

  clearContext(): void {
    this.contextWindow = [];
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
