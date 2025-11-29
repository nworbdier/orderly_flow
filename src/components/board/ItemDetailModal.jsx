"use client";

import { useState } from "react";
import {
  X,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Link2,
  FileText,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { STATUS_OPTIONS } from "@/lib/board-data";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function ItemDetailModal({
  open,
  onOpenChange,
  item,
  group,
  columns,
  onUpdateItem,
  onUpdateColumn,
  onOpenUpdates,
}) {
  const [itemName, setItemName] = useState(item?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  if (!item) return null;

  const handleNameSave = () => {
    setIsEditingName(false);
    if (itemName !== item.name && itemName.trim()) {
      onUpdateItem?.(group.id, item.id, "name", itemName);
    }
  };

  const getColumnIcon = (type) => {
    switch (type) {
      case "date":
        return Calendar;
      case "person":
        return User;
      case "link":
        return Link2;
      case "time_tracker":
        return Clock;
      case "updates":
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const renderColumnValue = (column) => {
    const columnData = item.columns?.[column.id];
    const value = columnData?.value;

    switch (column.type) {
      case "status":
        const status = STATUS_OPTIONS.find((s) => s.id === value) || STATUS_OPTIONS[0];
        return (
          <Badge className={cn("text-black border-0", status.color)}>
            {status.label || "No Status"}
          </Badge>
        );

      case "date":
        if (!value) return <span className="text-muted-foreground">No date</span>;
        try {
          return format(parseISO(value), "MMM d, yyyy");
        } catch {
          return value;
        }

      case "person":
        const people = Array.isArray(value) ? value : [];
        if (people.length === 0) {
          return <span className="text-muted-foreground">No one assigned</span>;
        }
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {people.map((person, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className={`${person.color || "bg-blue-500"} text-white text-[10px]`}
                  >
                    {getInitials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{person.name}</span>
              </div>
            ))}
          </div>
        );

      case "time_tracker":
        if (!value || typeof value !== "object") {
          return <span className="text-muted-foreground">00:00:00</span>;
        }
        const seconds = value.totalSeconds || 0;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return (
          <span className="font-mono">
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(secs).padStart(2, "0")}
          </span>
        );

      case "link":
        if (!value) return <span className="text-muted-foreground">No link</span>;
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate block max-w-[200px]"
          >
            {value}
          </a>
        );

      case "files":
        const files = Array.isArray(value) ? value : [];
        if (files.length === 0) {
          return <span className="text-muted-foreground">No files</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {files.map((file, idx) => (
              <Badge key={idx} variant="secondary">
                {file.name || file}
              </Badge>
            ))}
          </div>
        );

      case "updates":
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => {
              onOpenChange(false);
              onOpenUpdates?.(item, "item", group.id, false, null);
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            View Updates
          </Button>
        );

      default:
        return value || <span className="text-muted-foreground">Empty</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{group?.title}</span>
            <ChevronRight className="h-3 w-3" />
            <span>Item</span>
          </div>
          {isEditingName ? (
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
                if (e.key === "Escape") {
                  setItemName(item.name);
                  setIsEditingName(false);
                }
              }}
              className="text-xl font-bold h-10"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xl font-bold hover:bg-accent px-2 py-1 -ml-2 rounded-md transition-colors text-left w-full"
            >
              {item.name}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Column Values */}
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="space-y-3">
              {columns.map((column) => {
                const Icon = getColumnIcon(column.type);
                return (
                  <div
                    key={column.id}
                    className="flex items-start gap-4 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-[120px] text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{column.title}</span>
                    </div>
                    <div className="flex-1">{renderColumnValue(column)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subitems */}
          {item.subitems && item.subitems.length > 0 && (
            <div className="px-6 pb-6">
              <Separator className="mb-4" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Subitems ({item.subitems.length})
              </h3>
              <div className="space-y-2">
                {item.subitems.map((subitem) => {
                  const statusCol = columns.find((c) => c.type === "status");
                  const status = statusCol
                    ? STATUS_OPTIONS.find(
                        (s) => s.id === subitem.columns?.[statusCol.id]?.value
                      )
                    : null;
                  return (
                    <div
                      key={subitem.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-muted-foreground">└</span>
                      <span className="flex-1 text-sm">{subitem.name}</span>
                      {status && (
                        <Badge
                          className={cn(
                            "text-black border-0 text-xs",
                            status.color
                          )}
                        >
                          {status.label}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity placeholder */}
          <div className="px-6 pb-6">
            <Separator className="mb-4" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Activity log coming soon...</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {item.subitems?.length || 0} subitems
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenUpdates?.(item, "item", group.id, false, null);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Updates
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

