"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Edit2,
  X,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function AppSidebar({
  boards = [],
  currentBoardId,
  onSelectBoard,
  onAddBoard,
  onUpdateBoard,
  onDeleteBoard,
  onReorderBoards,
  // Remove group management props
  // onAddGroup,
  // onUpdateGroup,
  // onDeleteGroup,
}) {
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [boardName, setBoardName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    onAddBoard(newBoardName.trim());
    toast.success("Board created");
    setNewBoardName("");
    setIsAddDialogOpen(false);
  };

  const handleEditBoard = (board) => {
    setEditingBoardId(board.id);
    setBoardName(board.name);
  };

  const handleSaveBoard = () => {
    if (boardName.trim()) {
      onUpdateBoard(editingBoardId, boardName);
      toast.success("Board renamed");
    }
    setEditingBoardId(null);
    setBoardName("");
  };

  const handleDeleteBoard = (boardId) => {
    if (confirm("Are you sure you want to delete this board?")) {
      onDeleteBoard(boardId);
      toast.success("Board deleted");
    }
  };

  const { data: activeOrg, isPending: isOrgLoading } =
    authClient.useActiveOrganization();

  if (!boards) {
    console.log("AppSidebar: boards is undefined");
  } else {
    console.log("AppSidebar: rendering with", boards.length, "boards");
  }

  // Handle drag end for board reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex((board) => board.id === active.id);
      const newIndex = boards.findIndex((board) => board.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && onReorderBoards) {
        onReorderBoards(oldIndex, newIndex);
      }
    }
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {isOrgLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <span className="truncate font-semibold">
                      {activeOrg?.name || "No Organization"}
                    </span>
                  )}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="space-y-4 px-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new board</DialogTitle>
                <DialogDescription>
                  Name your board. You can change this later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Board name
                </label>
                <Input
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateBoard();
                    }
                  }}
                  placeholder="e.g. Q4 2025 Planning"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setNewBoardName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={boards.map((board) => board.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {boards && boards.length > 0 ? (
                  boards.map((board, index) => (
                    <SortableBoard
                      key={board.id}
                      board={board}
                      index={index}
                      currentBoardId={currentBoardId}
                      editingBoardId={editingBoardId}
                      boardName={boardName}
                      setBoardName={setBoardName}
                      handleSaveBoard={handleSaveBoard}
                      setEditingBoardId={setEditingBoardId}
                      onSelectBoard={onSelectBoard}
                      handleEditBoard={handleEditBoard}
                      handleDeleteBoard={handleDeleteBoard}
                      onReorderBoards={onReorderBoards}
                      boardsLength={boards.length}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No boards yet. Click "Add Board" to create one!
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

// SortableBoard component for drag and drop
function SortableBoard({
  board,
  index,
  currentBoardId,
  editingBoardId,
  boardName,
  setBoardName,
  handleSaveBoard,
  setEditingBoardId,
  onSelectBoard,
  handleEditBoard,
  handleDeleteBoard,
  onReorderBoards,
  boardsLength,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border ${
        currentBoardId === board.id
          ? "bg-sidebar-accent border-sidebar-border"
          : "bg-sidebar-background border-sidebar-border"
      }`}
    >
      <div className="flex items-center justify-between">
        {editingBoardId === board.id ? (
          <div className="flex items-center gap-2 flex-1 h-full">
            <Input
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveBoard();
                if (e.key === "Escape") {
                  setEditingBoardId(null);
                  setBoardName("");
                }
              }}
              className="h-8 flex-1 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveBoard}
              className="h-8 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center w-full h-full gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing hover:bg-muted/50 p-1 rounded shrink-0"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => onSelectBoard(board.id)}
              className="flex-1 text-left text-sm font-medium text-sidebar-foreground hover:text-sidebar-foreground/80 h-full flex items-center"
              style={{ minHeight: "2rem" }}
            >
              {board.name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex items-center justify-center"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={index === 0}
                  onClick={() =>
                    onReorderBoards && onReorderBoards(index, index - 1)
                  }
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Move up
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === boardsLength - 1}
                  onClick={() =>
                    onReorderBoards && onReorderBoards(index, index + 1)
                  }
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditBoard(board)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteBoard(board.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {/* Group management and add group button removed as per instructions */}
    </div>
  );
}
