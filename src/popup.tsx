// Popup UI Controller

import type { SubtitleSettings, ExtensionState } from './types';

class PopupController {
  private extensionState: ExtensionState | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get extension state
    const state = await this.getExtensionState();
    this.extensionState = state;

    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners() {
    // Toggle enabled
    const toggleEnabled = document.getElementById('toggle-enabled');
    if (toggleEnabled) {
      toggleEnabled.addEventListener('click', () => this.toggleEnabled());
    }

    // Font size
    const fontSize = document.getElementById('font-size') as HTMLInputElement;
    if (fontSize) {
      fontSize.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        document.getElementById('font-size-value')!.textContent = value;
        this.updateSetting('fontSize', parseInt(value));
      });
    }

    // Font color
    const fontColor = document.getElementById('font-color') as HTMLInputElement;
    if (fontColor) {
      fontColor.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).value;
        this.updateSetting('color', value);
      });
    }

    // Opacity
    const opacity = document.getElementById('opacity') as HTMLInputElement;
    if (opacity) {
      opacity.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        document.getElementById('opacity-value')!.textContent = value.toString();
        this.updateSetting('opacity', value / 100);
      });
    }

    // Position
    const position = document.getElementById('position') as HTMLSelectElement;
    if (position) {
      position.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as 'bottom' | 'middle' | 'top';
        this.updateSetting('position', value);
      });
    }

    // Subtitle delay
    const delay = document.getElementById('delay') as HTMLInputElement;
    if (delay) {
      delay.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        document.getElementById('delay-value')!.textContent = value.toString();
        this.updateSetting('subtitleDelay', value);
      });
    }

    // Japanese toggle
    const toggleJapanese = document.getElementById('toggle-japanese');
    if (toggleJapanese) {
      toggleJapanese.addEventListener('click', () => {
        const newValue = !this.extensionState!.settings.showJapanese;
        this.updateSetting('showJapanese', newValue);
        toggleJapanese.classList.toggle('active');
      });
    }

    // Polish toggle
    const togglePolish = document.getElementById('toggle-polish');
    if (togglePolish) {
      togglePolish.addEventListener('click', () => {
        const newValue = !this.extensionState!.settings.showPolish;
        this.updateSetting('showPolish', newValue);
        togglePolish.classList.toggle('active');
      });
    }

    // Reset button
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetSettings());
    }

    // Save button
    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveSettings());
    }
  }

  private updateUI() {
    if (!this.extensionState) return;

    const settings = this.extensionState.settings;

    // Update form values
    (document.getElementById('font-size') as HTMLInputElement).value = settings.fontSize.toString();
    (document.getElementById('font-size-value') as HTMLElement).textContent = settings.fontSize.toString();

    (document.getElementById('font-color') as HTMLInputElement).value = settings.color;

    (document.getElementById('opacity') as HTMLInputElement).value = (settings.opacity * 100).toString();
    (document.getElementById('opacity-value') as HTMLElement).textContent = (settings.opacity * 100).toString();

    (document.getElementById('position') as HTMLSelectElement).value = settings.position;

    (document.getElementById('delay') as HTMLInputElement).value = settings.subtitleDelay.toString();
    (document.getElementById('delay-value') as HTMLElement).textContent = settings.subtitleDelay.toString();

    // Update toggles
    const toggleJapanese = document.getElementById('toggle-japanese');
    if (settings.showJapanese && toggleJapanese) {
      toggleJapanese.classList.add('active');
    }

    const togglePolish = document.getElementById('toggle-polish');
    if (settings.showPolish && togglePolish) {
      togglePolish.classList.add('active');
    }

    // Update status
    const statusIndicator = document.getElementById('status-indicator');
    if (settings.enabled && statusIndicator) {
      statusIndicator.classList.add('active');
    }

    const toggleEnabled = document.getElementById('toggle-enabled');
    if (settings.enabled && toggleEnabled) {
      toggleEnabled.classList.add('active');
    }
  }

  private updateSetting(key: keyof SubtitleSettings, value: any) {
    if (!this.extensionState) return;

    this.extensionState.settings = {
      ...this.extensionState.settings,
      [key]: value,
    };
  }

  private toggleEnabled() {
    if (!this.extensionState) return;

    const newValue = !this.extensionState.settings.enabled;
    this.updateSetting('enabled', newValue);

    const toggleEnabled = document.getElementById('toggle-enabled');
    if (toggleEnabled) {
      toggleEnabled.classList.toggle('active');
    }

    const statusIndicator = document.getElementById('status-indicator');
    if (statusIndicator) {
      statusIndicator.classList.toggle('active');
    }

    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { enabled: newValue },
    });
  }

  private resetSettings() {
    if (confirm('Reset all settings to default?')) {
      const defaultSettings: SubtitleSettings = {
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

      this.extensionState!.settings = defaultSettings;
      this.updateUI();
      this.saveSettings();
    }
  }

  private saveSettings() {
    if (!this.extensionState) return;

    chrome.runtime.sendMessage(
      {
        type: 'UPDATE_SETTINGS',
        payload: this.extensionState.settings,
      },
      () => {
        console.log('Settings saved');
        // Show save confirmation
        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
          const originalText = btnSave.textContent;
          btnSave.textContent = '✓ Saved!';
          setTimeout(() => {
            btnSave.textContent = originalText;
          }, 2000);
        }
      }
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}

export {};
