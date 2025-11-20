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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
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

export function AppSidebar({
  boards,
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
                  <span className="truncate font-semibold">BTO Marketing</span>
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

          <div className="space-y-2">
            {boards.map((board, index) => (
              <div
                key={board.id}
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
                    <div className="flex items-center w-full h-full">
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
                              onReorderBoards &&
                              onReorderBoards(index, index - 1)
                            }
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={index === boards.length - 1}
                            onClick={() =>
                              onReorderBoards &&
                              onReorderBoards(index, index + 1)
                            }
                          >
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditBoard(board)}
                          >
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
            ))}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
