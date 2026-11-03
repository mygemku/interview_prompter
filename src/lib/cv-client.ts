import type { CvData } from '../context/types';

export async function uploadCv(file: File): Promise<CvData> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/cv-parse', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CV parse failed: ${err}`);
  }

  return res.json();
}
