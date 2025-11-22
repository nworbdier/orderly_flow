"use client";

import { useState, useEffect } from "react";
import { X, Send, MessageSquare, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UpdatesSidebar({
  item,
  itemType,
  boardId,
  parentGroup,
  parentItem,
  onClose,
  onUpdateCountChange,
}) {
  const { data: session } = useSession();
  const [newUpdate, setNewUpdate] = useState("");
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState(null);

  // Fetch updates when sidebar opens
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!boardId || !item.id || !itemType) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/updates?boardId=${boardId}&itemId=${item.id}&itemType=${itemType}`
        );
        if (!response.ok) throw new Error("Failed to fetch updates");

        const data = await response.json();
        setUpdates(data.updates || []);
        if (onUpdateCountChange) {
          onUpdateCountChange(data.updates?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching updates:", error);
        toast.error("Failed to load updates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdates();
  }, [boardId, item.id, itemType, onUpdateCountChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim() || !session || isPosting) return;

    try {
      setIsPosting(true);
      const response = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          itemId: item.id,
          itemType,
          message: newUpdate.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to post update");

      const data = await response.json();
      const updatedList = [...updates, data.update];
      setUpdates(updatedList);
      setNewUpdate("");
      if (onUpdateCountChange) {
        onUpdateCountChange(updatedList.length);
      }
      // Dispatch custom event to refresh all update counts
      window.dispatchEvent(new CustomEvent('updatesChanged', { 
        detail: { boardId, itemId: item.id, itemType } 
      }));
      toast.success("Update posted");
    } catch (error) {
      console.error("Error posting update:", error);
      toast.error("Failed to post update");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteUpdate = async () => {
    if (!updateToDelete) return;

    try {
      const response = await fetch(
        `/api/updates?updateId=${updateToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete update");

      const updatedList = updates.filter((u) => u.id !== updateToDelete.id);
      setUpdates(updatedList);
      if (onUpdateCountChange) {
        onUpdateCountChange(updatedList.length);
      }
      // Dispatch custom event to refresh all update counts
      window.dispatchEvent(new CustomEvent('updatesChanged', { 
        detail: { boardId, itemId: item.id, itemType } 
      }));
      toast.success("Update deleted");
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("Failed to delete update");
    } finally {
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-background border-l border-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MessageSquare className="h-4 w-4" />
              {itemType === "item" && parentGroup && (
                <span>{parentGroup.title}</span>
              )}
              {itemType === "subitem" && parentGroup && parentItem && (
                <>
                  <span>{parentGroup.title}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{parentItem.name}</span>
                </>
              )}
              {itemType === "group" && (
                <span className="capitalize">{itemType}</span>
              )}
            </div>
            {/* Item/Group Title */}
            <h2 className="text-2xl font-semibold text-foreground">
              {item.name || item.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Item metadata */}
        <div className="space-y-2 text-sm">
          {item.columns && (
            <>
              {Object.entries(item.columns).map(([colId, colData]) => {
                if (colData.type === "status" && colData.value) {
                  return (
                    <div key={colId} className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">
                        {colData.value.replace("_", " ")}
                      </span>
                    </div>
                  );
                }
                if (colData.type === "person" && colData.value?.length > 0) {
                  return (
                    <div key={colId} className="flex items-center gap-2">
                      <span className="text-muted-foreground">People:</span>
                      <span className="font-medium">
                        {colData.value.map((p) => p.name).join(", ")}
                      </span>
                    </div>
                  );
                }
                if (colData.type === "date" && colData.value) {
                  return (
                    <div key={colId} className="flex items-center gap-2">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{colData.value}</span>
                    </div>
                  );
                }
                return null;
              })}
            </>
          )}
        </div>
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">
              Loading updates...
            </div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No updates yet</p>
            <p className="text-xs mt-1">Be the first to add an update</p>
          </div>
        ) : (
          updates
            .slice()
            .reverse()
            .map((update) => (
              <div
                key={update.id}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {update.authorName[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{update.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(update.createdAt)}
                      </p>
                    </div>
                  </div>
                  {session && session.user.id === update.authorId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setUpdateToDelete(update);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{update.message}</p>
              </div>
            ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Write an update..."
              className="w-full min-h-[100px] p-3 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!session}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newUpdate.trim() || !session || isPosting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPosting ? "Posting..." : "Post Update"}
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this update? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUpdate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
