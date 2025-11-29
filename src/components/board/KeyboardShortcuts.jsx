"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SHORTCUTS = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open search" },
      { keys: ["⌘", "\\"], description: "Toggle sidebar" },
      { keys: ["↑", "↓"], description: "Navigate items" },
      { keys: ["Enter"], description: "Edit selected item" },
      { keys: ["Escape"], description: "Cancel/Close" },
    ],
  },
  {
    category: "Items",
    shortcuts: [
      { keys: ["⌘", "N"], description: "New item" },
      { keys: ["⌘", "D"], description: "Duplicate item" },
      { keys: ["Delete"], description: "Delete selected" },
      { keys: ["⌘", "A"], description: "Select all items" },
    ],
  },
  {
    category: "View",
    shortcuts: [
      { keys: ["⌘", "E"], description: "Expand/Collapse all" },
      { keys: ["⌘", "/"], description: "Show shortcuts" },
      { keys: ["⌘", "F"], description: "Focus search" },
    ],
  },
  {
    category: "Board",
    shortcuts: [
      { keys: ["⌘", "S"], description: "Save changes" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
    ],
  },
];

export function KeyboardShortcuts({ onShortcut }) {
  const [open, setOpen] = useState(false);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Show shortcuts dialog: Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Pass other shortcuts to parent
      if (onShortcut) {
        // New item: Cmd/Ctrl + N
        if ((e.metaKey || e.ctrlKey) && e.key === "n") {
          e.preventDefault();
          onShortcut("newItem");
          return;
        }

        // Expand/Collapse all: Cmd/Ctrl + E
        if ((e.metaKey || e.ctrlKey) && e.key === "e") {
          e.preventDefault();
          onShortcut("toggleExpandAll");
          return;
        }

        // Select all: Cmd/Ctrl + A (only when not in input)
        if (
          (e.metaKey || e.ctrlKey) &&
          e.key === "a" &&
          !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
        ) {
          e.preventDefault();
          onShortcut("selectAll");
          return;
        }

        // Delete selected: Delete/Backspace
        if (
          (e.key === "Delete" || e.key === "Backspace") &&
          !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
        ) {
          e.preventDefault();
          onShortcut("deleteSelected");
          return;
        }

        // Focus search: Cmd/Ctrl + F
        if ((e.metaKey || e.ctrlKey) && e.key === "f") {
          e.preventDefault();
          onShortcut("focusSearch");
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onShortcut]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Keyboard shortcuts</p>
          <kbd className="ml-1 pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>/
          </kbd>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster with your board
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">⌘/</kbd> to toggle this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}

