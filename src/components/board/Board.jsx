"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Group } from "./Group";
import { ColumnHeader } from "./ColumnHeader";
import { ImportDialog } from "./ImportDialog";
import { UpdatesSidebar } from "./UpdatesSidebar";
import { ViewSwitcher } from "./ViewSwitcher";
import { DailyBriefView } from "./DailyBriefView";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export function Board({ initialBoard, onBoardChange }) {
  const [board, setBoard] = useState(initialBoard);
  const [editingItem, setEditingItem] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  // Track expand/collapse state - start with all collapsed
  const [expandCollapseState, setExpandCollapseState] = useState({
    groups: {},  // { groupId: boolean }
    items: {},   // { itemId: boolean }
  });
  const [updatesSidebar, setUpdatesSidebar] = useState(null);
  const [currentView, setCurrentView] = useState("main"); // "main" or "daily-brief"
  const [boardPeople, setBoardPeople] = useState([]); // People from database
  const [orgMembers, setOrgMembers] = useState([]); // Organization members

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setBoard(initialBoard);
    // Load people from database
    loadPeople();
    // Load organization members
    loadOrgMembers();
  }, [initialBoard]);

  const loadPeople = async () => {
    try {
      const response = await fetch(`/api/boards/${initialBoard.id}/people`);
      if (response.ok) {
        const people = await response.json();
        setBoardPeople(people);
      }
    } catch (error) {
      console.error("Error loading people:", error);
    }
  };

  const loadOrgMembers = async () => {
    try {
      // Get organization ID from board
      const organizationId = initialBoard.organizationId;
      if (!organizationId) return;

      const response = await fetch(
        `/api/organizations/${organizationId}/members`
      );
      if (response.ok) {
        const members = await response.json();
        setOrgMembers(members);
      }
    } catch (error) {
      console.error("Error loading organization members:", error);
    }
  };

  const updateBoard = (newBoard) => {
    setBoard(newBoard);
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
  };

  const handleAddItem = async (groupId) => {
    const newItem = {
      id: `item-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      name: "New Item",
      subitems: [],
      columns: {},
    };

    // Initialize columns for new item
    board.columns.forEach((col) => {
      let defaultValue = "";
      if (col.type === "date") {
        defaultValue = new Date().toISOString().split("T")[0];
      } else if (col.type === "files") {
        defaultValue = [];
      } else if (col.type === "person") {
        defaultValue = [];
      } else if (col.type === "time_tracker") {
        defaultValue = { totalSeconds: 0, isRunning: false, startTime: null };
      }

      newItem.columns[col.id] = {
        type: col.type,
        value: defaultValue,
      };
    });

    // Get position for new item
    const group = board.groups.find((g) => g.id === groupId);
    const position = String(group?.items?.length || 0);

    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((g) =>
        g.id === groupId ? { ...g, items: [...g.items, newItem] } : g
      ),
    };
    setBoard(updatedBoard);
    setEditingItem(newItem.id);

    // Save to database
    try {
      const response = await fetch(`/api/boards/${board.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newItem.id,
          groupId,
          name: newItem.name,
          columns: newItem.columns,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      toast.success("Item added");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to add item");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleAddGroup = async () => {
    const newGroup = {
      id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      title: "New Group",
      items: [],
      position: String(board.groups.length),
    };

    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: [...board.groups, newGroup],
    };
    setBoard(updatedBoard);

    // Save to database
    try {
      const response = await fetch(`/api/boards/${board.id}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newGroup.id,
          title: newGroup.title,
          position: newGroup.position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      toast.success("Group added");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to add group");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleUpdateItem = async (groupId, itemId, field, value) => {
    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : group
      ),
    };
    setBoard(updatedBoard);

    // Save to database
    try {
      const response = await fetch(`/api/boards/${board.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleUpdateColumn = async (itemId, columnId, value) => {
    // Find the item to get its current columns
    let targetItem = null;
    for (const group of board.groups) {
      const item = group.items.find((i) => i.id === itemId);
      if (item) {
        targetItem = item;
        break;
      }
    }

    if (!targetItem) return;

    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                columns: {
                  ...item.columns,
                  [columnId]: {
                    ...item.columns[columnId],
                    value,
                  },
                },
              }
            : item
        ),
      })),
    };
    setBoard(updatedBoard);

    // Save to database - send full columns object
    try {
      const updatedColumns = {
        ...targetItem.columns,
        [columnId]: {
          ...targetItem.columns[columnId],
          value,
        },
      };

      const response = await fetch(`/api/boards/${board.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      if (!response.ok) {
        throw new Error("Failed to update column");
      }
    } catch (error) {
      console.error("Error updating column:", error);
      // Rollback on error
      setBoard(board);
    }
  };

  const handleDeleteItem = async (groupId, itemId) => {
    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.filter((item) => item.id !== itemId),
            }
          : group
      ),
    };
    setBoard(updatedBoard);

    // Delete from database
    try {
      const response = await fetch(`/api/boards/${board.id}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleAddColumn = () => {
    const newColumn = {
      id: `col-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      title: "New Column",
      type: "text",
    };
    updateBoard({
      ...board,
      columns: [...board.columns, newColumn],
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          columns: {
            ...item.columns,
            [newColumn.id]: { type: newColumn.type, value: "" },
          },
        })),
      })),
    });
    setEditingColumn(newColumn.id);
    toast.success("Column added");
  };

  const handleUpdateGroupTitle = async (groupId, title) => {
    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId ? { ...group, title } : group
      ),
    };
    setBoard(updatedBoard);

    // Save to database
    try {
      const response = await fetch(
        `/api/boards/${board.id}/groups/${groupId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.filter((group) => group.id !== groupId),
    };
    setBoard(updatedBoard);

    // Delete from database
    try {
      const response = await fetch(
        `/api/boards/${board.id}/groups/${groupId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      toast.success("Group deleted");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
      // Rollback on error
      setBoard(board);
    }
  };

  const handleDeleteColumn = (columnId) => {
    updateBoard({
      ...board,
      columns: board.columns.filter((col) => col.id !== columnId),
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          const { [columnId]: removed, ...remainingColumns } = item.columns;
          return {
            ...item,
            columns: remainingColumns,
            subitems:
              item.subitems?.map((subitem) => {
                const { [columnId]: removedSub, ...remainingSubColumns } =
                  subitem.columns || {};
                return {
                  ...subitem,
                  columns: remainingSubColumns,
                };
              }) || [],
          };
        }),
      })),
    });
    toast.success("Column deleted");
  };

  const handleImport = (importedData) => {
    // Create a mapping of imported column IDs to existing column IDs based on type
    const columnMapping = {};
    const newColumns = [];

    importedData.columns.forEach((importedCol) => {
      // Try to find an existing column of the same type
      const existingCol = board.columns.find(
        (col) => col.type === importedCol.type
      );

      if (existingCol) {
        // Map the imported column to the existing one
        columnMapping[importedCol.id] = existingCol.id;
      } else {
        // This is a new column type, add it
        newColumns.push(importedCol);
      }
    });

    const mergedColumns = [...board.columns, ...newColumns];

    // Update imported items to map columns correctly
    const updatedGroups = importedData.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        const updatedColumns = {};

        // Map imported column values to existing columns or keep new ones
        Object.entries(item.columns).forEach(([importedColId, columnData]) => {
          const targetColId = columnMapping[importedColId] || importedColId;

          // If mapping to an existing column that already has a value, merge them
          if (columnMapping[importedColId] && updatedColumns[targetColId]) {
            // For person type, merge arrays
            if (
              columnData.type === "person" &&
              Array.isArray(columnData.value) &&
              Array.isArray(updatedColumns[targetColId].value)
            ) {
              updatedColumns[targetColId] = {
                type: columnData.type,
                value: [
                  ...updatedColumns[targetColId].value,
                  ...columnData.value,
                ],
              };
            } else {
              // Check if the imported value is not empty
              const hasValue =
                columnData.type === "person" || columnData.type === "files"
                  ? Array.isArray(columnData.value) &&
                    columnData.value.length > 0
                  : columnData.value !== "" &&
                    columnData.value !== null &&
                    columnData.value !== undefined;

              if (hasValue) {
                updatedColumns[targetColId] = columnData;
              }
            }
          } else {
            // First time setting this column, always set it
            updatedColumns[targetColId] = columnData;
          }
        });

        // Add empty values for existing columns that weren't in the import
        board.columns.forEach((col) => {
          if (!updatedColumns[col.id]) {
            let defaultValue = "";
            if (col.type === "date") {
              defaultValue = ""; // Don't set to today's date, leave empty
            } else if (col.type === "files") {
              defaultValue = [];
            } else if (col.type === "person") {
              defaultValue = [];
            } else if (col.type === "time_tracker") {
              defaultValue = {
                totalSeconds: 0,
                isRunning: false,
                startTime: null,
              };
            }

            updatedColumns[col.id] = {
              type: col.type,
              value: defaultValue,
            };
          }
        });

        // Map subitems columns too
        const mappedSubitems = (item.subitems || []).map((subitem) => {
          const subUpdatedColumns = {};

          Object.entries(subitem.columns || {}).forEach(
            ([importedColId, columnData]) => {
              const targetColId = columnMapping[importedColId] || importedColId;

              if (
                columnMapping[importedColId] &&
                subUpdatedColumns[targetColId]
              ) {
                if (
                  columnData.type === "person" &&
                  Array.isArray(columnData.value) &&
                  Array.isArray(subUpdatedColumns[targetColId].value)
                ) {
                  subUpdatedColumns[targetColId] = {
                    type: columnData.type,
                    value: [
                      ...subUpdatedColumns[targetColId].value,
                      ...columnData.value,
                    ],
                  };
                } else {
                  const hasValue =
                    columnData.type === "person" || columnData.type === "files"
                      ? Array.isArray(columnData.value) &&
                        columnData.value.length > 0
                      : columnData.value !== "" &&
                        columnData.value !== null &&
                        columnData.value !== undefined;

                  if (hasValue) {
                    subUpdatedColumns[targetColId] = columnData;
                  }
                }
              } else {
                subUpdatedColumns[targetColId] = columnData;
              }
            }
          );

          // Add empty values for existing columns
          board.columns.forEach((col) => {
            if (!subUpdatedColumns[col.id]) {
              let defaultValue = "";
              if (col.type === "date") {
                defaultValue = ""; // Don't set to today's date, leave empty
              } else if (col.type === "files") {
                defaultValue = [];
              } else if (col.type === "person") {
                defaultValue = [];
              } else if (col.type === "time_tracker") {
                defaultValue = {
                  totalSeconds: 0,
                  isRunning: false,
                  startTime: null,
                };
              }

              subUpdatedColumns[col.id] = {
                type: col.type,
                value: defaultValue,
              };
            }
          });

          return { ...subitem, columns: subUpdatedColumns };
        });

        return { ...item, columns: updatedColumns, subitems: mappedSubitems };
      }),
    }));

    // Update existing items to include new columns
    const updatedExistingGroups = board.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        const updatedColumns = { ...item.columns };

        newColumns.forEach((col) => {
          let defaultValue = "";
          if (col.type === "date") {
            defaultValue = new Date().toISOString().split("T")[0];
          } else if (col.type === "files") {
            defaultValue = [];
          } else if (col.type === "person") {
            defaultValue = [];
          } else if (col.type === "time_tracker") {
            defaultValue = {
              totalSeconds: 0,
              isRunning: false,
              startTime: null,
            };
          }

          updatedColumns[col.id] = {
            type: col.type,
            value: defaultValue,
          };
        });

        return { ...item, columns: updatedColumns };
      }),
    }));

    // Merge groups
    updateBoard({
      ...board,
      columns: mergedColumns,
      groups: [...updatedExistingGroups, ...updatedGroups],
    });
  };

  // Collect all items and people on the board for use in cells (e.g. person suggestions)
  const allItems = board.groups.flatMap((g) => g.items);
  // Use boardPeople from database instead of extracting from items
  const allPeople = boardPeople;

  // Check if all groups and items are currently expanded
  const areAllExpanded = () => {
    const allGroupIds = board.groups.map(g => g.id);
    const allItemIds = board.groups.flatMap(g => g.items.map(i => i.id));
    
    const allGroupsExpanded = allGroupIds.every(id => 
      expandCollapseState.groups[id] !== false // true or undefined (default expanded)
    );
    const allItemsExpanded = allItemIds.every(id => 
      expandCollapseState.items[id] !== false // true or undefined (default expanded)
    );
    
    return allGroupsExpanded && allItemsExpanded;
  };

  const handleToggleExpandAll = () => {
    const shouldExpand = !areAllExpanded();
    
    // Create new state objects with all groups and items set to the same state
    const newGroupState = {};
    const newItemState = {};
    
    board.groups.forEach(group => {
      newGroupState[group.id] = shouldExpand;
      group.items.forEach(item => {
        newItemState[item.id] = shouldExpand;
      });
    });
    
    setExpandCollapseState({
      groups: newGroupState,
      items: newItemState,
    });
  };

  const handleDragEndGroups = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Check if we're dragging a group or an item
    const isGroup = board.groups.some((g) => g.id === active.id);

    if (isGroup) {
      // Handle group reordering
      const oldIndex = board.groups.findIndex((g) => g.id === active.id);
      const newIndex = board.groups.findIndex((g) => g.id === over.id);

      const reorderedGroups = arrayMove(board.groups, oldIndex, newIndex);

      // Optimistic update
      const updatedBoard = {
        ...board,
        groups: reorderedGroups,
      };
      setBoard(updatedBoard);

      // Update positions in database
      try {
        await Promise.all(
          reorderedGroups.map((group, index) =>
            fetch(`/api/boards/${board.id}/groups/${group.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ position: String(index) }),
            })
          )
        );
      } catch (error) {
        console.error("Error updating group positions:", error);
        toast.error("Failed to save group order");
        // Rollback on error
        setBoard(board);
      }
    } else {
      // Handle item reordering within a group
      // Find which group contains the active item
      let targetGroupId = null;
      let targetGroup = null;

      for (const group of board.groups) {
        if (group.items.some((item) => item.id === active.id)) {
          targetGroupId = group.id;
          targetGroup = group;
          break;
        }
      }

      if (!targetGroupId || !targetGroup) return;

      // Check if over is also an item in the same group
      const overItemInSameGroup = targetGroup.items.some(
        (item) => item.id === over.id
      );
      if (!overItemInSameGroup) return;

      const oldIndex = targetGroup.items.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = targetGroup.items.findIndex(
        (item) => item.id === over.id
      );

      const reorderedItems = arrayMove(targetGroup.items, oldIndex, newIndex);

      // Optimistic update
      const updatedGroups = board.groups.map((group) =>
        group.id === targetGroupId ? { ...group, items: reorderedItems } : group
      );
      const updatedBoard = {
        ...board,
        groups: updatedGroups,
      };
      setBoard(updatedBoard);

      // Update positions in database
      try {
        await fetch(`/api/boards/${board.id}/items/${active.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: String(newIndex) }),
        });
      } catch (error) {
        console.error("Error updating item position:", error);
        toast.error("Failed to save item order");
        // Rollback on error
        setBoard(board);
      }
    }
  };

  const handleOpenUpdates = (
    item,
    itemType,
    groupId,
    isSubitem,
    parentItemId
  ) => {
    // Find parent information for breadcrumb
    let parentGroup = null;
    let parentItem = null;

    if (groupId) {
      parentGroup = board.groups.find((g) => g.id === groupId);
    }

    if (isSubitem && parentItemId && parentGroup) {
      parentItem = parentGroup.items.find((i) => i.id === parentItemId);
    }

    setUpdatesSidebar({
      item,
      itemType,
      groupId,
      isSubitem,
      parentItemId,
      parentGroup,
      parentItem,
    });
  };

  const handleFocusItem = (groupId, itemId) => {
    // Expand the group if it's collapsed
    setExpandCollapseState(prev => ({
      ...prev,
      groups: {
        ...prev.groups,
        [groupId]: true,
      },
      items: {
        ...prev.items,
        [itemId]: true,
      },
    }));

    // Scroll to the item after a short delay
    setTimeout(() => {
      const element = document.getElementById(`item-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the item briefly
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2000);
      }
    }, 200);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* View Switcher */}
      <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />

      {/* Render different views based on currentView */}
      {currentView === "daily-brief" ? (
        <div className="flex-1 overflow-y-auto">
          <DailyBriefView
            board={board}
            onSwitchToMain={() => setCurrentView("main")}
            onFocusItem={handleFocusItem}
          />
        </div>
      ) : (
        <>
          {/* Board Actions Bar */}
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-border">
            <Button
              onClick={handleToggleExpandAll}
              variant="outline"
              size="sm"
            >
              {areAllExpanded() ? (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand All
                </>
              )}
            </Button>
            <ImportDialog onImport={handleImport} />
          </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEndGroups}
        >
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div 
              className="bg-white border-b-2 border-gray-200 sticky top-0 z-10"
              style={{
                display: 'grid',
                gridTemplateColumns: `200px repeat(${board.columns.length}, minmax(150px, 1fr)) 100px`,
              }}
            >
              <div className="sticky left-0 z-20 bg-white border-r border-gray-200 px-4 py-3 flex items-center justify-center">
                <span className="font-semibold text-gray-700">Item</span>
              </div>
              {board.columns.map((column) => (
                <ColumnHeader
                  key={column.id}
                  column={column}
                  board={board}
                  setBoard={updateBoard}
                  isEditing={editingColumn === column.id}
                  onEdit={() => setEditingColumn(column.id)}
                  onEditEnd={() => setEditingColumn(null)}
                  onDelete={handleDeleteColumn}
                />
              ))}
              <div className="bg-white border-l border-gray-200 px-4 py-3">
                <Button
                  onClick={handleAddColumn}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </div>

            {/* Groups and Items */}
            <div>
              {board.groups.map((group) => (
                <Group
                  key={group.id}
                  group={group}
                  columns={board.columns}
                  allItems={allItems}
                  allPeople={allPeople}
                  orgMembers={orgMembers}
                  boardId={board.id}
                  onPersonAdded={loadPeople}
                  onAddItem={() => handleAddItem(group.id)}
                  onUpdateItem={handleUpdateItem}
                  onUpdateColumn={handleUpdateColumn}
                  onDeleteItem={handleDeleteItem}
                  onUpdateGroupTitle={handleUpdateGroupTitle}
                  onDeleteGroup={handleDeleteGroup}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  isCollapsed={expandCollapseState.groups[group.id] === false}
                  onToggleCollapse={() => {
                    const currentlyCollapsed = expandCollapseState.groups[group.id] === false;
                    setExpandCollapseState(prev => ({
                      ...prev,
                      groups: {
                        ...prev.groups,
                        [group.id]: currentlyCollapsed ? true : false,
                      },
                    }));
                  }}
                  itemExpandState={expandCollapseState.items}
                  onItemToggleExpand={(itemId, expanded) => {
                    setExpandCollapseState(prev => ({
                      ...prev,
                      items: {
                        ...prev.items,
                        [itemId]: expanded,
                      },
                    }));
                  }}
                  onOpenUpdates={handleOpenUpdates}
                  boardId={board.id}
                />
              ))}

              {/* Add Group Button */}
              <div 
                className="border-t border-gray-200 px-6 py-4"
                style={{
                  gridColumn: `1 / span ${board.columns.length + 2}`,
                }}
              >
                <Button
                  onClick={handleAddGroup}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
        </>
      )}

      {/* Updates Sidebar */}
      {updatesSidebar && (
        <UpdatesSidebar
          item={updatesSidebar.item}
          itemType={updatesSidebar.itemType}
          boardId={board.id}
          parentGroup={updatesSidebar.parentGroup}
          parentItem={updatesSidebar.parentItem}
          onClose={() => setUpdatesSidebar(null)}
        />
      )}
    </div>
  );
}
