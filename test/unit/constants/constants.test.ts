import { describe, it, expect } from 'vitest';
import { getAdminConstants } from '../../../src/constants/internal/constants';

describe('Constants Unit Tests', () => {
  describe('getAdminConstants', () => {
    it('should return admin constants successfully', async () => {
      const result = await getAdminConstants();
      expect(result).toEqual({
        dialects: ['american_english', 'british_oxford', 'canadian_english'],
        tones: ['academic', 'business', 'conversational', 'formal', 'informal', 'technical'],
        style_guides: {
          '01971e03-dd27-75ee-9044-b48e654848cf': 'ap',
          '01971e03-dd27-77d8-a6fa-5edb6a1f4ad2': 'chicago',
          '01971e03-dd27-779f-b3ec-b724a2cf809f': 'microsoft',
          '019755eb-b98f-79b0-84b2-5f09118083f1': 'demo',
        },
        colors: {
          green: { value: 'rgb(120, 253, 134)', min_score: 80 },
          yellow: { value: 'rgb(246, 240, 104)', min_score: 60 },
          red: { value: 'rgb(235, 94, 94)', min_score: 0 },
        },
      });
    });
  });
});
