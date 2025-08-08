import type { Constants } from './constants.types';

export async function getAdminConstants(): Promise<Constants> {
  return {
    dialects: ['american_english', 'british_oxford', 'canadian_english'],
    tones: ['academic', 'business', 'conversational', 'formal', 'informal', 'technical'],
    style_guides: {
      '01971e03-dd27-75ee-9044-b48e654848cf': 'ap',
      '01971e03-dd27-77d8-a6fa-5edb6a1f4ad2': 'chicago',
      '01971e03-dd27-779f-b3ec-b724a2cf809f': 'microsoft',
      '019755eb-b98f-79b0-84b2-5f09118083f1': 'demo',
    },
    colors: {
      green: {
        min_score: 80,
        value: 'rgb(120, 253, 134)',
      },
      yellow: {
        min_score: 60,
        value: 'rgb(246, 240, 104)',
      },
      red: {
        min_score: 0,
        value: 'rgb(235, 94, 94)',
      },
    },
  };
}
