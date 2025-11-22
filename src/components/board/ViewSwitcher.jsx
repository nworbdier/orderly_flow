"use client";

import { Table, Calendar, User, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { id: "main", label: "Main Table", icon: Table },
  { id: "daily-brief", label: "Daily Brief", icon: User },
  { id: "kanban", label: "Kanban", icon: LayoutGrid, disabled: true },
  { id: "calendar", label: "Calendar", icon: Calendar, disabled: true },
];

export function ViewSwitcher({ currentView, onViewChange }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-2 bg-white">
      <span className="text-sm text-gray-600 font-medium mr-2">View:</span>
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <Button
            key={view.id}
            onClick={() => !view.disabled && onViewChange(view.id)}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            disabled={view.disabled}
            className={`
              flex items-center gap-2
              ${isActive ? "bg-primary text-primary-foreground" : ""}
              ${view.disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <Icon className="h-4 w-4" />
            {view.label}
          </Button>
        );
      })}
    </div>
  );
}

