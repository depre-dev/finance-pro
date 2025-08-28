import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Command, Zap } from 'lucide-react';

interface ShortcutItem {
  key: string;
  description: string;
  category: 'General' | 'Projects' | 'Navigation';
}

const shortcuts: ShortcutItem[] = [
  // General
  { key: 'Ctrl+K', description: 'Open search', category: 'General' },
  { key: 'Escape', description: 'Close modal/cancel action', category: 'General' },
  { key: 'Ctrl+S', description: 'Save current form', category: 'General' },
  
  // Projects
  { key: 'Ctrl+N', description: 'Create new project', category: 'Projects' },
  { key: 'Ctrl+E', description: 'Add new expense', category: 'Projects' },
  
  // Navigation
  { key: 'Ctrl+Shift+D', description: 'Go to dashboard', category: 'Navigation' },
  { key: 'Ctrl+Shift+P', description: 'Go to projects', category: 'Navigation' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const formatKey = (keyCombo: string) => {
    return keyCombo.split('+').map((key, index) => (
      <span key={index} className="inline-flex items-center">
        {index > 0 && <span className="mx-1 text-muted-foreground">+</span>}
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
          {key}
        </kbd>
      </span>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center">
                      {formatKey(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
              {category !== 'Navigation' && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center pt-4 text-xs text-muted-foreground">
          <Command className="mr-1 h-3 w-3" />
          Press <kbd className="px-1 py-0.5 mx-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">?</kbd> to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}