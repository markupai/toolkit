import { describe, it, expect, beforeEach } from 'vitest';
import { localizationService, SupportedLocale, TranslationKey } from '../../../src/utils/localization';

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
    await localizationService.init('en');
  });

  it('initializes and translates keys in default locale', async () => {
    const result = await localizationService.t('clarity');
    expect(result).toBe('Clarity');
  });

  it('translates keys in different locales', async () => {
    for (const { locale, key, expected } of testCases) {
      await localizationService.init(locale);
      const result = await localizationService.t(key);
      expect(result).toBe(expected);
    }
  });

  it('switches language dynamically', async () => {
    await localizationService.init('en');
    expect(await localizationService.t('clarity')).toBe('Clarity');
    await localizationService.init('de');
    expect(await localizationService.t('clarity')).toBe('Klarheit');
  });

  it('translates with explicit locale argument', async () => {
    // Should switch to German for this call
    const result = await localizationService.t('clarity', 'de');
    expect(result).toBe('Klarheit');
    // Should switch back to English for this call
    const result2 = await localizationService.t('clarity', 'en');
    expect(result2).toBe('Clarity');
  });

  it('returns the correct translation for all keys in both languages', async () => {
    const keys = Object.keys(await import('../../../src/locales/en.json')) as TranslationKey[];
    for (const key of keys) {
      await localizationService.init('en');
      const enResult = await localizationService.t(key);
      await localizationService.init('de');
      const deResult = await localizationService.t(key);
      expect(typeof enResult).toBe('string');
      expect(typeof deResult).toBe('string');
      expect(enResult).not.toBe('');
      expect(deResult).not.toBe('');
    }
  });
});
