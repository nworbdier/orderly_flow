"use client";

import { Trash2, MoreVertical, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cell } from "./Cell";
import { toast } from "sonner";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";

export function Item({
  item,
  groupId,
  columns,
  allItems,
  allPeople,
  orgMembers,
  onUpdateItem,
  onUpdateColumn,
  onDeleteItem,
  isEditing,
  onEdit,
  onEditEnd,
  isExpanded,
  onToggleExpand,
  onOpenUpdates,
  boardId,
  onPersonAdded,
}) {
  const [itemName, setItemName] = useState(item.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newSubitemId, setNewSubitemId] = useState(null);

  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editingSubitemId, setEditingSubitemId] = useState(null);

  // Sensors for subitem drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleNameBlur = () => {
    setIsEditingName(false);
    onUpdateItem(groupId, item.id, "name", itemName);
  };

  const handleAddSubitem = async () => {
    const subitemId = `subitem-${Date.now()}`;
    const newSubitem = {
      id: subitemId,
      name: "New Subitem",
      columns: { ...item.columns }, // Copy parent item's column values
    };

    const position = String((item.subitems || []).length);

    // Optimistic update
    const currentSubitems = item.subitems || [];
    onUpdateItem(groupId, item.id, "subitems", [
      ...currentSubitems,
      newSubitem,
    ]);
    // Expand when adding subitem
    if (!isExpanded) {
      onToggleExpand(true);
    }
    setNewSubitemId(subitemId);

    // Save to database
    try {
      const response = await fetch(`/api/boards/${boardId}/subitems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subitemId,
          itemId: item.id,
          name: newSubitem.name,
          columns: newSubitem.columns,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subitem");
      }
    } catch (error) {
      console.error("Error creating subitem:", error);
      toast.error("Failed to add subitem");
      // Rollback on error
      onUpdateItem(groupId, item.id, "subitems", currentSubitems);
    }
  };

  const handleUpdateSubitem = async (subitemId, field, value) => {
    const currentSubitems = item.subitems || [];
    const updatedSubitems = currentSubitems.map((sub) =>
      sub.id === subitemId ? { ...sub, [field]: value } : sub
    );

    // Optimistic update
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);

    // Save to database
    try {
      const response = await fetch(
        `/api/boards/${boardId}/subitems/${subitemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subitem");
      }
    } catch (error) {
      console.error("Error updating subitem:", error);
      toast.error("Failed to update subitem");
      // Rollback on error
      onUpdateItem(groupId, item.id, "subitems", currentSubitems);
    }
  };

  const handleUpdateSubitemColumn = async (subitemId, columnId, value) => {
    const currentSubitems = item.subitems || [];
    const targetSubitem = currentSubitems.find((sub) => sub.id === subitemId);

    if (!targetSubitem) return;

    const updatedSubitems = currentSubitems.map((sub) =>
      sub.id === subitemId
        ? {
            ...sub,
            columns: {
              ...sub.columns,
              [columnId]: {
                ...sub.columns[columnId],
                value,
              },
            },
          }
        : sub
    );

    // Optimistic update
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);

    // Save to database - send full columns object
    try {
      const updatedColumns = {
        ...targetSubitem.columns,
        [columnId]: {
          ...targetSubitem.columns[columnId],
          value,
        },
      };

      const response = await fetch(
        `/api/boards/${boardId}/subitems/${subitemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columns: updatedColumns }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subitem column");
      }
    } catch (error) {
      console.error("Error updating subitem column:", error);
      // Rollback on error
      onUpdateItem(groupId, item.id, "subitems", currentSubitems);
    }
  };

  const handleDeleteSubitem = async (subitemId) => {
    const currentSubitems = item.subitems || [];
    const updatedSubitems = currentSubitems.filter(
      (sub) => sub.id !== subitemId
    );

    // Optimistic update
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);

    // Delete from database
    try {
      const response = await fetch(
        `/api/boards/${boardId}/subitems/${subitemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete subitem");
      }
    } catch (error) {
      console.error("Error deleting subitem:", error);
      toast.error("Failed to delete subitem");
      // Rollback on error
      onUpdateItem(groupId, item.id, "subitems", currentSubitems);
    }
  };

  // Handle drag end for subitems within this item
  const handleDragEndSubitems = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const currentSubitems = item.subitems || [];
    const oldIndex = currentSubitems.findIndex((sub) => sub.id === active.id);
    const newIndex = currentSubitems.findIndex((sub) => sub.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder subitems
    const newSubitems = [...currentSubitems];
    const [movedSubitem] = newSubitems.splice(oldIndex, 1);
    newSubitems.splice(newIndex, 0, movedSubitem);

    // Optimistic update
    onUpdateItem(groupId, item.id, "subitems", newSubitems);

    // Save position to database
    try {
      const response = await fetch(
        `/api/boards/${boardId}/subitems/${active.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: String(newIndex) }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subitem position");
      }
    } catch (error) {
      console.error("Error updating subitem position:", error);
      toast.error("Failed to save subitem order");
      // Rollback on error
      onUpdateItem(groupId, item.id, "subitems", currentSubitems);
    }
  };

  const subitems = item.subitems || [];

  return (
    <div id={`item-${item.id}`} className="transition-all duration-300">
      {/* Item Row */}
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: `200px repeat(${columns.length}, minmax(150px, 1fr)) 100px`,
        }}
        className="bg-white border-b border-gray-200 hover:bg-gray-50"
      >
        <div className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing hover:bg-gray-200 p-1 rounded shrink-0"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => onToggleExpand(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
            {isEditingName ? (
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameBlur();
                  }
                }}
                className="flex-1 h-8"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex-1 text-left text-gray-900 hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-2"
              >
                <span>{item.name}</span>
                {subitems.length > 0 && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                    {subitems.length}
                  </span>
                )}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDeleteItem(groupId, item.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {columns.map((column) => (
          <Cell
            key={column.id}
            item={item}
            column={column}
            value={item.columns[column.id]?.value || ""}
            onUpdate={(value) => onUpdateColumn(item.id, column.id, value)}
            isEditing={isEditing}
            allItems={allItems}
            allPeople={allPeople}
            orgMembers={orgMembers}
            onOpenUpdates={(clickedItem) =>
              onOpenUpdates(clickedItem, "item", groupId, false, null)
            }
            boardId={boardId}
            onPersonAdded={onPersonAdded}
          />
        ))}
        <div className="bg-white"></div>
      </div>

      {/* Subitems with Drag and Drop */}
      {isExpanded && subitems.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEndSubitems}
        >
          <SortableContext
            items={subitems.map((sub) => sub.id)}
            strategy={verticalListSortingStrategy}
          >
            {subitems.map((subitem) => {
              const isEditingSubitemName =
                editingSubitemId === subitem.id || newSubitemId === subitem.id;

              return (
                <SubitemRow
                  key={subitem.id}
                  subitem={subitem}
                  isEditingSubitemName={isEditingSubitemName}
                  handleUpdateSubitem={handleUpdateSubitem}
                  setEditingSubitemId={setEditingSubitemId}
                  newSubitemId={newSubitemId}
                  setNewSubitemId={setNewSubitemId}
                  handleDeleteSubitem={handleDeleteSubitem}
                  columns={columns}
                  handleUpdateSubitemColumn={handleUpdateSubitemColumn}
                  allItems={allItems}
                  allPeople={allPeople}
                  orgMembers={orgMembers}
                  onOpenUpdates={onOpenUpdates}
                  groupId={groupId}
                  itemId={item.id}
                  boardId={boardId}
                  onPersonAdded={onPersonAdded}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      )}

      {/* Add Subitem Button */}
      {isExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${columns.length}, minmax(150px, 1fr)) 100px`,
          }}
          className="bg-gray-50 border-b border-gray-100"
        >
          <div className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 pl-12">
            <Button
              onClick={handleAddSubitem}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-500 hover:text-gray-700 h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subitem
            </Button>
          </div>
          {columns.map((column) => (
            <div
              key={`add-subitem-${column.id}`}
              className="bg-gray-50 border-r border-gray-200"
            ></div>
          ))}
          <div className="bg-gray-50"></div>
        </div>
      )}
    </div>
  );
}

// SubitemRow component with drag and drop
function SubitemRow({
  subitem,
  isEditingSubitemName,
  handleUpdateSubitem,
  setEditingSubitemId,
  newSubitemId,
  setNewSubitemId,
  handleDeleteSubitem,
  columns,
  handleUpdateSubitemColumn,
  allItems,
  allPeople,
  orgMembers,
  onOpenUpdates,
  groupId,
  itemId,
  boardId,
  onPersonAdded,
}) {
  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subitem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `200px repeat(${columns.length}, minmax(150px, 1fr)) 100px`,
      }}
      className="bg-gray-50 border-b border-gray-100"
    >
      <div className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 pl-12">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-gray-200 p-1 rounded shrink-0"
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </button>
          <span className="text-gray-400 shrink-0">└</span>
          {isEditingSubitemName ? (
            <Input
              value={subitem.name}
              onChange={(e) =>
                handleUpdateSubitem(subitem.id, "name", e.target.value)
              }
              onBlur={() => {
                setEditingSubitemId(null);
                if (newSubitemId === subitem.id) {
                  setNewSubitemId(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingSubitemId(null);
                  if (newSubitemId === subitem.id) {
                    setNewSubitemId(null);
                  }
                }
              }}
              className="flex-1 h-7 text-sm"
              placeholder="Subitem name..."
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingSubitemId(subitem.id)}
              className="flex-1 text-left text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-sm"
            >
              {subitem.name || "Unnamed subitem"}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDeleteSubitem(subitem.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {columns.map((column) => (
        <Cell
          key={`subitem-${subitem.id}-${column.id}`}
          item={subitem}
          column={column}
          value={subitem.columns?.[column.id]?.value || ""}
          onUpdate={(value) =>
            handleUpdateSubitemColumn(subitem.id, column.id, value)
          }
          isEditing={false}
          allItems={allItems}
          allPeople={allPeople}
          orgMembers={orgMembers}
          itemType="subitem"
          onOpenUpdates={(clickedItem) =>
            onOpenUpdates(clickedItem, "subitem", groupId, true, itemId)
          }
          boardId={boardId}
          onPersonAdded={onPersonAdded}
        />
      ))}
      <div className="bg-gray-50"></div>
    </div>
  );
}
