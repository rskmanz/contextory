'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface CollapsibleSidebarProps {
  side: 'left' | 'right';
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  pinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  label?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  side,
  defaultWidth,
  minWidth = 240,
  maxWidth = 600,
  resizable = false,
  pinned,
  onPinnedChange,
  label,
  icon,
  children,
}) => {
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync width when defaultWidth prop changes (e.g. inner panel toggle)
  useEffect(() => {
    if (!isResizing) setWidth(defaultWidth);
  }, [defaultWidth, isResizing]);

  const showPanel = pinned || hovered;

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isResizing) return;
    hideTimeoutRef.current = setTimeout(() => setHovered(false), 300);
  }, [isResizing]);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = side === 'right'
        ? window.innerWidth - e.clientX
        : e.clientX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, side, minWidth, maxWidth]);

  // Pinned mode: render inline in flex layout
  if (pinned) {
    return (
      <div
        ref={panelRef}
        className="relative flex-shrink-0 flex flex-col h-full"
        style={{ width }}
      >
        {/* Pin/unpin button */}
        <button
          onClick={() => onPinnedChange(false)}
          className={`absolute top-2 ${side === 'left' ? 'right-1' : 'left-1'} z-20 w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors`}
          title="Unpin sidebar"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </button>

        {children}

        {/* Resize handle */}
        {resizable && (
          <div
            onMouseDown={handleResizeStart}
            className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 transition-colors z-30 ${
              side === 'left' ? 'right-0' : 'left-0'
            }`}
          />
        )}
      </div>
    );
  }

  // Unpinned mode: hover zone with visible tab + overlay
  return (
    <>
      {/* Visible sidebar tab */}
      <div
        onMouseEnter={handleMouseEnter}
        onClick={() => onPinnedChange(true)}
        className={`relative flex-shrink-0 w-8 bg-zinc-50 hover:bg-zinc-100 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors ${
          side === 'left' ? 'border-r border-zinc-200' : 'border-l border-zinc-200'
        }`}
      >
        {icon && <div className="text-zinc-400">{icon}</div>}
        {label && (
          <span
            className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Overlay panel */}
      {showPanel && (
        <div
          ref={panelRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`fixed top-0 bottom-0 z-40 bg-white shadow-2xl flex flex-col border-zinc-200 ${
            side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
          }`}
          style={{
            width,
            animation: `slideIn${side === 'left' ? 'Left' : 'Right'} 150ms ease-out`,
          }}
        >
          {/* Pin button */}
          <button
            onClick={() => onPinnedChange(true)}
            className={`absolute top-2 ${side === 'left' ? 'right-1' : 'left-1'} z-20 w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors`}
            title="Pin sidebar"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          </button>

          {children}

          {/* Resize handle */}
          {resizable && (
            <div
              onMouseDown={handleResizeStart}
              className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 ${
                side === 'left' ? 'right-0' : 'left-0'
              }`}
            />
          )}
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
