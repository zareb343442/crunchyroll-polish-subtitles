// Handle audio processing, VAD, and chunking

import type { AudioChunk } from './types';

export class AudioProcessor {
  private sampleRate = 16000;
  private chunkSize = 4096;
  private buffer: Float32Array = new Float32Array();
  private vadEnabled = true;
  private silenceThreshold = 0.01;
  private silenceFrames = 0;
  private maxSilenceFrames = 10;

  constructor(sampleRate: number = 16000) {
    this.sampleRate = sampleRate;
  }

  processChunk(audioData: Float32Array): AudioChunk[] {
    const chunks: AudioChunk[] = [];

    // Resample if necessary
    const resampled = this.resample(audioData);

    // Apply VAD if enabled
    if (this.vadEnabled && !this.detectVoice(resampled)) {
      this.silenceFrames++;
      if (this.silenceFrames < this.maxSilenceFrames) {
        return chunks;
      }
    } else {
      this.silenceFrames = 0;
    }

    // Add to buffer
    this.buffer = this.concatenateBuffers(this.buffer, resampled);

    // Split into chunks
    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.slice(0, this.chunkSize);
      chunks.push({
        data: chunk,
        timestamp: Date.now(),
      });
      this.buffer = this.buffer.slice(this.chunkSize);
    }

    return chunks;
  }

  private resample(audioData: Float32Array): Float32Array {
    // Simple resampling using linear interpolation if needed
    // For most cases, audio is already at 16kHz or compatible
    return audioData;
  }

  private detectVoice(audioData: Float32Array): boolean {
    // Simple voice activity detection using RMS energy
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    return rms > this.silenceThreshold;
  }

  private concatenateBuffers(buffer1: Float32Array, buffer2: Float32Array): Float32Array {
    const combined = new Float32Array(buffer1.length + buffer2.length);
    combined.set(buffer1);
    combined.set(buffer2, buffer1.length);
    return combined;
  }

  enableVAD(enabled: boolean): void {
    this.vadEnabled = enabled;
  }

  setThreshold(threshold: number): void {
    this.silenceThreshold = threshold;
  }
}
