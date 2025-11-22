import { useState, useEffect } from "react";

export function useUpdateCount(boardId, itemId, itemType = "item") {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!boardId || !itemId || !itemType) {
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        const response = await fetch(
          `/api/updates?boardId=${boardId}&itemId=${itemId}&itemType=${itemType}`
        );
        if (!response.ok) throw new Error("Failed to fetch updates");

        const data = await response.json();
        setCount(data.updates?.length || 0);
      } catch (error) {
        console.error("Error fetching update count:", error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [boardId, itemId, itemType, refreshTrigger]);

  const refresh = () => setRefreshTrigger((prev) => prev + 1);

  return { count, isLoading, refresh };
}
