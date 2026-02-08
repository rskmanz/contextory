'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { EditorToolbar } from './EditorToolbar';

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  onSave?: () => void;
  onExtract?: () => void;
  onToggleSmartPanel?: () => void;
  isSmartPanelOpen?: boolean;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  minimal?: boolean;
}

// Convert markdown to HTML for Tiptap consumption
// Handles legacy markdown content stored before Tiptap was introduced
const markdownToHtml = (md: string): string => {
  if (!md) return '';

  // If content already looks like HTML, check for embedded pipe-tables in <p> tags
  if (md.trimStart().startsWith('<')) {
    return md.replace(
      /(<p>\|[^<]+\|<\/p>\s*\n?\s*<p>\|[\s:|-]+\|<\/p>(?:\s*\n?\s*<p>\|[^<]+\|<\/p>)*)/g,
      (tableBlock) => {
        const rows = tableBlock.match(/<p>(\|[^<]+\|)<\/p>/g);
        if (!rows || rows.length < 2) return tableBlock;
        const parseRow = (html: string) =>
          html.replace(/<\/?p>/g, '').split('|').filter(c => c.trim() !== '').map(c => c.trim());
        const headerCells = parseRow(rows[0]);
        let html = '<table><thead><tr>';
        for (const cell of headerCells) html += `<th>${cell}</th>`;
        html += '</tr></thead><tbody>';
        for (let i = 2; i < rows.length; i++) {
          const cells = parseRow(rows[i]);
          html += '<tr>';
          for (const cell of cells) html += `<td>${cell}</td>`;
          html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
      }
    );
  }

  // Convert markdown tables to HTML tables
  const lines = md.split('\n');
  const processedLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    // Detect table: line with pipes, next line is separator (|---|)
    if (
      lines[i]?.includes('|') &&
      lines[i + 1]?.match(/^\|?\s*[-:]+[-|:\s]+\|?\s*$/)
    ) {
      const headerCells = lines[i].split('|').filter((c) => c.trim() !== '');
      let tableHtml = '<table><thead><tr>';
      for (const cell of headerCells) {
        tableHtml += `<th>${cell.trim()}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      i += 2; // skip header + separator
      while (i < lines.length && lines[i]?.includes('|') && lines[i].trim() !== '') {
        const cells = lines[i].split('|').filter((c) => c.trim() !== '');
        tableHtml += '<tr>';
        for (const cell of cells) {
          tableHtml += `<td>${cell.trim()}</td>`;
        }
        tableHtml += '</tr>';
        i++;
      }
      tableHtml += '</tbody></table>';
      processedLines.push(tableHtml);
      continue;
    }
    processedLines.push(lines[i]);
    i++;
  }
  const processed = processedLines.join('\n');

  return processed
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(
      /^- \[x\] (.+)$/gm,
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">$1</li></ul>'
    )
    .replace(
      /^- \[ \] (.+)$/gm,
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">$1</li></ul>'
    )
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li data-ordered="true">$1</li>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/^---$/gm, '<hr />')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[^\n]*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/(<li data-ordered="true">[^\n]*<\/li>\n?)+/g, (match) =>
      '<ol>' + match.replace(/ data-ordered="true"/g, '') + '</ol>'
    )
    // Merge adjacent taskLists
    .replace(/<\/ul>\s*<ul data-type="taskList">/g, '')
    // Wrap remaining bare lines as paragraphs
    .replace(/^(?!<[houpbl]|<li|<hr|<code|<pre|<mark|<a |\s*$)(.+)$/gm, '<p>$1</p>');
};

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  onBlur,
  onSave,
  onExtract,
  onToggleSmartPanel,
  isSmartPanelOpen,
  editable = true,
  placeholder = 'Start writing...',
  className = '',
  compact = false,
  minimal = false,
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        autolink: true,
        openOnClick: !editable,
        HTMLAttributes: {
          class:
            'text-blue-600 underline decoration-blue-300 hover:decoration-blue-500 cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: markdownToHtml(content),
    editable,
    editorProps: {
      attributes: {
        class: `tiptap-content outline-none ${
          compact ? 'min-h-[100px]' : 'min-h-[60vh]'
        }`,
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault();
          onSave?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    onBlur: ({ editor: e }) => {
      onBlur?.(e.getHTML());
    },
  });

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Update content when prop changes externally (e.g. loading from API)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      const incomingHtml = markdownToHtml(content);
      if (currentHtml !== incomingHtml) {
        editor.commands.setContent(incomingHtml);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

  if (minimal) {
    return (
      <div className={`flex flex-col bg-white ${className}`}>
        {/* Toolbar toggle + Extract button (always visible) */}
        {editable && (
          <div className="flex items-center justify-end gap-1.5 mb-1">
            {onExtract && (
              <button
                onClick={onExtract}
                title="Smart Extract"
                className="px-2 h-6 rounded-md flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Extract
              </button>
            )}
            <button
              onClick={() => setShowToolbar((v) => !v)}
              className={`p-1 rounded text-xs transition-colors ${
                showToolbar
                  ? 'text-zinc-600 bg-zinc-100'
                  : 'text-zinc-300 hover:text-zinc-500'
              }`}
              title={showToolbar ? 'Hide toolbar' : 'Show toolbar'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
          </div>
        )}
        {editable && showToolbar && <EditorToolbar editor={editor} onExtract={onExtract} onToggleSmartPanel={onToggleSmartPanel} isSmartPanelOpen={isSmartPanelOpen} />}
        <div className="overflow-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white ${className}`}
    >
      {editable && <EditorToolbar editor={editor} onExtract={onExtract} onToggleSmartPanel={onToggleSmartPanel} isSmartPanelOpen={isSmartPanelOpen} />}
      <div className={`${compact ? 'p-3' : 'px-6 py-4'} overflow-auto`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
