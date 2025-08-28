import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => {
        const matchesKey = s.key.toLowerCase() === event.key.toLowerCase();
        const matchesCtrl = !s.ctrl || event.ctrlKey;
        const matchesShift = !s.shift || event.shiftKey;
        const matchesAlt = !s.alt || event.altKey;
        
        return matchesKey && matchesCtrl && matchesShift && matchesAlt &&
               (s.ctrl ? event.ctrlKey : !event.ctrlKey) &&
               (s.shift ? event.shiftKey : !event.shiftKey) &&
               (s.alt ? event.altKey : !event.altKey);
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  NEW_PROJECT: { key: 'n', ctrl: true, description: 'Create new project' },
  NEW_EXPENSE: { key: 'e', ctrl: true, description: 'Add new expense' },
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  SAVE: { key: 's', ctrl: true, description: 'Save current form' },
  ESCAPE: { key: 'Escape', description: 'Close modal/cancel' },
  DASHBOARD: { key: 'd', ctrl: true, shift: true, description: 'Go to dashboard' },
  PROJECTS: { key: 'p', ctrl: true, shift: true, description: 'Go to projects' },
};