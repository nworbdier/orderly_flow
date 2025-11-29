"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Group } from "./Group";
import { ColumnHeader } from "./ColumnHeader";
import { UpdatesSidebar } from "./UpdatesSidebar";
import { ViewSwitcher } from "./ViewSwitcher";
import { DailyBriefView } from "./DailyBriefView";
import { BoardToolbar } from "./BoardToolbar";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ItemDetailModal } from "./ItemDetailModal";
import { GroupSummaryRow } from "./ColumnSummary";
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
    groups: {}, // { groupId: boolean }
    items: {}, // { itemId: boolean }
  });
  const [updatesSidebar, setUpdatesSidebar] = useState(null);
  const [currentView, setCurrentView] = useState("main"); // "main" or "daily-brief"
  const [boardPeople, setBoardPeople] = useState([]); // People from database
  const [orgMembers, setOrgMembers] = useState([]); // Organization members

  // New state for production features
  const [filters, setFilters] = useState({
    status: [],
    dateRange: null,
    search: "",
  });
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: "asc",
  });
  const [hideDone, setHideDone] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // For bulk selection
  const [itemDetailModal, setItemDetailModal] = useState({
    open: false,
    item: null,
    group: null,
  });

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

  // Filter and sort items
  const filteredAndSortedBoard = useMemo(() => {
    let processedBoard = { ...board };

    // Filter groups and items
    processedBoard.groups = board.groups.map((group) => {
      let items = [...group.items];

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter((item) =>
          item.name.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        items = items.filter((item) => {
          const statusColumn = board.columns.find((c) => c.type === "status");
          if (!statusColumn) return true;
          const itemStatus = item.columns?.[statusColumn.id]?.value;
          return filters.status.includes(itemStatus);
        });
      }

      // Hide done filter
      if (hideDone) {
        const statusColumn = board.columns.find((c) => c.type === "status");
        if (statusColumn) {
          items = items.filter((item) => {
            const itemStatus = item.columns?.[statusColumn.id]?.value;
            return itemStatus !== "done";
          });
        }
      }

      // Person filter
      if (selectedPerson) {
        items = items.filter((item) => {
          const personColumn = board.columns.find((c) => c.type === "person");
          if (!personColumn) return false;
          const people = item.columns?.[personColumn.id]?.value;
          return (
            Array.isArray(people) &&
            people.some((p) => p.name === selectedPerson.name)
          );
        });
      }

      // Sort items
      if (sortConfig.column) {
        items = [...items].sort((a, b) => {
          let aVal, bVal;

          if (sortConfig.column === "name") {
            aVal = a.name;
            bVal = b.name;
          } else {
            aVal = a.columns?.[sortConfig.column]?.value;
            bVal = b.columns?.[sortConfig.column]?.value;
          }

          // Handle different types
          if (aVal === undefined || aVal === null) aVal = "";
          if (bVal === undefined || bVal === null) bVal = "";

          // String comparison
          if (typeof aVal === "string" && typeof bVal === "string") {
            const comparison = aVal.localeCompare(bVal);
            return sortConfig.direction === "asc" ? comparison : -comparison;
          }

          // Number/date comparison
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      return { ...group, items };
    });

    return processedBoard;
  }, [board, filters, sortConfig, hideDone, selectedPerson]);

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return board.columns.filter((col) => !hiddenColumns.includes(col.id));
  }, [board.columns, hiddenColumns]);

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

    // Remove from selection
    setSelectedItems((prev) => prev.filter((id) => id !== itemId));

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
    // Also remove from hidden columns
    setHiddenColumns((prev) => prev.filter((id) => id !== columnId));
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
    const allGroupIds = board.groups.map((g) => g.id);
    const allItemIds = board.groups.flatMap((g) => g.items.map((i) => i.id));

    const allGroupsExpanded = allGroupIds.every(
      (id) => expandCollapseState.groups[id] !== false // true or undefined (default expanded)
    );
    const allItemsExpanded = allItemIds.every(
      (id) => expandCollapseState.items[id] !== false // true or undefined (default expanded)
    );

    return allGroupsExpanded && allItemsExpanded;
  };

  const handleToggleExpandAll = () => {
    const shouldExpand = !areAllExpanded();

    // Create new state objects with all groups and items set to the same state
    const newGroupState = {};
    const newItemState = {};

    board.groups.forEach((group) => {
      newGroupState[group.id] = shouldExpand;
      group.items.forEach((item) => {
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
    setExpandCollapseState((prev) => ({
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
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight the item briefly
        element.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
        }, 2000);
      }
    }, 200);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    // Find items and their groups
    const itemsToDelete = [];
    board.groups.forEach((group) => {
      group.items.forEach((item) => {
        if (selectedItems.includes(item.id)) {
          itemsToDelete.push({ groupId: group.id, itemId: item.id });
        }
      });
    });

    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.filter((item) => !selectedItems.includes(item.id)),
      })),
    };
    setBoard(updatedBoard);
    setSelectedItems([]);

    // Delete from database
    try {
      await Promise.all(
        itemsToDelete.map(({ itemId }) =>
          fetch(`/api/boards/${board.id}/items/${itemId}`, {
            method: "DELETE",
          })
        )
      );
      toast.success(`Deleted ${itemsToDelete.length} items`);
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("Failed to delete some items");
      setBoard(board);
    }
  };

  const handleBulkStatusChange = async (statusId) => {
    if (selectedItems.length === 0) return;

    const statusColumn = board.columns.find((c) => c.type === "status");
    if (!statusColumn) {
      toast.error("No status column found");
      return;
    }

    // Optimistic update
    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          selectedItems.includes(item.id)
            ? {
                ...item,
                columns: {
                  ...item.columns,
                  [statusColumn.id]: {
                    ...item.columns[statusColumn.id],
                    value: statusId,
                  },
                },
              }
            : item
        ),
      })),
    };
    setBoard(updatedBoard);

    // Update in database
    try {
      await Promise.all(
        selectedItems.map((itemId) => {
          const item = allItems.find((i) => i.id === itemId);
          if (!item) return Promise.resolve();

          const updatedColumns = {
            ...item.columns,
            [statusColumn.id]: {
              ...item.columns[statusColumn.id],
              value: statusId,
            },
          };

          return fetch(`/api/boards/${board.id}/items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ columns: updatedColumns }),
          });
        })
      );
      toast.success(`Updated ${selectedItems.length} items`);
    } catch (error) {
      console.error("Error updating items:", error);
      toast.error("Failed to update some items");
      setBoard(board);
    }
  };

  // Keyboard shortcut handler
  const handleShortcut = useCallback(
    (action) => {
      switch (action) {
        case "newItem":
          // Add item to first group
          if (board.groups.length > 0) {
            handleAddItem(board.groups[0].id);
          }
          break;
        case "toggleExpandAll":
          handleToggleExpandAll();
          break;
        case "selectAll":
          const allItemIds = board.groups.flatMap((g) =>
            g.items.map((i) => i.id)
          );
          setSelectedItems(allItemIds);
          break;
        case "deleteSelected":
          if (selectedItems.length > 0) {
            handleBulkDelete();
          }
          break;
        case "focusSearch":
          // Focus search input in toolbar
          const searchInput = document.querySelector(
            '[placeholder="Search items..."]'
          );
          searchInput?.focus();
          break;
        default:
          break;
      }
    },
    [board.groups, selectedItems]
  );

  // Item selection handlers
  const handleSelectItem = (itemId, selected) => {
    if (selected) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleOpenItemDetail = (item, group) => {
    setItemDetailModal({ open: true, item, group });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcuts onShortcut={handleShortcut} />

      {/* View Switcher with action icons */}
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
          {/* Board Toolbar - Single consolidated row */}
          <BoardToolbar
            board={board}
            filters={filters}
            setFilters={setFilters}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            hideDone={hideDone}
            setHideDone={setHideDone}
            selectedPerson={selectedPerson}
            setSelectedPerson={setSelectedPerson}
            allPeople={allPeople}
            hiddenColumns={hiddenColumns}
            setHiddenColumns={setHiddenColumns}
            selectedItems={selectedItems}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
            onClearSelection={() => setSelectedItems([])}
            onAddItem={() =>
              board.groups.length > 0 && handleAddItem(board.groups[0].id)
            }
            onToggleExpandAll={handleToggleExpandAll}
            areAllExpanded={areAllExpanded()}
            onImport={handleImport}
          />

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
                    display: "grid",
                    gridTemplateColumns: `200px repeat(${visibleColumns.length}, minmax(150px, 1fr)) 100px`,
                  }}
                >
                  <div className="sticky left-0 z-20 bg-white border-r border-gray-200 px-4 py-3 flex items-center justify-center">
                    <span className="font-semibold text-gray-700">Item</span>
                  </div>
                  {visibleColumns.map((column) => (
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
                  {filteredAndSortedBoard.groups.map((group) => (
                    <div key={group.id}>
                      <Group
                        group={group}
                        columns={visibleColumns}
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
                        isCollapsed={
                          expandCollapseState.groups[group.id] === false
                        }
                        onToggleCollapse={() => {
                          const currentlyCollapsed =
                            expandCollapseState.groups[group.id] === false;
                          setExpandCollapseState((prev) => ({
                            ...prev,
                            groups: {
                              ...prev.groups,
                              [group.id]: currentlyCollapsed ? true : false,
                            },
                          }));
                        }}
                        itemExpandState={expandCollapseState.items}
                        onItemToggleExpand={(itemId, expanded) => {
                          setExpandCollapseState((prev) => ({
                            ...prev,
                            items: {
                              ...prev.items,
                              [itemId]: expanded,
                            },
                          }));
                        }}
                        onOpenUpdates={handleOpenUpdates}
                        selectedItems={selectedItems}
                        onSelectItem={handleSelectItem}
                        onOpenItemDetail={handleOpenItemDetail}
                      />
                      {/* Group Summary Row */}
                      {!expandCollapseState.groups[group.id] !== false &&
                        group.items.length > 0 && (
                          <GroupSummaryRow
                            group={group}
                            columns={board.columns}
                            hiddenColumns={hiddenColumns}
                          />
                        )}
                    </div>
                  ))}

                  {/* Add Group Button */}
                  <div
                    className="border-t border-gray-200 px-6 py-4"
                    style={{
                      gridColumn: `1 / span ${visibleColumns.length + 2}`,
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

      {/* Item Detail Modal */}
      <ItemDetailModal
        open={itemDetailModal.open}
        onOpenChange={(open) =>
          setItemDetailModal((prev) => ({ ...prev, open }))
        }
        item={itemDetailModal.item}
        group={itemDetailModal.group}
        columns={board.columns}
        onUpdateItem={handleUpdateItem}
        onUpdateColumn={handleUpdateColumn}
        onOpenUpdates={handleOpenUpdates}
      />
    </div>
  );
}
