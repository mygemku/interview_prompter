import { describe, it, expect } from 'vitest';
import { isLikelyQuestion, extractKeywords } from '../lib/question-heuristics';

describe('question-heuristics', () => {
  describe('isLikelyQuestion', () => {
    it('detects sentences ending with question mark', () => {
      expect(isLikelyQuestion('What is your name?')).toBe(true);
      expect(isLikelyQuestion('Can you hear me?')).toBe(true);
      expect(isLikelyQuestion('Tell me more?')).toBe(true);
    });

    it('detects sentences starting with question words without ?', () => {
      expect(isLikelyQuestion('What are your biggest strengths')).toBe(true);
      expect(isLikelyQuestion('How do you manage team conflicts')).toBe(true);
      expect(isLikelyQuestion('Why did you leave your last job')).toBe(true);
      expect(isLikelyQuestion('Could you explain your React experience')).toBe(true);
      expect(isLikelyQuestion('Tell me about your background')).toBe(true);
      expect(isLikelyQuestion('Describe a time you failed')).toBe(true);
    });

    it('rejects regular statements', () => {
      expect(isLikelyQuestion('I worked at Google for five years.')).toBe(false);
      expect(isLikelyQuestion('The quick brown fox jumps over the lazy dog.')).toBe(false);
      expect(isLikelyQuestion('Thanks for having me today.')).toBe(false);
      expect(isLikelyQuestion('')).toBe(false);
      expect(isLikelyQuestion('   ')).toBe(false);
    });
  });

  describe('extractKeywords', () => {
    it('extracts non-stop words longer than 2 chars', () => {
      const keywords = extractKeywords('Tell me about your experience with React and TypeScript');
      expect(keywords).toContain('experience');
      expect(keywords).toContain('react');
      expect(keywords).toContain('typescript');
      expect(keywords).not.toContain('tell');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('with');
      expect(keywords).not.toContain('me');
    });

    it('handles special characters and punctuation', () => {
      const keywords = extractKeywords('Node.js, GraphQL & Next-Gen APIs!');
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('graphql');
    });

    it('returns empty array for empty string', () => {
      expect(extractKeywords('')).toEqual([]);
    });
  });
});
