'use client';

import React from 'react';
import { ChatMessage as ChatMessageType, ContextNode } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onApplyNodes?: (nodes: ContextNode[]) => void;
}

export function ChatMessage({ message, onApplyNodes }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-zinc-900 text-white'
            : 'bg-zinc-100 text-zinc-900'
        }`}
      >
        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Suggested nodes action */}
        {message.suggestedNodes && message.suggestedNodes.length > 0 && onApplyNodes && (
          <div className="mt-2 pt-2 border-t border-zinc-200">
            <button
              onClick={() => onApplyNodes(message.suggestedNodes!)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Apply to Context ({message.suggestedNodes.length} nodes)
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
