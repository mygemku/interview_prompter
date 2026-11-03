import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, selectRelevantSections } from '../lib/prompt-builder';
import type { CvSection } from '../context/types';

describe('prompt-builder', () => {
  const mockSections: CvSection[] = [
    {
      id: 'sec-1',
      type: 'experience',
      title: 'Senior Frontend Developer',
      content: 'Built React apps with Next.js, Redux, and Tailwind CSS. Led 4 developers.',
      keywords: ['react', 'next.js', 'redux', 'frontend'],
    },
    {
      id: 'sec-2',
      type: 'experience',
      title: 'Backend Engineer',
      content: 'Developed microservices in Python, Django, PostgreSQL, and Kafka.',
      keywords: ['python', 'django', 'postgresql', 'backend'],
    },
    {
      id: 'sec-3',
      type: 'skills',
      title: 'Technical Skills',
      content: 'React, TypeScript, Node.js, Docker, AWS.',
      keywords: ['react', 'typescript', 'docker'],
    },
    {
      id: 'sec-4',
      type: 'education',
      title: 'BSc Computer Science',
      content: 'Graduated in 2020 with honors.',
      keywords: ['education', 'degree'],
    },
  ];

  describe('buildSystemPrompt', () => {
    it('includes first-person instructions for first-person style', () => {
      const prompt = buildSystemPrompt('first-person', mockSections);
      expect(prompt).toContain('Answer in first person');
      expect(prompt).toContain('Senior Frontend Developer');
      expect(prompt).toContain('ONLY information from the CV');
    });

    it('includes bullet-point instructions for bullet-points style', () => {
      const prompt = buildSystemPrompt('bullet-points', mockSections);
      expect(prompt).toContain('bullet points');
    });

    it('includes concise-notes instructions for concise-notes style', () => {
      const prompt = buildSystemPrompt('concise-notes', mockSections);
      expect(prompt).toContain('structured outline');
    });
  });

  describe('selectRelevantSections', () => {
    it('ranks sections matching keywords highest', () => {
      const relevant = selectRelevantSections(mockSections, ['react', 'frontend'], 2);
      expect(relevant.length).toBe(2);
      expect(relevant[0].id).toBe('sec-1');
    });

    it('ranks backend sections higher when backend keywords are searched', () => {
      const relevant = selectRelevantSections(mockSections, ['python', 'django', 'backend'], 2);
      expect(relevant.length).toBe(2);
      expect(relevant[0].id).toBe('sec-2');
    });

    it('returns all sections if total count <= topN', () => {
      const relevant = selectRelevantSections(mockSections, ['react'], 10);
      expect(relevant.length).toBe(4);
    });
  });
});
