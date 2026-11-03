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

    it('detects conversational questions with spoken filler prefixes without question marks', () => {
      expect(isLikelyQuestion('so what is your experience with React')).toBe(true);
      expect(isLikelyQuestion('okay can you explain your architecture choices')).toBe(true);
      expect(isLikelyQuestion('and how did you optimize database queries')).toBe(true);
      expect(isLikelyQuestion('please describe your greatest technical achievement')).toBe(true);
      expect(isLikelyQuestion('now walk me through your recent project')).toBe(true);
    });

    it('rejects regular statements', () => {
      expect(isLikelyQuestion('I worked at Google for five years.')).toBe(false);
      expect(isLikelyQuestion('The quick brown fox jumps over the lazy dog.')).toBe(false);
      expect(isLikelyQuestion('Thanks for having me today.')).toBe(false);
      expect(isLikelyQuestion('')).toBe(false);
      expect(isLikelyQuestion('   ')).toBe(false);
      expect(isLikelyQuestion('ok')).toBe(false);
      expect(isLikelyQuestion('yes sure')).toBe(false);
    });

    it('detects questions embedded in multi-sentence segments', () => {
      expect(isLikelyQuestion('Great thanks for that. Can you tell me about your experience with databases')).toBe(true);
      expect(isLikelyQuestion('Okay moving on. What is your approach to testing')).toBe(true);
      expect(isLikelyQuestion('Interesting. Describe a challenging project you worked on')).toBe(true);
    });

    it('detects give-me-example and explain patterns', () => {
      expect(isLikelyQuestion('give me an example of a time you led a project')).toBe(true);
      expect(isLikelyQuestion('explain how you would design a caching system')).toBe(true);
      expect(isLikelyQuestion('describe your experience with microservices')).toBe(true);
    });

    it('detects indirect/preamble-style interviewer questions', () => {
      expect(isLikelyQuestion('I would like to know about your experience with react')).toBe(true);
      expect(isLikelyQuestion("I'd like to hear about your leadership style")).toBe(true);
      expect(isLikelyQuestion('I wanted to ask what made you apply for this role')).toBe(true);
      expect(isLikelyQuestion("let's talk about your previous role")).toBe(true);
      expect(isLikelyQuestion("let's discuss your technical background")).toBe(true);
    });

    it('detects request-style and behavioral interview directives', () => {
      expect(isLikelyQuestion('share with me your experience in leadership')).toBe(true);
      expect(isLikelyQuestion('talk about a time you failed')).toBe(true);
      expect(isLikelyQuestion('talk about your experience with databases')).toBe(true);
      expect(isLikelyQuestion('elaborate on your previous answer please')).toBe(true);
    });

    it('detects questions after long preambles (spoken clause splitting)', () => {
      expect(isLikelyQuestion('we have a position open and I wanted to ask what made you apply')).toBe(true);
      expect(isLikelyQuestion('so the next question is about your technical skills what programming languages do you know')).toBe(true);
      expect(isLikelyQuestion('you mentioned you worked at Google tell me more about that')).toBe(true);
    });

    it('still rejects pure statements and observations', () => {
      expect(isLikelyQuestion('I see here that you worked on microservices architecture')).toBe(false);
      expect(isLikelyQuestion('looking at your resume I see you have experience with Python')).toBe(false);
      expect(isLikelyQuestion('thanks for that now moving on to the next topic')).toBe(false);
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
