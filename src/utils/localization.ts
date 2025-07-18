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
  private static localizationService: LocalizationService | null = null;
  private static i18n: i18n | null = null;
  private static isInitializing = false;
  private static initPromise: Promise<LocalizationService> | null = null;

  private constructor() {
    console.log('LocalizationService initialized');
  }

  static async getInstance(locale: SupportedLocale = 'en'): Promise<LocalizationService> {
    // If already initialized, just change language and return
    if (LocalizationService.localizationService && LocalizationService.i18n) {
      await LocalizationService.i18n.changeLanguage(locale);
      return LocalizationService.localizationService;
    }

    // If already initializing, wait for the existing promise
    if (LocalizationService.isInitializing && LocalizationService.initPromise) {
      const instance = await LocalizationService.initPromise;
      await LocalizationService.i18n?.changeLanguage(locale);
      return instance;
    }

    // Start initialization
    LocalizationService.isInitializing = true;
    LocalizationService.initPromise = LocalizationService.initializeInstance(locale);

    try {
      const instance = await LocalizationService.initPromise;
      LocalizationService.isInitializing = false;
      return instance;
    } catch (error) {
      LocalizationService.isInitializing = false;
      LocalizationService.initPromise = null;
      throw error;
    }
  }

  private static async initializeInstance(locale: SupportedLocale): Promise<LocalizationService> {
    LocalizationService.localizationService = new LocalizationService();
    LocalizationService.i18n = i18next.createInstance();

    await LocalizationService.i18n.init({
      lng: locale,
      fallbackLng: 'en',
      resources,
      interpolation: { escapeValue: false },
    });

    return LocalizationService.localizationService;
  }

  public async changeLanguage(locale: SupportedLocale): Promise<void> {
    if (!LocalizationService.i18n) {
      throw new Error('LocalizationService not initialized. Call getInstance() first.');
    }
    await LocalizationService.i18n.changeLanguage(locale);
  }

  public t(key: TranslationKey): string {
    if (!LocalizationService.i18n) {
      throw new Error('LocalizationService not initialized. Call getInstance() first.');
    }
    return LocalizationService.i18n.t(key);
  }

  // Method to get current language
  public getCurrentLanguage(): string {
    if (!LocalizationService.i18n) {
      throw new Error('LocalizationService not initialized. Call getInstance() first.');
    }
    return LocalizationService.i18n.language;
  }

  // Method to check if service is initialized
  public static isInitialized(): boolean {
    return LocalizationService.localizationService !== null && LocalizationService.i18n !== null;
  }

  // Reset method for testing or hot reloading
  public static reset(): void {
    LocalizationService.localizationService = null;
    LocalizationService.i18n = null;
    LocalizationService.isInitializing = false;
    LocalizationService.initPromise = null;
  }
}
