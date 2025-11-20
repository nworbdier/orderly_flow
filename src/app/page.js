"use client";

import { useState, useEffect } from "react";
import { Board } from "@/components/board/Board";
import { AppSidebar } from "@/components/Sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  createInitialBoards,
  COLUMN_TYPES,
  DEFAULT_COLUMNS,
} from "@/lib/board-data";

const STORAGE_KEY = "orderly_flow_boards";
const CURRENT_BOARD_KEY = "orderly_flow_current_board";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [boards, setBoards] = useState(createInitialBoards());
  const [currentBoardId, setCurrentBoardId] = useState(null);

  // Load from localStorage only after mounting (client-side only)
  useEffect(() => {
    setMounted(true);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedBoards = JSON.parse(saved);
        setBoards(parsedBoards);

        const savedBoardId = localStorage.getItem(CURRENT_BOARD_KEY);
        setCurrentBoardId(savedBoardId || parsedBoards[0]?.id || null);
      } catch (e) {
        console.error("Failed to parse saved boards:", e);
        setCurrentBoardId(boards[0]?.id || null);
      }
    } else {
      setCurrentBoardId(boards[0]?.id || null);
    }
  }, []);

  // Save boards to localStorage whenever they change (only after mounting)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    }
  }, [boards, mounted]);

  // Save current board ID to localStorage whenever it changes (only after mounting)
  useEffect(() => {
    if (mounted && currentBoardId) {
      localStorage.setItem(CURRENT_BOARD_KEY, currentBoardId);
    }
  }, [currentBoardId, mounted]);

  const currentBoard = boards.find((b) => b.id === currentBoardId);

  const handleAddBoard = (name) => {
    const newBoard = {
      id: `board-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      name,
      groups: [],
      columns: DEFAULT_COLUMNS.map((col) => ({
        ...col,
        id: `${col.id}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${Date.now()}`,
      })),
    };
    setBoards([...boards, newBoard]);
    setCurrentBoardId(newBoard.id);
  };

  const handleUpdateBoard = (boardId, name) => {
    setBoards(
      boards.map((board) => (board.id === boardId ? { ...board, name } : board))
    );
  };

  const handleDeleteBoard = (boardId) => {
    const updatedBoards = boards.filter((board) => board.id !== boardId);
    setBoards(updatedBoards);
    if (currentBoardId === boardId && updatedBoards.length > 0) {
      setCurrentBoardId(updatedBoards[0].id);
    } else if (updatedBoards.length === 0) {
      setCurrentBoardId(null);
    }
  };

  const handleSelectBoard = (boardId) => {
    setCurrentBoardId(boardId);
  };

  const handleAddGroup = (title) => {
    if (!currentBoard) return;
    const newGroup = {
      id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      title,
      items: [],
    };
    setBoards(
      boards.map((board) =>
        board.id === currentBoardId
          ? { ...board, groups: [...board.groups, newGroup] }
          : board
      )
    );
  };

  const handleUpdateGroup = (groupId, title) => {
    if (!currentBoard) return;
    setBoards(
      boards.map((board) =>
        board.id === currentBoardId
          ? {
              ...board,
              groups: board.groups.map((group) =>
                group.id === groupId ? { ...group, title } : group
              ),
            }
          : board
      )
    );
  };

  const handleDeleteGroup = (groupId) => {
    if (!currentBoard) return;
    setBoards(
      boards.map((board) =>
        board.id === currentBoardId
          ? {
              ...board,
              groups: board.groups.filter((group) => group.id !== groupId),
            }
          : board
      )
    );
  };

  const handleBoardChange = (updatedBoard) => {
    setBoards(
      boards.map((board) =>
        board.id === updatedBoard.id ? updatedBoard : board
      )
    );
  };

  const handleReorderBoards = (fromIndex, toIndex) => {
    setBoards((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar
        boards={boards}
        currentBoardId={currentBoardId}
        onSelectBoard={handleSelectBoard}
        onAddBoard={handleAddBoard}
        onUpdateBoard={handleUpdateBoard}
        onDeleteBoard={handleDeleteBoard}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onReorderBoards={handleReorderBoards}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {currentBoard ? (
              <h1 className="text-xl font-semibold text-foreground">
                {currentBoard.name}
              </h1>
            ) : (
              <h1 className="text-xl font-semibold text-foreground">
                Orderly Flow
              </h1>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!currentBoard ? (
            <div className="bg-muted/50 flex-1 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  No boards available
                </h2>
                <p className="text-muted-foreground mb-4">
                  Create a new board to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 flex-1 rounded-2xl overflow-hidden">
              <Board
                key={currentBoardId}
                initialBoard={currentBoard}
                onBoardChange={handleBoardChange}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
