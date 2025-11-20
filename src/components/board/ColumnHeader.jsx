"use client";

import { useState } from "react";
import { ChevronDown, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLUMN_TYPES } from "@/lib/board-data";

export function ColumnHeader({
  column,
  board,
  setBoard,
  isEditing,
  onEdit,
  onEditEnd,
  onDelete,
}) {
  const [columnTitle, setColumnTitle] = useState(column.title);

  const handleTitleBlur = () => {
    onEditEnd();
    setBoard({
      ...board,
      columns: board.columns.map((col) =>
        col.id === column.id ? { ...col, title: columnTitle } : col
      ),
    });
  };

  const handleTypeChange = (newType) => {
    // Get default value based on column type
    const getDefaultValue = (type) => {
      switch (type) {
        case COLUMN_TYPES.FILES:
          return [];
        case COLUMN_TYPES.PERSON:
          return [];
        case COLUMN_TYPES.TIME_TRACKER:
          return { totalSeconds: 0, isRunning: false, startTime: null };
        default:
          return "";
      }
    };

    setBoard({
      ...board,
      columns: board.columns.map((col) =>
        col.id === column.id ? { ...col, type: newType } : col
      ),
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          columns: {
            ...item.columns,
            [column.id]: {
              type: newType,
              value: item.columns[column.id]?.value || getDefaultValue(newType),
            },
          },
          subitems: item.subitems?.map((subitem) => ({
            ...subitem,
            columns: {
              ...subitem.columns,
              [column.id]: {
                type: newType,
                value:
                  subitem.columns?.[column.id]?.value ||
                  getDefaultValue(newType),
              },
            },
          })),
        })),
      })),
    });
  };

  const handleResizeMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const th = event.currentTarget.closest("th");
    if (!th) return;

    const startX = event.clientX;
    const startWidth = column.width || th.getBoundingClientRect().width || 150;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(120, startWidth + deltaX);

      setBoard({
        ...board,
        columns: board.columns.map((col) =>
          col.id === column.id ? { ...col, width: newWidth } : col
        ),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
  };

  return (
    <th
      className="relative bg-white border-r border-gray-200 px-4 py-3 text-center min-w-[150px] select-none"
      style={column.width ? { width: column.width } : undefined}
    >
      <div className="flex items-center justify-center gap-2">
        {isEditing ? (
          <Input
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTitleBlur();
              }
            }}
            className="h-8 font-semibold text-center"
            autoFocus
          />
        ) : (
          <button
            onClick={onEdit}
            className="flex-1 text-center font-semibold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
          >
            {column.title}
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Column Type
              </p>
              <Select value={column.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={COLUMN_TYPES.TEXT}>Text</SelectItem>
                  <SelectItem value={COLUMN_TYPES.PERSON}>Person</SelectItem>
                  <SelectItem value={COLUMN_TYPES.STATUS}>Status</SelectItem>
                  <SelectItem value={COLUMN_TYPES.DATE}>Date</SelectItem>
                  <SelectItem value={COLUMN_TYPES.FILES}>Files</SelectItem>
                  <SelectItem value={COLUMN_TYPES.LINK}>Link</SelectItem>
                  <SelectItem value={COLUMN_TYPES.TIME_TRACKER}>
                    Time Tracker
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Column Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(column.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-gray-200"
      />
    </th>
  );
}
