'use client';

import React, { useState, useCallback } from 'react';
import { ChatMarkdown } from './ChatMarkdown';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessageProps {
  message: ChatMsg;
  compact?: boolean;
  onExtract?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, compact, onExtract }) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API may fail
    }
  }, [message.content]);

  if (message.role === 'user') {
    return (
      <div className={`flex justify-end ${compact ? 'ml-8' : 'ml-16'}`}>
        <div className="bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${compact ? 'mr-4' : 'mr-8'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* AI Avatar */}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white border border-zinc-100 text-zinc-700 text-sm p-3 rounded-2xl rounded-tl-md shadow-sm">
          <ChatMarkdown content={message.content} />
        </div>

        {/* Actions (hover) */}
        <div className={`flex items-center gap-1 mt-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleCopy}
            className="text-[10px] text-zinc-400 hover:text-zinc-600 px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors"
            title="Copy"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onExtract && message.content.length > 50 && (
            <button
              onClick={() => onExtract(message.content)}
              className="text-[10px] text-violet-400 hover:text-violet-600 px-1.5 py-0.5 rounded hover:bg-violet-50 transition-colors"
              title="Extract data from this response"
            >
              Extract
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
