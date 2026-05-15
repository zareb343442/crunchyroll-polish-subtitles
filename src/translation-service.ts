// Translation service for Japanese to Polish

import type { TranslationResult } from './types';

export class TranslationService {
  private model: any = null;
  private modelName: string;
  private isInitialized = false;
  private translationCache: Map<string, string> = new Map();
  private maxCacheSize = 1000;
  private contextMemory: Map<string, string> = new Map();

  constructor(modelName: 'nllb-200-distilled' | 'mariannmt-ja-pl' = 'nllb-200-distilled') {
    this.modelName = modelName;
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      console.log(`[TranslationService] Loading translation model: ${this.modelName}`);

      const { pipeline } = await import('@xenova/transformers');

      if (this.modelName === 'nllb-200-distilled') {
        this.model = await pipeline('translation', 'Xenova/nllb-200-distilled-600M', {
          quantized: true,
          device: 'webgpu',
        });
      } else {
        // MarianMT model
        this.model = await pipeline('translation', 'Xenova/marian-finetuned-kde-en-to-en', {
          quantized: true,
          device: 'webgpu',
        });
      }

      this.isInitialized = true;
      console.log('[TranslationService] Model initialized successfully');
    } catch (error) {
      console.error('[TranslationService] Model initialization failed:', error);
      // Fallback
      try {
        const { pipeline } = await import('@xenova/transformers');
        this.model = await pipeline('translation', `Xenova/${this.modelName}`);
        this.isInitialized = true;
        console.log('[TranslationService] Model initialized on CPU fallback');
      } catch (fallbackError) {
        console.error('[TranslationService] Fallback initialization failed:', fallbackError);
      }
    }
  }

  async translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<TranslationResult> {
    if (!text.trim()) {
      return {
        originalText: text,
        translatedText: '',
        sourceLanguage,
        targetLanguage,
      };
    }

    // Check cache
    const cacheKey = `${text}::${sourceLanguage}::${targetLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      return {
        originalText: text,
        translatedText: this.translationCache.get(cacheKey) || '',
        sourceLanguage,
        targetLanguage,
      };
    }

    try {
      if (!this.isInitialized || !this.model) {
        console.warn('[TranslationService] Model not initialized');
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
        };
      }

      // Preprocess text (remove honorifics temporarily to preserve them)
      const { processed, honorifics } = this.preprocessText(text);

      // Perform translation
      const result = await this.model(processed, {
        src_lang: sourceLanguage,
        tgt_lang: targetLanguage,
      });

      let translatedText = result[0]?.translation_text || text;

      // Postprocess (restore honorifics)
      translatedText = this.postprocessText(translatedText, honorifics);

      // Store in cache
      if (this.translationCache.size >= this.maxCacheSize) {
        const firstKey = this.translationCache.keys().next().value;
        this.translationCache.delete(firstKey);
      }
      this.translationCache.set(cacheKey, translatedText);

      // Store in context memory for consistency
      this.contextMemory.set(text, translatedText);

      return {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
      };
    } catch (error) {
      console.error('[TranslationService] Translation error:', error);
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  private preprocessText(text: string): { processed: string; honorifics: Map<string, string> } {
    const honorifics = new Map<string, string>();
    let processed = text;

    // Preserve Japanese honorifics
    const honorificPatterns = [
      { pattern: /さん/g, placeholder: '<HONORIFIC_SAN>', honorific: 'さん' },
      { pattern: /くん/g, placeholder: '<HONORIFIC_KUN>', honorific: 'くん' },
      { pattern: /様/g, placeholder: '<HONORIFIC_SAMA>', honorific: '様' },
      { pattern: /先生/g, placeholder: '<HONORIFIC_SENSEI>', honorific: '先生' },
    ];

    for (const { pattern, placeholder, honorific } of honorificPatterns) {
      let match;
      let counter = 0;
      while ((match = pattern.exec(text)) !== null) {
        const key = `${placeholder}_${counter}`;
        honorifics.set(key, honorific);
        processed = processed.replace(honorific, key);
        counter++;
      }
    }

    return { processed, honorifics };
  }

  private postprocessText(text: string, honorifics: Map<string, string>): string {
    let result = text;

    for (const [key, honorific] of honorifics) {
      result = result.replace(key, honorific);
    }

    return result;
  }

  clearCache(): void {
    this.translationCache.clear();
  }

  clearContextMemory(): void {
    this.contextMemory.clear();
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
