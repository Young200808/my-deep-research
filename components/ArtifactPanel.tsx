import React, { useEffect, useRef } from 'react';
import { ResearchState, Source } from '../types';
import { MarkdownView } from './MarkdownView';
import { XIcon, FileTextIcon, LinkIcon, SparklesIcon } from './Icons';

interface ArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  researchState: ResearchState;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  isOpen,
  onClose,
  researchState,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (researchState.status === 'streaming' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [researchState.reportContent, researchState.status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[55%] lg:w-[60%] bg-surface/95 backdrop-blur-xl border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FileTextIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Research Artifact</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                researchState.status === 'streaming' ? 'bg-green-500 animate-pulse' : 
                researchState.status === 'completed' ? 'bg-blue-500' : 'bg-zinc-500'
              }`} />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {researchState.status === 'streaming' ? 'Generating Report...' : 
                 researchState.status === 'completed' ? 'Report Ready' : 'Standby'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth" ref={contentRef}>
        {researchState.reportContent ? (
          <MarkdownView content={researchState.reportContent} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
             <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-zinc-600" />
             </div>
             <p>Research content will appear here.</p>
          </div>
        )}
      </div>

      {/* Sources Footer */}
      {researchState.sources.length > 0 && (
        <div className="border-t border-border bg-surface/50 p-4 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
            Sources ({researchState.sources.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {researchState.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 transition-all hover:border-zinc-600 truncate max-w-[200px]"
                title={source.title}
              >
                <LinkIcon className="w-3 h-3 shrink-0 text-blue-400" />
                <span className="truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};