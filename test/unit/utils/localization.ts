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
  private static localizationService: LocalizationService;
  private static i18n: i18n;

  private constructor() {
    console.log('LocalizationService initialized');
  }

  static async getInstance(locale: SupportedLocale = 'en'): Promise<LocalizationService> {
    if (!LocalizationService.localizationService) {
      LocalizationService.localizationService = new LocalizationService();
      LocalizationService.i18n = i18next.createInstance();
      await LocalizationService.i18n.init({
        lng: locale,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: false },
      });
    }
    await LocalizationService.i18n.changeLanguage(locale);
    return LocalizationService.localizationService;
  }

  public async changeLanguage(locale: SupportedLocale): Promise<void> {
    await LocalizationService.i18n.changeLanguage(locale);
  }

  public t(key: TranslationKey): string {
    return LocalizationService.i18n.t(key);
  }
}
