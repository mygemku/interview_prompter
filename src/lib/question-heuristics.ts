/** Heuristics to detect if a transcript segment is a question. */

const QUESTION_WORDS = /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|have|has|had|tell|describe|explain|walk|give)\b/i;
const QUESTION_MARK = /\?/;

export function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (QUESTION_MARK.test(trimmed)) return true;
  if (QUESTION_WORDS.test(trimmed)) return true;
  // "Tell me about..." style
  if (/^tell\s+me/i.test(trimmed)) return true;
  return false;
}

export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'between',
    'through', 'and', 'but', 'or', 'not', 'no', 'so', 'if', 'then',
    'than', 'too', 'very', 'just', 'that', 'this', 'it', 'its', 'my',
    'your', 'our', 'we', 'you', 'me', 'us', 'he', 'she', 'they', 'them',
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'tell',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}
