'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMarkdownProps {
  content: string;
}

export const ChatMarkdown: React.FC<ChatMarkdownProps> = memo(({ content }) => {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

        h1: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-semibold text-xs mb-1">{children}</p>,

        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,

        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-') || false;
          if (isBlock) {
            return (
              <code className={`block text-xs ${className || ''}`} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },

        pre: ({ children }) => (
          <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-3 overflow-x-auto text-xs my-2 font-mono">
            {children}
          </pre>
        ),

        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,

        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline decoration-blue-300 hover:decoration-blue-500"
          >
            {children}
          </a>
        ),

        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-300 pl-3 text-zinc-500 my-2">
            {children}
          </blockquote>
        ),

        hr: () => <hr className="border-zinc-200 my-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

ChatMarkdown.displayName = 'ChatMarkdown';
