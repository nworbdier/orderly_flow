"use client";

import { useState, useMemo } from "react";
import {
  Filter,
  ArrowUpDown,
  EyeOff,
  Eye,
  Users,
  CheckSquare,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_OPTIONS } from "@/lib/board-data";
import { ImportDialog } from "./ImportDialog";
import { cn } from "@/lib/utils";

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function BoardToolbar({
  board,
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  hideDone,
  setHideDone,
  selectedPerson,
  setSelectedPerson,
  allPeople,
  hiddenColumns,
  setHiddenColumns,
  selectedItems,
  onBulkDelete,
  onBulkStatusChange,
  onClearSelection,
  onAddItem,
  onToggleExpandAll,
  areAllExpanded,
  onImport,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.dateRange) count++;
    if (selectedPerson) count++;
    if (hideDone) count++;
    if (searchQuery) count++;
    return count;
  }, [filters, selectedPerson, hideDone, searchQuery]);

  // Get unique people from board
  const uniquePeople = useMemo(() => {
    const peopleMap = new Map();
    allPeople?.forEach((person) => {
      if (person?.name && !peopleMap.has(person.name)) {
        peopleMap.set(person.name, person);
      }
    });
    return Array.from(peopleMap.values());
  }, [allPeople]);

  const handleStatusFilterChange = (statusId, checked) => {
    const currentStatuses = filters.status || [];
    if (checked) {
      setFilters({ ...filters, status: [...currentStatuses, statusId] });
    } else {
      setFilters({
        ...filters,
        status: currentStatuses.filter((s) => s !== statusId),
      });
    }
  };

  const clearAllFilters = () => {
    setFilters({ status: [], dateRange: null, search: "" });
    setSelectedPerson(null);
    setHideDone(false);
    setSearchQuery("");
  };

  const handleSort = (columnId, direction) => {
    setSortConfig({ column: columnId, direction });
  };

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-background">
      {/* Left side - New Item + filters */}
      <div className="flex items-center gap-2">
        {/* New Item Button */}
        <Button onClick={onAddItem} size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          New Item
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Search */}
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFilters({ ...filters, search: e.target.value });
            }}
            placeholder="Search items..."
            className="h-8 w-40 pl-3 pr-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={() => {
                setSearchQuery("");
                setFilters({ ...filters, search: "" });
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Person Quick Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPerson ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
            >
              <Users className="h-4 w-4" />
              {selectedPerson ? (
                <>
                  <span className="max-w-[80px] truncate text-xs">
                    {selectedPerson.name}
                  </span>
                  <X
                    className="h-3 w-3 ml-0.5 hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPerson(null);
                    }}
                  />
                </>
              ) : (
                <span className="text-xs">Person</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Filter by Person
              </p>
              {uniquePeople.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-2">
                  No people assigned yet
                </p>
              ) : (
                uniquePeople.map((person) => (
                  <button
                    key={person.id || person.name}
                    onClick={() => setSelectedPerson(person)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
                      selectedPerson?.name === person.name && "bg-accent"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback
                        className={`${
                          person.color || "bg-blue-500"
                        } text-white text-[10px]`}
                      >
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{person.name}</span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeFilterCount > 0 ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs">Filter</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            {STATUS_OPTIONS.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.id}
                checked={(filters.status || []).includes(status.id)}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange(status.id, checked)
                }
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  {status.label || "No Status"}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={hideDone}
              onCheckedChange={setHideDone}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Hide completed items
            </DropdownMenuCheckboxItem>
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearAllFilters}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={sortConfig.column ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-xs">Sort</span>
              {sortConfig.column && (
                <span className="text-[10px] text-muted-foreground">
                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleSort("name", "asc")}>
              Name (A → Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("name", "desc")}>
              Name (Z → A)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {board.columns
              .filter((col) => ["date", "status", "text"].includes(col.type))
              .map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() =>
                    handleSort(
                      col.id,
                      sortConfig.direction === "asc" ? "desc" : "asc"
                    )
                  }
                >
                  {col.title}
                  {sortConfig.column === col.id && (
                    <span className="ml-auto">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            {sortConfig.column && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setSortConfig({ column: null, direction: "asc" })
                  }
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear sort
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hide/Show Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              {hiddenColumns.length > 0 ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="text-xs">Columns</span>
              {hiddenColumns.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 px-1 text-[10px]"
                >
                  {hiddenColumns.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start">
            <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
            {board.columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={!hiddenColumns.includes(col.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setHiddenColumns(
                      hiddenColumns.filter((id) => id !== col.id)
                    );
                  } else {
                    setHiddenColumns([...hiddenColumns, col.id]);
                  }
                }}
              >
                {col.title}
              </DropdownMenuCheckboxItem>
            ))}
            {hiddenColumns.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setHiddenColumns([])}>
                  <Eye className="h-4 w-4 mr-2" />
                  Show all columns
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side - Bulk actions OR expand/import */}
      {selectedItems.length > 0 ? (
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1">
          <span className="text-sm font-medium">
            {selectedItems.length} selected
          </span>

          {/* Bulk Status Change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                Set Status
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status.id}
                  onClick={() => onBulkStatusChange(status.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    {status.label || "No Status"}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="h-7"
            onClick={onBulkDelete}
          >
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Expand/Collapse All */}
          <Button
            onClick={onToggleExpandAll}
            variant="ghost"
            size="sm"
            className="h-8"
          >
            {areAllExpanded ? (
              <>
                <ChevronRight className="h-4 w-4 mr-1" />
                <span className="text-xs">Collapse All</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                <span className="text-xs">Expand All</span>
              </>
            )}
          </Button>

          {/* Import */}
          <ImportDialog onImport={onImport} />
        </div>
      )}
    </div>
  );
}
