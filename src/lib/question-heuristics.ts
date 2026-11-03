/** Heuristics to detect if a transcript segment is a question. */

const QUESTION_WORDS = /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|have|has|had|tell|describe|explain|walk|give)\b/i;
const QUESTION_MARK = /\?/;

// Filler prefixes often added in spoken speech
const FILLER_PREFIX = /^(okay|ok|so|and|now|well|alright|next|please|hey|hi|hello|um|uh|right|let's see|moving on|another thing|let me ask)[,\s]+/i;

function stripFillers(text: string): string {
  let cleaned = text;
  let prev = '';
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(FILLER_PREFIX, '').trim();
  }
  return cleaned;
}

export function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.split(/\s+/).length < 3) return false;
  if (QUESTION_MARK.test(trimmed)) return true;
  if (QUESTION_WORDS.test(trimmed)) return true;

  const cleaned = stripFillers(trimmed);

  if (QUESTION_MARK.test(cleaned)) return true;
  if (QUESTION_WORDS.test(cleaned)) return true;
  if (/^tell\s+(me|us)\b/i.test(cleaned)) return true;
  if (/^walk\s+(me|us)\b/i.test(cleaned)) return true;

  // Embedded question patterns (interviewer style)
  if (/\b(what\s+(is|are|was|were|do|would|did)|how\s+(do|did|can|would|are)|why\s+(did|do|is|are|would)|can\s+you|could\s+you|would\s+you|tell\s+me\s+about|walk\s+me\s+through|describe\s+(a|an|your|the)|explain\s+(how|why|what|your|the)|give\s+(me|us)\s+(an?\s+)?example)\b/i.test(trimmed)) {
    return true;
  }

  // Sentence-split: check if any sentence within the segment is a question
  const sentences = trimmed.split(/[.!]\s+/);
  if (sentences.length > 1) {
    for (const sentence of sentences) {
      const s = stripFillers(sentence.trim());
      if (s.length > 10 && (QUESTION_WORDS.test(s) || QUESTION_MARK.test(s))) {
        return true;
      }
    }
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
