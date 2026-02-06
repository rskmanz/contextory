'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface ContentBlock {
  type: 'bullet' | 'numbered' | 'quote' | 'code' | 'text';
  content: string;
}

interface Section {
  level: 'h2' | 'h3';
  title: string;
  content: ContentBlock[];
  children: Section[];
}

interface MarkdownViewProps {
  item: ObjectItem;
}

// Obsidian-style markdown to HTML converter (light theme)
const renderMarkdown = (md: string): string => {
  if (!md) return '';

  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-100 rounded-md p-4 my-4 overflow-x-auto"><code class="text-[13px] font-mono text-zinc-800 leading-relaxed">$2</code></pre>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-zinc-800 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-zinc-800 mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-zinc-900 mt-4 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Links - purple accent
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-violet-600 hover:text-violet-700 underline decoration-violet-300 hover:decoration-violet-500 transition-colors" target="_blank">$1</a>')
    // Task lists
    .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2 text-zinc-400 line-through"><span class="w-4 h-4 rounded border border-violet-500 bg-violet-500 flex items-center justify-center text-white text-[10px]">✓</span>$1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 text-zinc-700"><span class="w-4 h-4 rounded border-2 border-zinc-300"></span>$1</li>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="text-zinc-700">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="text-zinc-700 list-decimal">$1</li>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 rounded text-[13px] font-mono text-rose-600">$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-[3px] border-violet-400 pl-4 my-3 text-zinc-600 italic">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-zinc-200" />')
    // Highlights ==text==
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-200 text-zinc-900 px-0.5 rounded">$1</mark>')
    // Tags #tag
    .replace(/#(\w+)/g, '<span class="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[12px]">#$1</span>')
    // Paragraphs
    .replace(/^(?!<[hlopb]|<li|<hr|<code|<pre|<mark|<span)(.+)$/gm, '<p class="text-zinc-700 mb-3 leading-[1.8]">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="[^"]*"><\/p>/g, '')
    // Wrap lists
    .replace(/(<li class="text-zinc-700">.*?<\/li>\n?)+/g, '<ul class="list-disc pl-5 my-3 space-y-1">$&</ul>')
    .replace(/(<li class="text-zinc-700 list-decimal">.*?<\/li>\n?)+/g, '<ol class="list-decimal pl-5 my-3 space-y-1">$&</ol>')
    // Wrap task lists
    .replace(/(<li class="flex items-center.*?<\/li>\n?)+/g, '<ul class="my-3 space-y-2">$&</ul>');
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ item }) => {
  const updateItem = useStore((state) => state.updateItem);

  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  // Parse markdown into hierarchical sections
  const sections = useMemo((): Section[] => {
    if (!markdown) return [];

    const result: Section[] = [];
    const lines = markdown.split('\n');
    let currentH2: Section | null = null;
    let currentH3: Section | null = null;
    let inCodeBlock = false;
    let codeContent = '';

    const addContent = (block: ContentBlock) => {
      if (currentH3) {
        currentH3.content.push(block);
      } else if (currentH2) {
        currentH2.content.push(block);
      }
    };

    for (const line of lines) {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          addContent({ type: 'code', content: codeContent.trim() });
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Skip separators
      if (line.trim() === '---') continue;

      // H2 - Main section
      if (line.startsWith('## ')) {
        if (currentH3 && currentH2) {
          currentH2.children.push(currentH3);
          currentH3 = null;
        }
        if (currentH2) result.push(currentH2);
        currentH2 = { level: 'h2', title: line.slice(3).trim(), content: [], children: [] };
        continue;
      }

      // H3 - Sub section
      if (line.startsWith('### ')) {
        if (currentH3 && currentH2) {
          currentH2.children.push(currentH3);
        }
        currentH3 = { level: 'h3', title: line.slice(4).trim(), content: [], children: [] };
        continue;
      }

      // Skip H1 (title)
      if (line.startsWith('# ')) continue;

      // Bullet points
      if (line.match(/^[-*] /)) {
        addContent({ type: 'bullet', content: line.slice(2).trim() });
        continue;
      }

      // Numbered list
      if (line.match(/^\d+\. /)) {
        addContent({ type: 'numbered', content: line.replace(/^\d+\. /, '').trim() });
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        addContent({ type: 'quote', content: line.slice(2).trim() });
        continue;
      }

      // Regular text
      if (line.trim()) {
        addContent({ type: 'text', content: line.trim() });
      }
    }

    // Push remaining sections
    if (currentH3 && currentH2) {
      currentH2.children.push(currentH3);
    }
    if (currentH2) result.push(currentH2);

    return result;
  }, [markdown]);

  const toggleTopic = (index: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Load markdown when item changes
  useEffect(() => {
    if (item.markdownId) {
      setIsLoading(true);
      fetch(`/api/markdown?id=${item.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => {
          setMarkdown(data.content || '');
          setIsEditing(!data.content);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMarkdown('');
      setIsEditing(true);
    }
  }, [item.id, item.markdownId]);

  // Update word count
  useEffect(() => {
    const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [markdown]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const markdownId = item.markdownId || item.id;

      await fetch('/api/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: markdownId, type: 'items', content: markdown }),
      });

      if (!item.markdownId) {
        await updateItem(item.id, { markdownId });
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [item.id, item.markdownId, markdown, updateItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
      // Toggle edit mode with Ctrl+E
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditing(!isEditing);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSave]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <span className="text-zinc-300 animate-pulse font-serif">Loading...</span>
      </div>
    );
  }

  // Render content block
  const renderContent = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'bullet':
        return (
          <p key={idx} className="text-sm text-zinc-600 flex items-start gap-2">
            <span className="text-zinc-300">•</span>
            {block.content}
          </p>
        );
      case 'numbered':
        return (
          <p key={idx} className="text-sm text-zinc-600 flex items-start gap-2">
            <span className="text-zinc-400 text-xs w-4">{idx + 1}.</span>
            {block.content}
          </p>
        );
      case 'quote':
        return (
          <p key={idx} className="text-sm text-zinc-500 italic border-l-2 border-zinc-200 pl-3">
            {block.content}
          </p>
        );
      case 'code':
        return (
          <pre key={idx} className="text-xs bg-zinc-100 rounded p-2 overflow-x-auto">
            <code className="text-zinc-700">{block.content}</code>
          </pre>
        );
      default:
        return (
          <p key={idx} className="text-sm text-zinc-600">{block.content}</p>
        );
    }
  };

  return (
    <div className="flex-1 flex h-full bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl text-zinc-800 mb-1">{item.name}</h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{sections.length} sections</span>
              {isSaving && <span className="text-zinc-500">Saving...</span>}
              <div className="flex-1" />
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={"## Section 1\n- Point about section 1\n- Another point\n\n### Sub-section\n- Detail here\n\n## Section 2\n> Quote or note"}
              className="w-full min-h-[60vh] text-sm text-zinc-700 bg-transparent outline-none resize-none leading-relaxed placeholder:text-zinc-300 font-mono"
              autoFocus
            />
          ) : sections.length > 0 ? (
            <div className="space-y-1">
              {sections.map((section, index) => (
                <div key={index} className="border-b border-zinc-100 last:border-0">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleTopic(index)}
                    className="w-full flex items-center gap-2 py-3 text-left hover:bg-zinc-50 transition-colors -mx-2 px-2 rounded"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-zinc-400 transition-transform ${expandedTopics.has(index) ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span className="text-sm font-medium text-zinc-700">{section.title}</span>
                    <span className="text-xs text-zinc-400 ml-auto">
                      {section.content.length + section.children.reduce((a, c) => a + c.content.length, 0)}
                    </span>
                  </button>

                  {/* Expanded Content */}
                  {expandedTopics.has(index) && (
                    <div className="pl-5 pb-3 space-y-2">
                      {/* Section content */}
                      {section.content.map((block, bIdx) => renderContent(block, bIdx))}

                      {/* Sub-sections (h3) */}
                      {section.children.map((child, cIdx) => (
                        <div key={cIdx} className="mt-3">
                          <p className="text-xs font-medium text-zinc-500 mb-1">{child.title}</p>
                          <div className="pl-3 space-y-1 border-l border-zinc-100">
                            {child.content.map((block, bIdx) => renderContent(block, bIdx))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="text-zinc-300 cursor-text py-4 text-sm"
            >
              <p className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Add sections...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TOC Sidebar */}
      {!isEditing && sections.length > 0 && (
        <div className="w-48 border-l border-zinc-100 p-4 overflow-auto flex-shrink-0">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Contents</p>
          <div className="space-y-1">
            {sections.map((section, index) => (
              <div key={index}>
                <button
                  onClick={() => {
                    toggleTopic(index);
                    if (!expandedTopics.has(index)) {
                      setExpandedTopics(prev => new Set(prev).add(index));
                    }
                  }}
                  className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors truncate ${
                    expandedTopics.has(index)
                      ? 'text-zinc-700 bg-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {section.title}
                </button>
                {section.children.length > 0 && expandedTopics.has(index) && (
                  <div className="pl-3 mt-1 space-y-0.5">
                    {section.children.map((child, cIdx) => (
                      <p key={cIdx} className="text-[11px] text-zinc-400 truncate py-0.5">
                        {child.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
