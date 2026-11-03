import type { AnswerStyle, CvSection } from '../context/types';

export function buildSystemPrompt(answerStyle: AnswerStyle, cvSections: CvSection[]): string {
  const styleInstructions: Record<AnswerStyle, string> = {
    'first-person': 'Answer in first person as if the candidate is speaking naturally. Use "I" statements. Keep answers 2-4 sentences.',
    'bullet-points': 'Provide 3-5 concise bullet points the candidate can use as talking points.',
    'concise-notes': 'Give a brief, structured outline with key points and specific details to mention.',
  };

  const cvText = cvSections
    .map((s) => `[${s.type.toUpperCase()}: ${s.title}]\n${s.content}`)
    .join('\n\n');

  return `You are an interview answer assistant. The candidate has provided their CV/resume below.
Your role is to help them answer interview questions using information from their CV.

ANSWER STYLE: ${styleInstructions[answerStyle]}

RULES:
- Use ONLY information from the CV. Do not fabricate experiences or skills.
- If the CV doesn't contain relevant information, say so honestly and suggest how to pivot the answer to related experience.
- Sound natural and confident, not robotic.
- Highlight specific metrics, technologies, and achievements from the CV.
- Be concise — this will be read as a teleprompter during a live interview.

CANDIDATE'S CV:
---
${cvText}
---`;
}

/** Score CV sections by relevance to question keywords. Return top N. */
export function selectRelevantSections(
  sections: CvSection[],
  questionKeywords: string[],
  topN = 5,
): CvSection[] {
  if (sections.length <= topN) return sections;

  const scored = sections.map((section) => {
    const sectionText = `${section.title} ${section.content} ${section.keywords.join(' ')}`.toLowerCase();
    let score = 0;
    for (const kw of questionKeywords) {
      if (sectionText.includes(kw)) score++;
    }
    // Boost experience and skills sections
    if (section.type === 'experience') score += 1;
    if (section.type === 'skills') score += 0.5;
    return { section, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map((s) => s.section);
}
