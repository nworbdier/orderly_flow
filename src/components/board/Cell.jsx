"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { STATUS_OPTIONS } from "@/lib/board-data";
import {
  Link2,
  File,
  X,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { useUpdateCount } from "@/hooks/use-updates";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export function Cell({
  item,
  column,
  value,
  onUpdate,
  isEditing,
  allItems,
  allPeople,
  orgMembers,
  onOpenUpdates,
  boardId,
  onPersonAdded,
  itemType = "item", // "item" or "subitem"
}) {
  const handleChange = (newValue) => {
    onUpdate(newValue);
  };

  const renderCell = () => {
    switch (column.type) {
      case "item":
        // Item column - can link to other items
        const itemOptions = allItems?.filter((i) => i.id !== item.id) || [];
        return (
          <Select
            value={value || "none"}
            onValueChange={(newValue) =>
              handleChange(newValue === "none" ? "" : newValue)
            }
          >
            <SelectTrigger className="h-8 border-0 focus:ring-0 bg-transparent w-full text-center justify-center">
              <SelectValue
                placeholder="Select item..."
                className="text-center"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-center">
                None
              </SelectItem>
              {itemOptions.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  className="text-center"
                >
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "person":
        return (
          <PersonCell
            value={value}
            onChange={handleChange}
            allPeople={allPeople}
            orgMembers={orgMembers}
            boardId={boardId}
            onPersonAdded={onPersonAdded}
          />
        );

      case "status":
        const statusOption =
          STATUS_OPTIONS.find((opt) => opt.id === value) || STATUS_OPTIONS[0];
        return (
          <Select value={value || "none"} onValueChange={handleChange}>
            <SelectTrigger
              className={`h-8 border-0 focus:ring-0 w-full ${statusOption.color} text-black hover:opacity-90 [&>svg]:hidden justify-center text-center`}
            >
              <SelectValue className="text-black font-bold text-center">
                {statusOption.label || "\u00A0"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  className="text-center"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div
                      className={`w-3 h-3 rounded-full ${option.color}`}
                    ></div>
                    {option.label || "No Status"}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        const dateValue = value ? parseISO(value) : undefined;
        const formatDate = (date) => {
          if (!date) return "Pick a date";
          const currentYear = new Date().getFullYear();
          const dateYear = date.getFullYear();
          // Show year only if it's not the current year
          return dateYear === currentYear
            ? format(date, "MMM d")
            : format(date, "MMM d, yyyy");
        };
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-full justify-center text-center font-normal border-0 hover:bg-transparent px-2"
              >
                {value ? formatDate(dateValue) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  if (date) {
                    handleChange(format(date, "yyyy-MM-dd"));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "files":
        const files = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1 items-center justify-center w-full">
            {files.map((file, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <File className="h-3 w-3" />
                {file.name || file}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => {
                    const newFiles = files.filter((_, i) => i !== idx);
                    handleChange(newFiles);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = (e) => {
                  const newFiles = Array.from(e.target.files).map((f) => ({
                    name: f.name,
                    size: f.size,
                  }));
                  handleChange([...files, ...newFiles]);
                };
                input.click();
              }}
            >
              <File className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        );

      case "link":
        return (
          <div className="flex items-center justify-center gap-2 w-full">
            <Link2 className="h-4 w-4 text-gray-400" />
            <Input
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 bg-transparent flex-1 text-center"
              placeholder="https://..."
              type="url"
            />
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Open
              </a>
            )}
          </div>
        );

      case "time_tracker":
        return <TimeTrackerCell value={value} onChange={handleChange} />;

      case "updates":
        return (
          <UpdatesCell
            item={item}
            boardId={boardId}
            itemType={itemType}
            onOpenUpdates={onOpenUpdates}
          />
        );

      default:
        return (
          <div className="w-full flex justify-center">
            <Input
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 bg-transparent text-center"
              placeholder="Add text..."
            />
          </div>
        );
    }
  };

  return (
    <div
      className="border-r border-gray-200 px-4 py-3 min-w-[150px] text-center flex items-center"
      style={column.width ? { width: column.width } : undefined}
    >
      <div className="flex items-center justify-center w-full">
        {renderCell()}
      </div>
    </div>
  );
}

// Helper functions for PersonCell
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRandomColor = () => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// PersonCell component for handling multiple people
function PersonCell({ value, onChange, allPeople = [], orgMembers = [], boardId, onPersonAdded }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [people, setPeople] = useState(() => {
    // Handle both old string format and new array format
    if (!value) return [];
    if (typeof value === "string") {
      return value
        ? [{ id: Date.now().toString(), name: value, color: getRandomColor() }]
        : [];
    }
    return Array.isArray(value) ? value : [];
  });
  const [newPersonName, setNewPersonName] = useState("");

  // Derive suggested people from allPeople that are also org members
  const selectedNames = new Set(people.map((p) => p.name));
  const selectedEmails = new Set(people.map((p) => p.email?.toLowerCase()).filter(Boolean));
  
  // Create a map of org members by email for quick lookup
  const orgMemberMap = new Map();
  orgMembers.forEach((m) => {
    if (m.userEmail) {
      orgMemberMap.set(m.userEmail.toLowerCase(), m);
    }
  });
  
  // Get people from allPeople that match org members
  const peopleFromAllPeople = Array.isArray(allPeople) && allPeople.length > 0
    ? allPeople.filter((p) => {
        if (!p?.name || selectedNames.has(p.name)) return false;
        const personEmail = p.email?.toLowerCase();
        return personEmail && orgMemberMap.has(personEmail);
      })
    : [];
  
  // Get org members that aren't already in allPeople or selected
  const orgMembersNotInPeople = orgMembers
    .filter((m) => {
      if (!m.userName || !m.userEmail) return false;
      const email = m.userEmail.toLowerCase();
      const name = m.userName.toLowerCase();
      // Skip if already selected
      if (selectedNames.has(m.userName) || selectedEmails.has(email)) return false;
      // Skip if already in allPeople
      const existsInAllPeople = allPeople?.some(
        (p) => p.email?.toLowerCase() === email || p.name?.toLowerCase() === name
      );
      return !existsInAllPeople;
    })
    .map((m) => ({
      id: `org-member-${m.userId}`,
      name: m.userName,
      email: m.userEmail,
      color: getRandomColor(),
      isOrgMember: true, // Flag to indicate this is from org, not saved person yet
    }));
  
  // Combine both sources
  const suggestedPeople = [...peopleFromAllPeople, ...orgMembersNotInPeople];

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;

    // Check if the person name matches an organization member
    const matchingMember = orgMembers.find(
      (m) => m.userName?.toLowerCase() === newPersonName.trim().toLowerCase()
    );

    if (!matchingMember) {
      toast.error("Only organization members can be added as people");
      return;
    }

    const personId = `person-${Date.now()}`;
    const newPerson = {
      id: personId,
      name: newPersonName.trim(),
      email: matchingMember.userEmail,
      color: getRandomColor(),
    };

    console.log("Adding person to database:", newPerson, "boardId:", boardId);

    // Save to database
    try {
      const response = await fetch(`/api/boards/${boardId}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save person:", error);
        toast.error(`Failed to save person: ${error.details || error.error}`);
        return;
      }

      const savedPerson = await response.json();
      console.log("Person saved successfully:", savedPerson);

      // Refresh the people list
      if (onPersonAdded) {
        await onPersonAdded();
      }

      // Update local state with saved person
      const updatedPeople = [...people, savedPerson];
      setPeople(updatedPeople);
      onChange(updatedPeople);
      setNewPersonName("");
      
      toast.success("Person added and saved!");
    } catch (error) {
      console.error("Error saving person:", error);
      toast.error("Failed to save person");
    }
  };

  const handleDeletePerson = (personId) => {
    const updatedPeople = people.filter((p) => p.id !== personId);
    setPeople(updatedPeople);
    onChange(updatedPeople);
  };

  const handleEditPerson = (personId, newName) => {
    const updatedPeople = people.map((p) =>
      p.id === personId ? { ...p, name: newName } : p
    );
    setPeople(updatedPeople);
    onChange(updatedPeople);
  };

  const handleSelectSuggestedPerson = async (person) => {
    if (!person || !person.name || selectedNames.has(person.name)) return;
    
    // If this is an org member that hasn't been saved yet, save it first
    if (person.isOrgMember) {
      try {
        const response = await fetch(`/api/boards/${boardId}/people`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: person.id,
            name: person.name,
            email: person.email,
            color: person.color,
          }),
        });

        if (response.ok) {
          const savedPerson = await response.json();
          // Refresh the people list
          if (onPersonAdded) {
            await onPersonAdded();
          }
          const updated = [...people, savedPerson];
          setPeople(updated);
          onChange(updated);
          toast.success("Person added!");
        } else {
          toast.error("Failed to save person");
        }
      } catch (error) {
        console.error("Error saving person:", error);
        toast.error("Failed to save person");
      }
    } else {
      // Already saved person, just add to selection
      const updated = [...people, person];
      setPeople(updated);
      onChange(updated);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 hover:opacity-80">
            {people.length === 0 ? (
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Plus className="h-4 w-4" />
                Add person
              </div>
            ) : (
              <div className="flex -space-x-2">
                {people.slice(0, 3).map((person) => (
                  <Avatar
                    key={person.id}
                    className="h-8 w-8 border-2 border-white"
                  >
                    <AvatarFallback
                      className={`${person.color} text-white text-xs`}
                    >
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {people.length > 3 && (
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                      +{people.length - 3}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage People</DialogTitle>
            <DialogDescription>
              Add, edit, or remove people assigned to this item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Suggested people */}
            {suggestedPeople.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  Suggested people
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPeople.map((person) => (
                    <button
                      key={person.id ?? person.name}
                      type="button"
                      onClick={() => handleSelectSuggestedPerson(person)}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          className={`${
                            person.color ?? getRandomColor()
                          } text-white text-[10px]`}
                        >
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{person.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of current people */}
            <div className="space-y-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${person.color} text-white`}>
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    value={person.name}
                    onChange={(e) =>
                      handleEditPerson(person.id, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePerson(person.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new person */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Input
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPerson();
                  }
                }}
                placeholder="Add a new person..."
                className="flex-1"
              />
              <Button
                onClick={handleAddPerson}
                disabled={!newPersonName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// TimeTrackerCell component for tracking time
function TimeTrackerCell({ value, onChange }) {
  const [timeData, setTimeData] = useState(() => {
    if (!value || typeof value !== "object") {
      return { totalSeconds: 0, isRunning: false, startTime: null };
    }
    return value;
  });
  const [displayTime, setDisplayTime] = useState(timeData.totalSeconds);

  // Update display time every second when running
  useEffect(() => {
    if (!timeData.isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timeData.startTime) / 1000);
      setDisplayTime(timeData.totalSeconds + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeData.isRunning, timeData.startTime, timeData.totalSeconds]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    const newTimeData = {
      ...timeData,
      isRunning: true,
      startTime: Date.now(),
    };
    setTimeData(newTimeData);
    onChange(newTimeData);
  };

  const handleStop = () => {
    const elapsed = Math.floor((Date.now() - timeData.startTime) / 1000);
    const newTimeData = {
      totalSeconds: timeData.totalSeconds + elapsed,
      isRunning: false,
      startTime: null,
    };
    setTimeData(newTimeData);
    setDisplayTime(newTimeData.totalSeconds);
    onChange(newTimeData);
  };

  const handleReset = () => {
    const newTimeData = {
      totalSeconds: 0,
      isRunning: false,
      startTime: null,
    };
    setTimeData(newTimeData);
    setDisplayTime(0);
    onChange(newTimeData);
  };

  return (
    <div className="w-full flex items-center justify-center gap-2">
      <div className="text-sm font-mono font-medium min-w-[80px]">
        {formatTime(displayTime)}
      </div>
      <div className="flex gap-1">
        {!timeData.isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStart}
            className="h-7 w-7 p-0 hover:bg-green-100"
          >
            <Play className="h-4 w-4 text-green-600" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            className="h-7 w-7 p-0 hover:bg-red-100"
          >
            <Pause className="h-4 w-4 text-red-600" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 w-7 p-0 hover:bg-gray-100"
          disabled={displayTime === 0}
        >
          <RotateCcw className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    </div>
  );
}

// UpdatesCell component for displaying update count
function UpdatesCell({ item, boardId, itemType = "item", onOpenUpdates }) {
  const { count, isLoading, refresh } = useUpdateCount(boardId, item.id, itemType);

  // Listen for update changes and refresh count
  useEffect(() => {
    const handleUpdatesChanged = (event) => {
      const { boardId: changedBoardId, itemId: changedItemId, itemType: changedItemType } = event.detail;
      if (changedBoardId === boardId && changedItemId === item.id && changedItemType === itemType) {
        refresh();
      }
    };

    window.addEventListener('updatesChanged', handleUpdatesChanged);
    return () => window.removeEventListener('updatesChanged', handleUpdatesChanged);
  }, [boardId, item.id, itemType, refresh]);

  return (
    <Button
      variant="ghost"
      className="h-8 w-full hover:bg-muted/50 flex items-center justify-center gap-2 relative"
      onClick={() => onOpenUpdates && onOpenUpdates(item)}
      disabled={isLoading}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      {!isLoading && count > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full bg-blue-500 text-white"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}
