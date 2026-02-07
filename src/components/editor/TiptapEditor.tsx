'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { EditorToolbar } from './EditorToolbar';

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  onSave?: () => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

// Convert markdown to HTML for Tiptap consumption
// Handles legacy markdown content stored before Tiptap was introduced
const markdownToHtml = (md: string): string => {
  if (!md) return '';

  // If content already looks like HTML, return as-is
  if (md.trimStart().startsWith('<')) return md;

  return md
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
  editable = true,
  placeholder = 'Start writing...',
  className = '',
  compact = false,
}) => {
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

  return (
    <div
      className={`flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white ${className}`}
    >
      {editable && <EditorToolbar editor={editor} />}
      <div className={`${compact ? 'p-3' : 'px-6 py-4'} overflow-auto`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
