// Detect and interact with Crunchyroll video player

import type { CrunchyrollPlayer } from './types';

export class CrunchyrollDetector {
  private player: CrunchyrollPlayer | null = null;
  private maxRetries = 30;
  private retryDelay = 1000;

  async waitForPlayer(): Promise<void> {
    for (let i = 0; i < this.maxRetries; i++) {
      const player = this.detectPlayer();
      if (player) {
        this.player = player;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    }
    throw new Error('Crunchyroll player not found after retries');
  }

  private detectPlayer(): CrunchyrollPlayer | null {
    // Try multiple selectors for Crunchyroll player
    const selectors = [
      'video',
      '[data-player-id]',
      '.player-container video',
      'vilos-player video',
      '[data-media-type="video"] video',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element instanceof HTMLVideoElement && this.isValidVideoElement(element)) {
        const playerContainer = element.closest('[data-player-id]') || element.parentElement;

        return {
          element: playerContainer || element,
          video: element,
          isPlaying: !element.paused,
          currentTime: element.currentTime,
          duration: element.duration,
        };
      }
    }

    return null;
  }

  private isValidVideoElement(video: HTMLVideoElement): boolean {
    // Check if this is actually a video player (not a background video)
    const rect = video.getBoundingClientRect();
    return (
      rect.width > 200 &&
      rect.height > 150 &&
      video.duration > 0 &&
      (video.offsetParent !== null || video.style.display !== 'none')
    );
  }

  getPlayer(): CrunchyrollPlayer | null {
    return this.player;
  }

  isOnCrunchyroll(): boolean {
    return window.location.hostname.includes('crunchyroll.com');
  }

  getCurrentVideoId(): string | null {
    // Extract video ID from URL or meta tags
    const urlMatch = window.location.pathname.match(/watch\/([a-z0-9]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    const metaTag = document.querySelector('meta[property="og:url"]');
    if (metaTag) {
      const url = metaTag.getAttribute('content');
      const match = url?.match(/watch\/([a-z0-9]+)/);
      if (match) return match[1];
    }

    return null;
  }
}
