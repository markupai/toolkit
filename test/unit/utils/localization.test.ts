import { describe, it, expect, beforeEach } from 'vitest';
import { LocalizationService, SupportedLocale, TranslationKey } from '../../../src/utils/localization';

const testCases: Array<{
  locale: SupportedLocale;
  key: TranslationKey;
  expected: string;
}> = [
  { locale: 'en', key: 'clarity', expected: 'Clarity' },
  { locale: 'de', key: 'clarity', expected: 'Klarheit' },
  { locale: 'en', key: 'business', expected: 'Business' },
  { locale: 'de', key: 'business', expected: 'Geschäftlich' },
];

describe('LocalizationService', () => {
  let localizationService: LocalizationService;

  beforeEach(async () => {
    // Reset the singleton before each test
    LocalizationService.reset();
    // Initialize with English
    localizationService = await LocalizationService.getInstance('en');
  });

  it('initializes and translates keys in default locale', async () => {
    const result = localizationService.t('clarity');
    expect(result).toBe('Clarity');
  });

  it('translates keys in different locales', async () => {
    for (const { locale, key, expected } of testCases) {
      await localizationService.changeLanguage(locale);
      const result = localizationService.t(key);
      expect(result).toBe(expected);
    }
  });

  it('switches language dynamically', async () => {
    expect(localizationService.t('clarity')).toBe('Clarity');
    await localizationService.changeLanguage('de');
    expect(localizationService.t('clarity')).toBe('Klarheit');
  });

  it('returns the correct translation for all keys in both languages', async () => {
    const keys = Object.keys(await import('../../../src/locales/en.json')) as TranslationKey[];
    for (const key of keys) {
      await localizationService.changeLanguage('en');
      const enResult = localizationService.t(key);
      await localizationService.changeLanguage('de');
      const deResult = localizationService.t(key);
      expect(typeof enResult).toBe('string');
      expect(typeof deResult).toBe('string');
      expect(enResult).not.toBe('');
      expect(deResult).not.toBe('');
    }
  });

  it('returns the key itself when translation key does not exist', async () => {
    // TypeScript will prevent this at compile time, but we can test runtime behavior
    // by using type assertion to bypass the type system
    const nonExistentKey = 'non_existent_key' as TranslationKey;
    const result = localizationService.t(nonExistentKey);
    expect(result).toBe('non_existent_key');
  });

  it('handles concurrent initialization correctly', async () => {
    // Reset to test concurrent initialization
    LocalizationService.reset();

    // Start multiple concurrent getInstance calls
    const promises = [
      LocalizationService.getInstance('en'),
      LocalizationService.getInstance('de'),
      LocalizationService.getInstance('en'),
    ];

    const instances = await Promise.all(promises);

    // All should return the same instance
    expect(instances[0]).toBe(instances[1]);
    expect(instances[1]).toBe(instances[2]);

    // The last language change should be active
    expect(instances[0].getCurrentLanguage()).toBe('en');
  });

  it('provides current language information', async () => {
    expect(localizationService.getCurrentLanguage()).toBe('en');
    await localizationService.changeLanguage('de');
    expect(localizationService.getCurrentLanguage()).toBe('de');
  });

  it('checks initialization status correctly', async () => {
    LocalizationService.reset();
    expect(LocalizationService.isInitialized()).toBe(false);

    await LocalizationService.getInstance('en');
    expect(LocalizationService.isInitialized()).toBe(true);
  });
});
