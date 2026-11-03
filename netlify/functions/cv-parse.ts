import type { Context } from "@netlify/functions";
import { extractText } from "unpdf";
import mammoth from "mammoth";

interface CvSection {
  id: string;
  type: string;
  title: string;
  content: string;
  keywords: string[];
}

const SECTION_PATTERNS = [
  { type: 'summary', pattern: /^(summary|profile|about|objective)/i },
  { type: 'experience', pattern: /^(experience|work|employment|professional)/i },
  { type: 'education', pattern: /^(education|academic|qualification|degree)/i },
  { type: 'skills', pattern: /^(skills|technical|competenc|technologies|tools)/i },
  { type: 'projects', pattern: /^(projects|portfolio|personal)/i },
  { type: 'certifications', pattern: /^(certif|licens|award|honor)/i },
];

function detectSectionType(title: string): string {
  for (const { type, pattern } of SECTION_PATTERNS) {
    if (pattern.test(title.trim())) return type;
  }
  return 'other';
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s+#.]/g, '').split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'and', 'or', 'in', 'at', 'to', 'for', 'of', 'with', 'on']);
  return [...new Set(words.filter(w => w.length > 2 && !stopWords.has(w)))].slice(0, 20);
}

function chunkCvText(text: string): CvSection[] {
  // Split by likely section headers (lines that are all caps, or short bold-like lines)
  const lines = text.split('\n');
  const sections: CvSection[] = [];
  let currentTitle = 'Summary';
  let currentContent: string[] = [];
  let sectionIdx = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Heuristic: section header if short, mostly uppercase or ends with ':'
    const isHeader = (
      (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      (trimmed.length < 60 && trimmed.endsWith(':'))
    );

    if (isHeader && currentContent.length > 0) {
      const type = detectSectionType(currentTitle);
      const content = currentContent.join('\n').trim();
      if (content) {
        sections.push({
          id: `section-${sectionIdx++}`,
          type,
          title: currentTitle,
          content,
          keywords: extractKeywords(content),
        });
      }
      currentTitle = trimmed.replace(/:$/, '');
      currentContent = [];
    } else {
      currentContent.push(trimmed);
    }
  }

  // Last section
  if (currentContent.length > 0) {
    const type = detectSectionType(currentTitle);
    const content = currentContent.join('\n').trim();
    if (content) {
      sections.push({
        id: `section-${sectionIdx++}`,
        type,
        title: currentTitle,
        content,
        keywords: extractKeywords(content),
      });
    }
  }

  // If no sections detected, treat entire text as one section
  if (sections.length === 0) {
    sections.push({
      id: 'section-0',
      type: 'other',
      title: 'Full CV',
      content: text.trim(),
      keywords: extractKeywords(text),
    });
  }

  return sections;
}

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    if (ext === 'pdf') {
      const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
      rawText = typeof text === 'string' ? text : '';
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (ext === 'txt' || ext === 'md') {
      rawText = buffer.toString('utf-8');
    } else {
      return new Response('Unsupported file type. Use PDF, DOCX, TXT, or MD.', { status: 400 });
    }

    const sections = chunkCvText(rawText);

    return Response.json({
      fileName,
      uploadedAt: new Date().toISOString(),
      rawText,
      sections,
    });
  } catch (err) {
    console.error('CV parse error:', err);
    return new Response(`Parse error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
  }
}
