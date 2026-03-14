'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl+K', description: 'Open command palette' },
  { key: 'Ctrl+B', description: 'Toggle sidebar' },
  { key: 'Ctrl+.', description: 'Toggle right panel' },
  { key: 'Ctrl+T', description: 'Toggle theme' },
  { key: 'Ctrl+1', description: 'Go to Overview' },
  { key: 'Ctrl+2', description: 'Go to Chat' },
  { key: 'Ctrl+3', description: 'Go to Board' },
  { key: 'Ctrl+4', description: 'Go to Memory' },
  { key: 'Ctrl+5', description: 'Go to Files' },
  { key: 'Esc', description: 'Close dialogs' },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-lg font-semibold">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-surface2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
                >
                  <span className="text-sm text-text-muted">{shortcut.description}</span>
                  <kbd className="rounded bg-surface2 px-2 py-1 text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-text-muted">
              Press <kbd className="rounded bg-surface2 px-1">Ctrl+K</kbd> anywhere to open command palette
            </p>
          </div>
        </div>
      )}
    </>
  );
}
