"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: isOrgLoading } =
    authClient.useActiveOrganization();
  const [mounted, setMounted] = useState(false);
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);

  // Check if user has an active organization
  useEffect(() => {
    if (session && !isOrgLoading && !activeOrg) {
      // User is authenticated but has no active organization
      router.push("/create-organization");
    }
  }, [session, activeOrg, isOrgLoading, router]);

  // Fetch boards from database
  useEffect(() => {
    if (activeOrg && session) {
      setIsLoadingBoards(true);

      // Fetch all data: boards, groups, items, subitems
      Promise.all([
        fetch("/api/boards").then((res) => res.json()),
        // We'll fetch groups, items, subitems for the first board initially
      ])
        .then(async ([boardsData]) => {
          if (boardsData.boards && boardsData.boards.length > 0) {
            // For each board, fetch its groups, items, and subitems
            const boardsWithData = await Promise.all(
              boardsData.boards.map(async (board) => {
                try {
                  // Fetch groups, items, and subitems in parallel
                  const [groupsRes, itemsRes, subitemsRes] = await Promise.all([
                    fetch(`/api/boards/${board.id}/groups`),
                    fetch(`/api/boards/${board.id}/items`),
                    fetch(`/api/boards/${board.id}/subitems`),
                  ]);

                  const groupsData = await groupsRes.json();
                  const itemsData = await itemsRes.json();
                  const subitemsData = await subitemsRes.json();

                  const groups = groupsData.groups || [];
                  const items = itemsData.items || [];
                  const subitems = subitemsData.subitems || [];

                  // Build the hierarchy: groups > items > subitems
                  const groupsWithItems = groups.map((group) => ({
                    ...group,
                    items: items
                      .filter((item) => item.groupId === group.id)
                      .map((item) => ({
                        ...item,
                        subitems: subitems.filter(
                          (subitem) => subitem.itemId === item.id
                        ),
                      })),
                  }));

                  return {
                    ...board,
                    groups: groupsWithItems,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching data for board ${board.id}:`,
                    error
                  );
                  return {
                    ...board,
                    groups: [],
                  };
                }
              })
            );

            setBoards(boardsWithData);

            // Always select the first board
            if (boardsWithData.length > 0) {
              setCurrentBoardId(boardsWithData[0].id);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching boards:", error);
        })
        .finally(() => {
          setIsLoadingBoards(false);
          setMounted(true);
        });
    }
  }, [activeOrg, session]);

  // No localStorage - board selection is ephemeral per session

  const currentBoard = boards.find((b) => b.id === currentBoardId);

  const handleAddBoard = async (name) => {
    try {
      const columns = DEFAULT_COLUMNS.map((col) => ({
        ...col,
        id: `${col.id}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${Date.now()}`,
      }));

      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, columns }),
      });

      const data = await response.json();
      if (data.board) {
        setBoards([...boards, data.board]);
        setCurrentBoardId(data.board.id);
      }
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const handleUpdateBoard = async (boardId, name) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.board) {
        setBoards(
          boards.map((board) => (board.id === boardId ? data.board : board))
        );
      }
    } catch (error) {
      console.error("Error updating board:", error);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      const updatedBoards = boards.filter((board) => board.id !== boardId);
      setBoards(updatedBoards);
      if (currentBoardId === boardId && updatedBoards.length > 0) {
        setCurrentBoardId(updatedBoards[0].id);
      } else if (updatedBoards.length === 0) {
        setCurrentBoardId(null);
      }
    } catch (error) {
      console.error("Error deleting board:", error);
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

  const handleBoardChange = async (updatedBoard) => {
    // Update local state immediately for responsive UI
    setBoards(
      boards.map((board) =>
        board.id === updatedBoard.id ? updatedBoard : board
      )
    );

    // TODO: Implement saving with new relational API endpoints
    // For now, changes are stored in memory only
    // Need to call individual endpoints for groups, items, subitems
    console.log("Board changed (not yet persisted to database):", {
      boardId: updatedBoard.id,
      groupCount: updatedBoard.groups?.length,
      columns: updatedBoard.columns?.length,
    });
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

  // Show loading state while checking organization or loading boards
  if (isOrgLoading || isLoadingBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // Don't render anything if no organization (will redirect)
  if (!activeOrg) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        boards={boards}
        currentBoardId={currentBoardId}
        onSelectBoard={handleSelectBoard}
        onAddBoard={handleAddBoard}
        onUpdateBoard={handleUpdateBoard}
        onDeleteBoard={handleDeleteBoard}
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
