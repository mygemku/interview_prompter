import { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadCv } from '../../lib/cv-client';

export function CvUploader() {
  const { state, dispatch } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setError('Please upload a PDF or DOCX file');
        return;
      }

      setIsUploading(true);
      setError(null);
      try {
        const cvData = await uploadCv(file);
        dispatch({ type: 'SET_CV', payload: cvData });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [dispatch],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const loadSampleCv = useCallback(() => {
    dispatch({
      type: 'SET_CV',
      payload: {
        fileName: 'Sample_Senior_Software_Engineer_CV.pdf',
        uploadedAt: new Date().toISOString(),
        rawText: `Alex Chen - Senior Full Stack Engineer\n\nSUMMARY\nPassionate software engineer with 6+ years experience in scalable React, Node.js, and cloud systems. Proven track record leading front-end architecture and high-throughput microservices.\n\nEXPERIENCE\nSenior Software Engineer at HyperScale Tech (2022 - Present)\n- Led migration from monolithic frontend to React + Next.js, cutting page load time by 42%.\n- Mentored team of 6 engineers and introduced automated testing, raising coverage from 50% to 88%.\n- Designed real-time event streaming pipeline processing 10M+ daily events using Node.js and Kafka.\n\nSoftware Engineer at CloudNative Solutions (2019 - 2022)\n- Built responsive React dashboards and internal tooling used by 50,000+ business clients.\n- Optimized PostgreSQL queries and Redis caching, cutting P99 latency from 800ms to 95ms.\n- Co-authored company design system and standard component library.\n\nSKILLS\n- Languages: TypeScript, JavaScript, Python, Go, SQL\n- Frontend: React, Next.js, Tailwind CSS, Vite, Redux, Zustand\n- Backend: Node.js, Express, Fastify, GraphQL, REST APIs, Kafka\n- Databases: PostgreSQL, MongoDB, Redis, Prisma\n- DevOps & Tools: Docker, Kubernetes, AWS (S3, Lambda, ECS), Git, CI/CD pipelines\n\nEDUCATION\nBachelor of Science in Computer Science, University of Technology (2015 - 2019)`,
        sections: [
          {
            id: 'sec-summary',
            type: 'summary',
            title: 'Professional Summary',
            content: 'Passionate software engineer with 6+ years experience in scalable React, Node.js, and cloud systems. Proven track record leading front-end architecture and high-throughput microservices.',
            keywords: ['software', 'engineer', 'react', 'node.js', 'cloud', 'architecture', 'microservices'],
          },
          {
            id: 'sec-exp-1',
            type: 'experience',
            title: 'Senior Software Engineer at HyperScale Tech (2022 - Present)',
            content: 'Led migration from monolithic frontend to React + Next.js, cutting page load time by 42%. Mentored team of 6 engineers and introduced automated testing, raising coverage from 50% to 88%. Designed real-time event streaming pipeline processing 10M+ daily events using Node.js and Kafka.',
            keywords: ['hyperscale', 'migration', 'react', 'next.js', 'mentored', 'coverage', 'streaming', 'kafka', 'node.js'],
          },
          {
            id: 'sec-exp-2',
            type: 'experience',
            title: 'Software Engineer at CloudNative Solutions (2019 - 2022)',
            content: 'Built responsive React dashboards and internal tooling used by 50,000+ business clients. Optimized PostgreSQL queries and Redis caching, cutting P99 latency from 800ms to 95ms. Co-authored company design system and standard component library.',
            keywords: ['cloudnative', 'react', 'dashboards', 'postgresql', 'redis', 'caching', 'latency', 'design system'],
          },
          {
            id: 'sec-skills',
            type: 'skills',
            title: 'Technical Skills',
            content: 'Languages: TypeScript, JavaScript, Python, Go, SQL. Frontend: React, Next.js, Tailwind CSS, Vite, Redux. Backend: Node.js, Express, Fastify, GraphQL, REST APIs, Kafka. Databases: PostgreSQL, MongoDB, Redis, Prisma. DevOps: Docker, Kubernetes, AWS, Git, CI/CD.',
            keywords: ['typescript', 'javascript', 'react', 'next.js', 'tailwind', 'node.js', 'express', 'postgresql', 'docker', 'aws'],
          },
          {
            id: 'sec-edu',
            type: 'education',
            title: 'Education',
            content: 'Bachelor of Science in Computer Science, University of Technology (2015 - 2019)',
            keywords: ['bachelor', 'computer', 'science', 'university', 'technology'],
          },
        ],
      },
    });
  }, [dispatch]);

  if (state.cv) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="font-medium text-sm truncate">{state.cv.fileName}</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLEAR_CV' })}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {state.cv.sections.length} sections parsed
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-400'}`}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          id="cv-upload"
        />
        <label htmlFor="cv-upload" className="cursor-pointer">
          {isUploading ? (
            <div className="text-blue-400">
              <div className="text-3xl mb-2 animate-spin">⏳</div>
              <p className="text-sm">Parsing CV...</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-gray-300">Drop PDF/DOCX here or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">Your CV stays in this session only</p>
            </>
          )}
        </label>
      </div>
      <div className="mt-3 text-center">
        <button
          onClick={loadSampleCv}
          className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          Or load sample CV for testing
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
