import i18next, { type Resource, type i18n } from 'i18next';
import en from '../locales/en.json';
import de from '../locales/de.json';

export type SupportedLocale = 'en' | 'de';
export type TranslationKey = keyof typeof en;

const resources: Resource = {
  en: { translation: en },
  de: { translation: de },
};

export class LocalizationService {
  private i18n: i18n;
  private initialized = false;

  constructor() {
    this.i18n = i18next.createInstance();
  }

  async init(locale: SupportedLocale = 'en') {
    if (!this.initialized) {
      await this.i18n.init({
        lng: locale,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: false },
      });
      this.initialized = true;
    } else {
      await this.i18n.changeLanguage(locale);
    }
  }

  async t(key: TranslationKey, locale?: SupportedLocale): Promise<string> {
    if (locale) {
      await this.init(locale);
    }
    return this.i18n.t(key);
  }
}

// Singleton instance for app-wide use
export const localizationService = new LocalizationService();

/**
 * Example usage:
 *
 * import { localizationService } from './utils/localization';
 *
 * async function greet() {
 *   await localizationService.init('de');
 *   const clarity = await localizationService.t('clarity');
 *   console.log(clarity); // "Klarheit"
 * }
 */
