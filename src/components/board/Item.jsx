"use client";

import { Trash2, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cell } from "./Cell";
import { useState, useEffect } from "react";

export function Item({
  item,
  groupId,
  columns,
  allItems,
  allPeople,
  onUpdateItem,
  onUpdateColumn,
  onDeleteItem,
  isEditing,
  onEdit,
  onEditEnd,
  forceExpanded,
}) {
  const [itemName, setItemName] = useState(item.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [expandedSubitems, setExpandedSubitems] = useState(true);
  const [newSubitemId, setNewSubitemId] = useState(null);

  // Update expanded state when forceExpanded changes
  useEffect(() => {
    if (forceExpanded !== undefined) {
      setExpandedSubitems(forceExpanded);
    }
  }, [forceExpanded]);
  const [editingSubitemId, setEditingSubitemId] = useState(null);

  const handleNameBlur = () => {
    setIsEditingName(false);
    onUpdateItem(groupId, item.id, "name", itemName);
  };

  const handleAddSubitem = () => {
    const subitemId = `subitem-${Date.now()}`;
    const newSubitem = {
      id: subitemId,
      name: "New Subitem",
      columns: { ...item.columns }, // Copy parent item's column values
    };
    const currentSubitems = item.subitems || [];
    onUpdateItem(groupId, item.id, "subitems", [
      ...currentSubitems,
      newSubitem,
    ]);
    setExpandedSubitems(true); // Make sure subitems are expanded
    setNewSubitemId(subitemId); // Mark this as the newly created subitem
  };

  const handleUpdateSubitem = (subitemId, field, value) => {
    const updatedSubitems = (item.subitems || []).map((sub) =>
      sub.id === subitemId ? { ...sub, [field]: value } : sub
    );
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);
  };

  const handleUpdateSubitemColumn = (subitemId, columnId, value) => {
    const updatedSubitems = (item.subitems || []).map((sub) =>
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
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);
  };

  const handleDeleteSubitem = (subitemId) => {
    const updatedSubitems = (item.subitems || []).filter(
      (sub) => sub.id !== subitemId
    );
    onUpdateItem(groupId, item.id, "subitems", updatedSubitems);
  };

  const subitems = item.subitems || [];

  return (
    <>
      <tr className="bg-white border-b border-gray-200 hover:bg-gray-50">
        <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpandedSubitems(!expandedSubitems)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedSubitems ? "▼" : "▶"}
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
        </td>
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
          />
        ))}
        <td className="bg-white"></td>
      </tr>
      {expandedSubitems &&
        subitems.map((subitem) => {
          const isEditingSubitemName =
            editingSubitemId === subitem.id || newSubitemId === subitem.id;

          return (
            <tr
              key={subitem.id}
              className="bg-gray-50 border-b border-gray-100"
            >
              <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 pl-12">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">└</span>
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
              </td>
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
                />
              ))}
              <td className="bg-gray-50"></td>
            </tr>
          );
        })}
      {expandedSubitems && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-2 pl-12">
            <Button
              onClick={handleAddSubitem}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-500 hover:text-gray-700 h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subitem
            </Button>
          </td>
          {columns.map((column) => (
            <td
              key={`add-subitem-${column.id}`}
              className="bg-gray-50 border-r border-gray-200"
            ></td>
          ))}
          <td className="bg-gray-50"></td>
        </tr>
      )}
    </>
  );
}
