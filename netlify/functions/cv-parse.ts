import type { Context } from "@netlify/functions";
import mammoth from "mammoth";

function ensurePolyfills() {
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init) || (init && typeof init.length === 'number')) {
          if (init.length === 6) {
            this.a = this.m11 = init[0];
            this.b = this.m12 = init[1];
            this.c = this.m21 = init[2];
            this.d = this.m22 = init[3];
            this.e = this.m41 = init[4];
            this.f = this.m42 = init[5];
          } else if (init.length === 16) {
            this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
            this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
            this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
            this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
            this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22;
            this.e = this.m41; this.f = this.m42;
          }
        }
      }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      multiply() { return this; }
      preMultiplySelf() { return this; }
      multiplySelf() { return this; }
      invertSelf() { return this; }
      transformPoint(p: any) { return p || { x: 0, y: 0 }; }
    };
  }
  if (typeof (globalThis as any).Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {
      addPath() {}
    };
  }
  if (typeof (globalThis as any).ImageData === 'undefined') {
    (globalThis as any).ImageData = class ImageData {
      width = 0;
      height = 0;
      data = new Uint8ClampedArray(0);
      constructor(w = 0, h = 0) {
        this.width = w;
        this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    };
  }
}

ensurePolyfills();

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
      ensurePolyfills();
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      rawText = typeof textResult === 'string' ? textResult : (textResult as any).text ?? '';
      await parser.destroy();
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
