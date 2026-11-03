import { describe, it, expect } from 'vitest';
import providersHandler from '../../netlify/functions/providers';

describe('API Functions', () => {
  describe('providersHandler', () => {
    it('returns supported AI providers with default models', async () => {
      const response = await providersHandler();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('providers');
      expect(Array.isArray(data.providers)).toBe(true);

      const providerIds = data.providers.map((p: any) => p.id);
      expect(providerIds).toContain('gemini');
      expect(providerIds).toContain('openai');
      expect(providerIds).toContain('claude');

      const gemini = data.providers.find((p: any) => p.id === 'gemini');
      expect(gemini.defaultModel).toBe('gemini-3.5-flash-lite');
      expect(gemini.models).toContain('gemini-3.5-flash-lite');
    });
  });
});
