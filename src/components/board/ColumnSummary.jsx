"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { STATUS_OPTIONS } from "@/lib/board-data";
import { cn } from "@/lib/utils";

export function ColumnSummary({ column, items }) {
  const summary = useMemo(() => {
    if (!items || items.length === 0) return null;

    const values = items
      .map((item) => item.columns?.[column.id]?.value)
      .filter((v) => v !== undefined && v !== null && v !== "");

    switch (column.type) {
      case "status":
        // Count by status
        const statusCounts = {};
        values.forEach((val) => {
          statusCounts[val] = (statusCounts[val] || 0) + 1;
        });
        return { type: "status", counts: statusCounts, total: items.length };

      case "person":
        // Count unique people
        const peopleSet = new Set();
        values.forEach((val) => {
          if (Array.isArray(val)) {
            val.forEach((p) => {
              if (p?.name) peopleSet.add(p.name);
            });
          }
        });
        return { type: "person", count: peopleSet.size };

      case "date":
        // Count items with dates
        const withDates = values.filter((v) => v).length;
        return { type: "date", withDates, total: items.length };

      case "time_tracker":
        // Sum total time
        let totalSeconds = 0;
        values.forEach((val) => {
          if (val && typeof val === "object") {
            totalSeconds += val.totalSeconds || 0;
          }
        });
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return { type: "time", hours, minutes, totalSeconds };

      case "files":
        // Count total files
        let fileCount = 0;
        values.forEach((val) => {
          if (Array.isArray(val)) {
            fileCount += val.length;
          }
        });
        return { type: "files", count: fileCount };

      case "text":
      case "link":
        // Count filled
        return { type: "text", filled: values.length, total: items.length };

      default:
        return { type: "count", count: values.length };
    }
  }, [column, items]);

  if (!summary) return null;

  const renderSummary = () => {
    switch (summary.type) {
      case "status":
        // Show mini status distribution bar
        const totalItems = summary.total;
        if (totalItems === 0) return null;
        
        return (
          <div className="flex items-center gap-1 w-full">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
              {STATUS_OPTIONS.filter((s) => summary.counts[s.id]).map((status) => {
                const count = summary.counts[status.id] || 0;
                const percentage = (count / totalItems) * 100;
                return (
                  <div
                    key={status.id}
                    className={cn("h-full", status.color)}
                    style={{ width: `${percentage}%` }}
                    title={`${status.label}: ${count}`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-muted-foreground ml-1">
              {Object.values(summary.counts).reduce((a, b) => a + b, 0)}/{totalItems}
            </span>
          </div>
        );

      case "person":
        return (
          <span className="text-[10px] text-muted-foreground">
            {summary.count} {summary.count === 1 ? "person" : "people"}
          </span>
        );

      case "date":
        return (
          <span className="text-[10px] text-muted-foreground">
            {summary.withDates}/{summary.total} dated
          </span>
        );

      case "time":
        return (
          <span className="text-[10px] text-muted-foreground font-mono">
            Σ {summary.hours}h {summary.minutes}m
          </span>
        );

      case "files":
        return (
          <span className="text-[10px] text-muted-foreground">
            {summary.count} {summary.count === 1 ? "file" : "files"}
          </span>
        );

      case "text":
        return (
          <span className="text-[10px] text-muted-foreground">
            {summary.filled}/{summary.total} filled
          </span>
        );

      default:
        return (
          <span className="text-[10px] text-muted-foreground">
            {summary.count} items
          </span>
        );
    }
  };

  return (
    <div className="px-2 py-1 flex items-center justify-center">
      {renderSummary()}
    </div>
  );
}

// Group summary row component
export function GroupSummaryRow({ group, columns, hiddenColumns = [] }) {
  const allItems = useMemo(() => {
    const items = [...(group.items || [])];
    // Include subitems in the count
    group.items?.forEach((item) => {
      if (item.subitems) {
        items.push(...item.subitems);
      }
    });
    return items;
  }, [group]);

  const visibleColumns = columns.filter((col) => !hiddenColumns.includes(col.id));

  return (
    <div
      className="bg-muted/30 border-t border-border"
      style={{
        display: "grid",
        gridTemplateColumns: `200px repeat(${visibleColumns.length}, minmax(150px, 1fr)) 100px`,
      }}
    >
      {/* Item count cell */}
      <div className="sticky left-0 z-10 bg-muted/30 border-r border-border px-4 py-2">
        <span className="text-xs text-muted-foreground font-medium">
          {group.items?.length || 0} items
        </span>
      </div>

      {/* Column summaries */}
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className="border-r border-border flex items-center justify-center"
        >
          <ColumnSummary column={column} items={allItems} />
        </div>
      ))}

      {/* Empty cell for add column */}
      <div className="bg-muted/30" />
    </div>
  );
}

