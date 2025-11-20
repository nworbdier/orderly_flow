"use client";

import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item } from "./Item";

export function Group({
  group,
  columns,
  allItems,
  allPeople,
  onAddItem,
  onUpdateItem,
  onUpdateColumn,
  onDeleteItem,
  onUpdateGroupTitle,
  onDeleteGroup,
  editingItem,
  setEditingItem,
  allExpanded,
}) {
  const [groupTitle, setGroupTitle] = useState(group.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    onUpdateGroupTitle(group.id, groupTitle);
  };

  return (
    <>
      <tr className="bg-gray-100 border-b border-gray-200">
        <td className="sticky left-0 z-10 bg-gray-100 border-r border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
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
        </td>
        {columns.map(() => (
          <td
            key={`empty-${Math.random()}`}
            className="bg-gray-100 border-r border-gray-200"
          ></td>
        ))}
        <td className="bg-gray-100"></td>
      </tr>
      {group.items.map((item) => (
        <Item
          key={item.id}
          item={item}
          groupId={group.id}
          columns={columns}
          allItems={allItems}
          allPeople={allPeople}
          onUpdateItem={onUpdateItem}
          onUpdateColumn={onUpdateColumn}
          onDeleteItem={onDeleteItem}
          isEditing={editingItem === item.id}
          onEdit={() => setEditingItem(item.id)}
          onEditEnd={() => setEditingItem(null)}
          forceExpanded={allExpanded}
        />
      ))}
      <tr>
        <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-2">
          <Button
            onClick={onAddItem}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </td>
        {columns.map(() => (
          <td
            key={`empty-add-${Math.random()}`}
            className="bg-white border-r border-gray-200"
          ></td>
        ))}
        <td className="bg-white"></td>
      </tr>
    </>
  );
}
