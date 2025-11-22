"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import {
  format,
  isToday,
  isTomorrow,
  parseISO,
  isBefore,
  startOfDay,
  addDays,
  isWithinInterval,
} from "date-fns";

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function DailyBriefView({ board, onSwitchToMain, onFocusItem }) {
  const [selectedPerson, setSelectedPerson] = useState("all");

  // Collect all items with dates and people assigned
  const tasksData = [];
  const today = startOfDay(new Date());
  const threeDaysFromNow = startOfDay(addDays(new Date(), 3));

  board.groups.forEach((group) => {
    group.items.forEach((item) => {
      // Find date and person columns
      const dateColumn = board.columns.find((col) => col.type === "date");
      const personColumn = board.columns.find((col) => col.type === "person");
      const statusColumn = board.columns.find((col) => col.type === "status");

      const dateValue = dateColumn
        ? item.columns[dateColumn.id]?.value
        : null;
      const people = personColumn
        ? item.columns[personColumn.id]?.value || []
        : [];
      const status = statusColumn
        ? item.columns[statusColumn.id]?.value
        : null;

      if (dateValue && Array.isArray(people) && people.length > 0) {
        const dueDate = parseISO(dateValue);
        const isDueInRange =
          isBefore(dueDate, today) ||
          isWithinInterval(dueDate, { start: today, end: threeDaysFromNow });

        if (isDueInRange) {
          people.forEach((person) => {
            tasksData.push({
              id: item.id,
              name: item.name,
              person: person,
              group: group,
              dueDate: dueDate,
              status: status,
              isOverdue: isBefore(dueDate, today) && !isToday(dueDate),
              isItem: true,
            });
          });
        }
      }

      // Also check subitems
      (item.subitems || []).forEach((subitem) => {
        const subDateValue = dateColumn
          ? subitem.columns?.[dateColumn.id]?.value
          : null;
        const subPeople = personColumn
          ? subitem.columns?.[personColumn.id]?.value || []
          : [];
        const subStatus = statusColumn
          ? subitem.columns?.[statusColumn.id]?.value
          : null;

        if (
          subDateValue &&
          Array.isArray(subPeople) &&
          subPeople.length > 0
        ) {
          const subDueDate = parseISO(subDateValue);
          const isDueInRange =
            isBefore(subDueDate, today) ||
            isWithinInterval(subDueDate, {
              start: today,
              end: threeDaysFromNow,
            });

          if (isDueInRange) {
            subPeople.forEach((person) => {
              tasksData.push({
                id: subitem.id,
                name: `${item.name} > ${subitem.name}`,
                person: person,
                group: group,
                parentItem: item,
                dueDate: subDueDate,
                status: subStatus,
                isOverdue:
                  isBefore(subDueDate, today) && !isToday(subDueDate),
                isItem: false,
              });
            });
          }
        }
      });
    });
  });

  // Filter by selected person
  const filteredTasks =
    selectedPerson === "all"
      ? tasksData
      : tasksData.filter((task) => task.person.id === selectedPerson);

  // Sort tasks by date
  filteredTasks.sort((a, b) => a.dueDate - b.dueDate);

  // Group tasks by date
  const tasksByDate = {};
  filteredTasks.forEach((task) => {
    const dateKey = format(task.dueDate, "yyyy-MM-dd");
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = {
        date: task.dueDate,
        tasks: [],
      };
    }
    tasksByDate[dateKey].tasks.push(task);
  });

  // Get all unique people for the filter
  const allPeopleMap = new Map();
  tasksData.forEach((task) => {
    if (!allPeopleMap.has(task.person.id)) {
      allPeopleMap.set(task.person.id, task.person);
    }
  });
  const allPeople = Array.from(allPeopleMap.values());

  const getDateLabel = (date) => {
    if (isBefore(date, today)) return "Overdue";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  const handleTaskClick = (task) => {
    // Switch back to main view
    if (onSwitchToMain) {
      onSwitchToMain();
    }
    // Focus on the item after a short delay to allow view switch
    setTimeout(() => {
      if (onFocusItem) {
        onFocusItem(task.group.id, task.isItem ? task.id : task.parentItem.id);
      }
    }, 100);
  };

  const dateGroups = Object.values(tasksByDate);

  if (dateGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <Calendar className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {selectedPerson === "all"
            ? "No upcoming tasks"
            : "No upcoming tasks for this person"}
        </h3>
        <p className="text-gray-500 max-w-md">
          There are no items or subitems with assigned people that are due in
          the next 3 days.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Daily Brief
          </h2>
          <p className="text-gray-600">
            Tasks due in the next 3 days, organized by date
          </p>
        </div>

        {/* Person Filter */}
        {allPeople.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by person:</span>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {allPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${person.color}`}
                      ></div>
                      {person.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {dateGroups.map(({ date, tasks }) => {
          const dateLabel = getDateLabel(date);
          const isOverdueSection = isBefore(date, today);

          return (
            <div key={format(date, "yyyy-MM-dd")}>
              {/* Date Header */}
              <div
                className={`
                sticky top-0 z-10 py-3 px-4 mb-3 rounded-lg
                ${
                  isOverdueSection
                    ? "bg-red-100 border-l-4 border-red-500"
                    : "bg-blue-50 border-l-4 border-blue-500"
                }
              `}
              >
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`h-5 w-5 ${
                      isOverdueSection ? "text-red-700" : "text-blue-700"
                    }`}
                  />
                  <h3
                    className={`text-lg font-semibold ${
                      isOverdueSection ? "text-red-900" : "text-blue-900"
                    }`}
                  >
                    {dateLabel}
                  </h3>
                  <Badge variant="secondary" className="ml-2">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                  </Badge>
                </div>
              </div>

              {/* Tasks List */}
              <div className="grid grid-cols-1 gap-3">
                {tasks.map((task) => (
                  <button
                    key={`${task.id}-${task.person.id}`}
                    onClick={() => handleTaskClick(task)}
                    className={`
                      text-left p-4 rounded-lg border transition-all
                      hover:shadow-md hover:scale-[1.02] cursor-pointer
                      ${
                        task.isOverdue
                          ? "border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                            <AvatarFallback
                              className={`${task.person.color} text-white text-xs`}
                            >
                              {getInitials(task.person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {task.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {task.person.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 ml-11">
                          <Badge variant="secondary" className="text-xs">
                            {task.group.title}
                          </Badge>
                          {task.status === "done" && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

