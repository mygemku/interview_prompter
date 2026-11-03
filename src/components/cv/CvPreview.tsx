import { useApp } from '../../context/AppContext';

export function CvPreview() {
  const { state } = useApp();
  if (!state.cv) return null;

  return (
    <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CV Sections</h3>
      {state.cv.sections.map((section) => (
        <details key={section.id} className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-200 hover:text-white py-1 flex items-center gap-1">
            <span className="text-xs text-gray-500 group-open:rotate-90 transition-transform">▸</span>
            <span className="capitalize">{section.type}</span>
            {section.title !== section.type && (
              <span className="text-gray-400 text-xs ml-1">— {section.title}</span>
            )}
          </summary>
          <div className="text-xs text-gray-400 pl-4 pb-2 whitespace-pre-wrap leading-relaxed">
            {section.content.slice(0, 300)}
            {section.content.length > 300 && '...'}
          </div>
        </details>
      ))}
    </div>
  );
}
