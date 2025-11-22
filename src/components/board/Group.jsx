"use client";

import { useState } from "react";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item } from "./Item";
import { useUpdateCount } from "@/hooks/use-updates";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function Group({
  group,
  columns,
  allItems,
  allPeople,
  orgMembers,
  boardId,
  onPersonAdded,
  onAddItem,
  onUpdateItem,
  onUpdateColumn,
  onDeleteItem,
  onUpdateGroupTitle,
  onDeleteGroup,
  editingItem,
  setEditingItem,
  isCollapsed,
  onToggleCollapse,
  itemExpandState,
  onItemToggleExpand,
  onOpenUpdates,
}) {
  const [groupTitle, setGroupTitle] = useState(group.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Sortable hook for drag and drop (for the group itself)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    onUpdateGroupTitle(group.id, groupTitle);
  };

  return (
    <div>
      {/* Group Header Row */}
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: `200px repeat(${columns.length}, minmax(150px, 1fr)) 100px`,
        }}
        className="bg-gray-100 border-b border-gray-200"
      >
        <div className="sticky left-0 z-10 bg-gray-100 border-r border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing hover:bg-gray-200 p-1 rounded shrink-0"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
            {/* Collapse/Expand Button */}
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              {isCollapsed ? "▶" : "▼"}
            </button>
            <div className="flex-1 flex items-center gap-2">
              {isEditingTitle ? (
                <Input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleBlur();
                    }
                  }}
                  className="h-8 font-semibold flex-1"
                  autoFocus
                />
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-left font-semibold text-gray-700 hover:bg-gray-200 px-2 py-1 rounded flex-1"
                  >
                    {group.title}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Group
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteGroup(group.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
        {columns.map((column) => (
          <div
            key={`group-${group.id}-${column.id}`}
            className="bg-gray-100 border-r border-gray-200 px-4 py-2 text-center flex items-center justify-center min-w-[150px]"
          >
            {column.type === "updates" ? (
              <GroupUpdatesCell
                group={group}
                boardId={boardId}
                onOpenUpdates={onOpenUpdates}
              />
            ) : (
              // Empty cell for other column types
              <div className="h-8"></div>
            )}
          </div>
        ))}
        <div className="bg-gray-100"></div>
      </div>

      {/* Items */}
      {!isCollapsed && (
        <SortableContext
          items={group.items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.items.map((item) => (
            <Item
              key={item.id}
              item={item}
              groupId={group.id}
              columns={columns}
              allItems={allItems}
              allPeople={allPeople}
              orgMembers={orgMembers}
              onUpdateItem={onUpdateItem}
              onUpdateColumn={onUpdateColumn}
              onDeleteItem={onDeleteItem}
              isEditing={editingItem === item.id}
              onEdit={() => setEditingItem(item.id)}
              onEditEnd={() => setEditingItem(null)}
              isExpanded={itemExpandState[item.id] !== false}
              onToggleExpand={(expanded) => onItemToggleExpand(item.id, expanded)}
              onOpenUpdates={onOpenUpdates}
              boardId={boardId}
              onPersonAdded={onPersonAdded}
            />
          ))}
        </SortableContext>
      )}

      {/* Add Item Button */}
      {!isCollapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${columns.length}, minmax(150px, 1fr)) 100px`,
          }}
        >
          <div className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-2">
            <Button
              onClick={onAddItem}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-500 hover:text-gray-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          {columns.map((column) => (
            <div
              key={`empty-add-${column.id}`}
              className="bg-white border-r border-gray-200"
            ></div>
          ))}
          <div className="bg-white"></div>
        </div>
      )}
    </div>
  );
}

// GroupUpdatesCell component for displaying update count on groups
function GroupUpdatesCell({ group, boardId, onOpenUpdates }) {
  const { count, isLoading } = useUpdateCount(boardId, group.id, "group");

  return (
    <Button
      variant="ghost"
      className="h-8 w-full hover:bg-muted/50 flex items-center justify-center gap-2 relative"
      onClick={() =>
        onOpenUpdates && onOpenUpdates(group, "group", null, false, null)
      }
      disabled={isLoading}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      {!isLoading && count > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}
