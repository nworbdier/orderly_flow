"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Group } from "./Group";
import { ColumnHeader } from "./ColumnHeader";
import { ImportDialog } from "./ImportDialog";

export function Board({ initialBoard, onBoardChange }) {
  const [board, setBoard] = useState(initialBoard);
  const [editingItem, setEditingItem] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  // Start with all items collapsed by default
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const updateBoard = (newBoard) => {
    setBoard(newBoard);
    if (onBoardChange) {
      onBoardChange(newBoard);
    }
  };

  const handleAddItem = (groupId) => {
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

    updateBoard({
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId
          ? { ...group, items: [...group.items, newItem] }
          : group
      ),
    });
    setEditingItem(newItem.id);
    toast.success("Item added");
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      title: "New Group",
      items: [],
    };
    updateBoard({
      ...board,
      groups: [...board.groups, newGroup],
    });
    toast.success("Group added");
  };

  const handleUpdateItem = (groupId, itemId, field, value) => {
    updateBoard({
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
    });
  };

  const handleUpdateColumn = (itemId, columnId, value) => {
    updateBoard({
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
    });
  };

  const handleDeleteItem = (groupId, itemId) => {
    updateBoard({
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.filter((item) => item.id !== itemId),
            }
          : group
      ),
    });
    toast.success("Item deleted");
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

  const handleUpdateGroupTitle = (groupId, title) => {
    updateBoard({
      ...board,
      groups: board.groups.map((group) =>
        group.id === groupId ? { ...group, title } : group
      ),
    });
  };

  const handleDeleteGroup = (groupId) => {
    updateBoard({
      ...board,
      groups: board.groups.filter((group) => group.id !== groupId),
    });
    toast.success("Group deleted");
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
  const allPeopleMap = new Map();
  board.groups.forEach((group) => {
    group.items.forEach((item) => {
      Object.values(item.columns || {}).forEach((col) => {
        if (col?.type === "person" && Array.isArray(col.value)) {
          col.value.forEach((person) => {
            if (person?.name && !allPeopleMap.has(person.name)) {
              allPeopleMap.set(person.name, person);
            }
          });
        }
      });
    });
  });
  const allPeople = Array.from(allPeopleMap.values());

  const handleCollapseAll = () => {
    setAllExpanded(false);
  };

  const handleExpandAll = () => {
    setAllExpanded(true);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Board Actions Bar */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-border">
        <Button
          onClick={allExpanded ? handleCollapseAll : handleExpandAll}
          variant="outline"
          size="sm"
        >
          {allExpanded ? (
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
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 bg-white border-r border-gray-200 px-4 py-3 text-center min-w-[200px]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold text-gray-700">Item</span>
                  </div>
                </th>
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
                <th className="bg-white border-l border-gray-200 px-4 py-3">
                  <Button
                    onClick={handleAddColumn}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {board.groups.map((group) => {
                return (
                  <Group
                    key={group.id}
                    group={group}
                    columns={board.columns}
                    allItems={allItems}
                    allPeople={allPeople}
                    onAddItem={() => handleAddItem(group.id)}
                    onUpdateItem={handleUpdateItem}
                    onUpdateColumn={handleUpdateColumn}
                    onDeleteItem={handleDeleteItem}
                    onUpdateGroupTitle={handleUpdateGroupTitle}
                    onDeleteGroup={handleDeleteGroup}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    allExpanded={allExpanded}
                  />
                );
              })}
              <tr>
                <td
                  colSpan={board.columns.length + 2}
                  className="border-t border-gray-200 px-6 py-4"
                >
                  <Button onClick={handleAddGroup} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Group
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
