import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownViewProps {
  content: string;
}

// Note: In a real production environment, we would use plugins like remark-gfm 
// and custom components for syntax highlighting.
// For this constrained environment, we use standard react-markdown with default styling
// configured in index.html CSS.

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <div className="markdown-body font-sans text-zinc-300 leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};