'use client';

import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  label: string;
  icon: string;
  action: () => void;
  isActive: () => boolean;
}

type ToolbarDivider = { divider: true };
type ToolbarItem = ToolbarButton | ToolbarDivider;

const isDivider = (item: ToolbarItem): item is ToolbarDivider =>
  'divider' in item;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const items: ToolbarItem[] = [
    // Inline formatting
    {
      label: 'Bold',
      icon: 'B',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: 'I',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      label: 'Strikethrough',
      icon: 'S',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      label: 'Code',
      icon: '</>',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    },
    {
      label: 'Link',
      icon: '\u{1F517}',
      action: setLink,
      isActive: () => editor.isActive('link'),
    },
    {
      label: 'Highlight',
      icon: '\u{1F7E1}',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
    },
    { divider: true },
    // Headings
    {
      label: 'Heading 1',
      icon: 'H1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'Heading 2',
      icon: 'H2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'Heading 3',
      icon: 'H3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    { divider: true },
    // Lists and blocks
    {
      label: 'Bullet List',
      icon: '\u2022',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      label: 'Ordered List',
      icon: '1.',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      label: 'Task List',
      icon: '\u2611',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList'),
    },
    {
      label: 'Blockquote',
      icon: '\u201C',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      label: 'Code Block',
      icon: '{;}',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock'),
    },
  ];

  return (
    <div className="bg-zinc-50 border-b border-zinc-200 rounded-t-lg p-1 flex gap-0.5 flex-wrap">
      {items.map((item, idx) => {
        if (isDivider(item)) {
          return (
            <div
              key={`divider-${idx}`}
              className="w-px h-6 bg-zinc-200 mx-1 self-center"
            />
          );
        }
        return (
          <button
            key={item.label}
            onClick={item.action}
            title={item.label}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
              item.isActive()
                ? 'bg-zinc-200 text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
            }`}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
};
