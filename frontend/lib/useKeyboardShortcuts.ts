'use client';

import { useEffect, useCallback } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          // If we're in an input, only allow global shortcuts (no ctrl/meta)
          if (isInput && (shortcut.ctrl || shortcut.meta)) {
            continue;
          }
          
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts factory
export function createShortcuts(handlers: {
  onToggleSidebar?: () => void;
  onTogglePanel?: () => void;
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onNewChat?: () => void;
  onToggleTheme?: () => void;
  onGoToOverview?: () => void;
  onGoToChat?: () => void;
  onGoToBoard?: () => void;
  onGoToMemory?: () => void;
  onGoToFiles?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onCommandPalette) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      handler: handlers.onCommandPalette,
      description: 'Open command palette',
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      handler: handlers.onToggleSidebar,
      description: 'Toggle sidebar',
    });
  }

  if (handlers.onTogglePanel) {
    shortcuts.push({
      key: '.',
      ctrl: true,
      handler: handlers.onTogglePanel,
      description: 'Toggle right panel',
    });
  }

  if (handlers.onToggleTheme) {
    shortcuts.push({
      key: 't',
      ctrl: true,
      handler: handlers.onToggleTheme,
      description: 'Toggle theme',
    });
  }

  if (handlers.onGoToOverview) {
    shortcuts.push({
      key: '1',
      ctrl: true,
      handler: handlers.onGoToOverview,
      description: 'Go to Overview',
    });
  }

  if (handlers.onGoToChat) {
    shortcuts.push({
      key: '2',
      ctrl: true,
      handler: handlers.onGoToChat,
      description: 'Go to Chat',
    });
  }

  if (handlers.onGoToBoard) {
    shortcuts.push({
      key: '3',
      ctrl: true,
      handler: handlers.onGoToBoard,
      description: 'Go to Board',
    });
  }

  if (handlers.onGoToMemory) {
    shortcuts.push({
      key: '4',
      ctrl: true,
      handler: handlers.onGoToMemory,
      description: 'Go to Memory',
    });
  }

  if (handlers.onGoToFiles) {
    shortcuts.push({
      key: '5',
      ctrl: true,
      handler: handlers.onGoToFiles,
      description: 'Go to Files',
    });
  }

  return shortcuts;
}
