"use client";

import { useState, useEffect, useRef } from "react";
import { Table, Calendar, User, LayoutGrid, Bell, Sparkles, Search, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/components/auth/user-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VIEWS = [
  { id: "main", label: "Main Table", icon: Table },
  { id: "daily-brief", label: "Daily Brief", icon: User },
  { id: "kanban", label: "Kanban", icon: LayoutGrid, disabled: true },
  { id: "calendar", label: "Calendar", icon: Calendar, disabled: true },
];

// Mock notifications data - in production, fetch from API
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "mention",
    title: "You were mentioned",
    message: "Sarah mentioned you in Q4 Planning",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "update",
    title: "Item updated",
    message: "Status changed to 'In Progress' on Marketing Campaign",
    time: "15 min ago",
    read: false,
  },
  {
    id: 3,
    type: "due",
    title: "Due date approaching",
    message: "Website Redesign is due tomorrow",
    time: "1 hour ago",
    read: true,
  },
];

function NotificationsPopover() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-accent"
            >
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-primary hover:text-primary"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors",
                  !notification.read && "bg-blue-50/50"
                )}
              >
                <div
                  className={cn(
                    "mt-1 h-2 w-2 rounded-full shrink-0",
                    notification.read ? "bg-transparent" : "bg-blue-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AIAssistantDialog({ open, onOpenChange }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you with tasks like:\n\n• Finding items across your boards\n• Summarizing project status\n• Suggesting next actions\n• Answering questions about your data\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response - in production, call your AI API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I understand you're asking about "${userMessage}". This is a demo response. In production, this would connect to your AI backend to provide intelligent responses about your board data, help with task management, and more.`,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">AI Assistant</DialogTitle>
              <DialogDescription className="text-xs">
                Ask me anything about your boards and tasks
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm whitespace-pre-wrap",
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Press Enter to send • AI responses are for demo purposes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchDialog({ open, onOpenChange, onSearch }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const handleSearch = (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate search - in production, call your search API
    setTimeout(() => {
      setResults([
        { type: "item", title: `Results for "${value}"`, subtitle: "Marketing > Q4 Campaign", id: "1" },
        { type: "item", title: "Website Redesign", subtitle: "Development > Sprint 3", id: "2" },
        { type: "group", title: "Q4 Planning", subtitle: "Marketing Board", id: "3" },
      ]);
      setIsSearching(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items, groups, boards..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Start typing to search across all your boards
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Search for items, groups, people, and more
              </p>
            </div>
          )}
          
          {query && isSearching && (
            <div className="px-4 py-8 text-center">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}
          
          {query && !isSearching && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Results
                </p>
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  onClick={() => {
                    onOpenChange(false);
                    // Handle navigation to result
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {result.type === "item" ? (
                      <Table className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t px-4 py-2 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[10px]">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[10px]">esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ViewSwitcher({ currentView, onViewChange }) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-2 bg-background">
        {/* Left side - View tabs */}
        <div className="flex items-center gap-1">
          {VIEWS.map((view) => {
            const Icon = view.icon;
            const isActive = currentView === view.id;

            return (
              <Button
                key={view.id}
                onClick={() => !view.disabled && onViewChange(view.id)}
                variant="ghost"
                size="sm"
                disabled={view.disabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 h-8 rounded-md transition-all",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  !isActive && !view.disabled && "hover:bg-accent",
                  view.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{view.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Right side - Action icons */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <NotificationsPopover />

          {/* AI Assistant */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent"
                onClick={() => setAiDialogOpen(true)}
              >
                <Sparkles className="h-[18px] w-[18px] text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>AI Assistant</p>
            </TooltipContent>
          </Tooltip>

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent"
                onClick={() => setSearchDialogOpen(true)}
              >
                <Search className="h-[18px] w-[18px] text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Search</p>
              <kbd className="ml-1 pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-2" />

          {/* Profile */}
          <UserButton />
        </div>
      </div>

      {/* AI Dialog */}
      <AIAssistantDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />

      {/* Search Dialog */}
      <SearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
    </>
  );
}
