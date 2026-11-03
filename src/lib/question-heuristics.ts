/** Heuristics to detect if a transcript segment is a question. */

const QUESTION_WORDS = /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|have|has|had|tell|describe|explain|walk|give)\b/i;
const QUESTION_MARK = /\?/;

// Filler prefixes often added in spoken speech
const FILLER_PREFIX = /^(okay|ok|so|and|now|well|alright|next|please|hey|hi|hello|um|uh|right|let's see|moving on|another thing|let me ask|interesting|great|thanks for that|thank you)[,\s]+/i;

// Interviewer preambles before the real question
const PREAMBLE_PREFIX = /^(I would like to know|I'd like to know|I want to know|I wanted to ask|I was wondering|let me ask you|I'm curious|we'd like to understand|I'd like to hear|I want to hear|let's talk about|let's discuss|let's move on to)\b/i;

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

  // Interviewer preamble patterns — the whole utterance is a question
  if (PREAMBLE_PREFIX.test(cleaned)) return true;

  // Request-style interview directives (share/talk/discuss + topic)
  if (/^(share|talk|discuss|elaborate)\b/i.test(cleaned) && cleaned.split(/\s+/).length >= 4) return true;

  // Embedded question patterns (interviewer style)
  if (/\b(what\s+(is|are|was|were|do|would|did|made|programming|languages)|how\s+(do|did|can|would|are|should)|why\s+(did|do|is|are|would|should)|can\s+you|could\s+you|would\s+you|tell\s+me\s+(about|more)|walk\s+me\s+through|describe\s+(a|an|your|the)|explain\s+(how|why|what|your|the)|give\s+(me|us)\s+(an?\s+)?example)\b/i.test(trimmed)) {
    return true;
  }

  // "talk about a time" / "think of a time" — behavioral interview pattern
  if (/\b(talk|think|tell)\s+(about|of)\s+(a\s+time|an?\s+example|a\s+situation|a\s+project|your)\b/i.test(trimmed)) {
    return true;
  }

  // Sentence-split: check if any clause within the segment is a question
  // Speech recognition rarely produces periods, so also split on common
  // spoken clause boundaries
  const clauses = trimmed.split(/[.!]\s+|(?:,?\s+(?:and|but|so)\s+(?=(?:what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|have|has|had|tell|describe|explain)\b))/i);
  if (clauses.length > 1) {
    for (const clause of clauses) {
      const s = stripFillers(clause.trim());
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
