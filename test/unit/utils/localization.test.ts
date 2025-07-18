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
  beforeEach(async () => {
    // Reset to English before each test
    await LocalizationService.getInstance('en');
  });

  it('initializes and translates keys in default locale', async () => {
    await LocalizationService.getInstance('en');
    const result = LocalizationService.t('clarity');
    expect(result).toBe('Clarity');
  });

  it('translates keys in different locales', async () => {
    for (const { locale, key, expected } of testCases) {
      await LocalizationService.getInstance(locale);
      const result = LocalizationService.t(key);
      expect(result).toBe(expected);
    }
  });

  it('switches language dynamically', async () => {
    await LocalizationService.getInstance('en');
    expect(LocalizationService.t('clarity')).toBe('Clarity');
    await LocalizationService.getInstance('de');
    expect(LocalizationService.t('clarity')).toBe('Klarheit');
  });

  it('returns the correct translation for all keys in both languages', async () => {
    const keys = Object.keys(await import('../../../src/locales/en.json')) as TranslationKey[];
    for (const key of keys) {
      await LocalizationService.getInstance('en');
      const enResult = LocalizationService.t(key);
      await LocalizationService.getInstance('de');
      const deResult = LocalizationService.t(key);
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
    await LocalizationService.getInstance('en');
    const result = LocalizationService.t(nonExistentKey);
    expect(result).toBe('non_existent_key');
  });
});
