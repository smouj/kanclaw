'use client';

import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    // Simple markdown to HTML conversion
    let text = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 overflow-x-auto my-3"><code class="text-sm">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-white/5 px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-400 hover:underline" target="_blank" rel="noopener">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-3" />')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-2 border-emerald-500/50 pl-4 my-3 text-zinc-400 italic">$1</blockquote>')
      // Unordered lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-white/10 my-6" />')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="my-3">')
      // Line breaks
      .replace(/\n/g, '<br />');

    return `<p class="my-3">${text}</p>`;
  }, [content]);

  return (
    <div 
      className={`prose prose-invert max-w-none text-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
