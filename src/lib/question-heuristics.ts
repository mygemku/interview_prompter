/** Heuristics to detect if a transcript segment is a question. */

const QUESTION_WORDS = /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|have|has|had|tell|describe|explain|walk|give)\b/i;
const QUESTION_MARK = /\?/;

export function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (QUESTION_MARK.test(trimmed)) return true;
  if (QUESTION_WORDS.test(trimmed)) return true;

  // Clean common speech recognition filler prefixes ("so", "and", "okay", etc.)
  let cleaned = trimmed;
  let prev = '';
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned
      .replace(/^(okay|ok|so|and|now|well|alright|next|please|hey|hi|hello|um|uh)[,\s]+/i, '')
      .trim();
  }

  if (QUESTION_MARK.test(cleaned)) return true;
  if (QUESTION_WORDS.test(cleaned)) return true;
  if (/^tell\s+(me|us)\b/i.test(cleaned)) return true;
  if (/^walk\s+(me|us)\b/i.test(cleaned)) return true;

  // Also check if contains typical question patterns in conversational speech
  if (/\b(what\s+(is|are|was|were)|how\s+(do|did|can|would)|why\s+(did|do|is|are)|can\s+you|could\s+you|would\s+you|tell\s+me\s+about|walk\s+me\s+through)\b/i.test(trimmed)) {
    return true;
  }

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
