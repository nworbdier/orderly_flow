// Board data structure and initial state

export const COLUMN_TYPES = {
  TEXT: "text",
  PERSON: "person",
  STATUS: "status",
  DATE: "date",
  FILES: "files",
  LINK: "link",
  TIME_TRACKER: "time_tracker",
  UPDATES: "updates",
};

export const STATUS_OPTIONS = [
  { id: "none", label: "", color: "bg-gray-300" },
  { id: "working", label: "Working on it", color: "bg-yellow-500" },
  { id: "stuck", label: "Stuck", color: "bg-red-500" },
  { id: "done", label: "Done", color: "bg-green-500" },
  { id: "new", label: "New", color: "bg-blue-500" },
];

// Default columns for new boards
export const DEFAULT_COLUMNS = [
  { id: "col-person", title: "Person", type: COLUMN_TYPES.PERSON },
  { id: "col-updates", title: "Updates", type: COLUMN_TYPES.UPDATES },
  { id: "col-status", title: "Status", type: COLUMN_TYPES.STATUS },
  { id: "col-date", title: "Date", type: COLUMN_TYPES.DATE },
  { id: "col-files", title: "Files", type: COLUMN_TYPES.FILES },
  { id: "col-link", title: "Link", type: COLUMN_TYPES.LINK },
  { id: "col-time", title: "Time Tracker", type: COLUMN_TYPES.TIME_TRACKER },
];

// Create initial boards data
export function createInitialBoards() {
  return [
    {
      id: "board-1",
      name: "My First Board",
      groups: [
        {
          id: "group-1",
          title: "Group 1",
          items: [
            {
              id: "item-1",
              name: "Task 1",
              subitems: [],
              columns: {
                "col-2": {
                  type: COLUMN_TYPES.PERSON,
                  value: [{ id: "1", name: "John Doe", color: "bg-blue-500" }],
                },
                "col-3": { type: COLUMN_TYPES.STATUS, value: "working" },
                "col-4": {
                  type: COLUMN_TYPES.DATE,
                  value: new Date().toISOString().split("T")[0],
                },
                "col-5": { type: COLUMN_TYPES.FILES, value: [] },
                "col-6": {
                  type: COLUMN_TYPES.LINK,
                  value: "https://example.com",
                },
                "col-7": {
                  type: COLUMN_TYPES.TIME_TRACKER,
                  value: { totalSeconds: 0, isRunning: false, startTime: null },
                },
              },
            },
            {
              id: "item-2",
              name: "Task 2",
              subitems: [],
              columns: {
                "col-2": {
                  type: COLUMN_TYPES.PERSON,
                  value: [
                    { id: "2", name: "Jane Smith", color: "bg-purple-500" },
                    { id: "3", name: "Bob Johnson", color: "bg-green-500" },
                  ],
                },
                "col-3": { type: COLUMN_TYPES.STATUS, value: "done" },
                "col-4": {
                  type: COLUMN_TYPES.DATE,
                  value: new Date().toISOString().split("T")[0],
                },
                "col-5": { type: COLUMN_TYPES.FILES, value: [] },
                "col-6": { type: COLUMN_TYPES.LINK, value: "" },
                "col-7": {
                  type: COLUMN_TYPES.TIME_TRACKER,
                  value: { totalSeconds: 0, isRunning: false, startTime: null },
                },
              },
            },
          ],
        },
      ],
      columns: [
        { id: "col-2", title: "Person", type: COLUMN_TYPES.PERSON },
        { id: "col-3", title: "Status", type: COLUMN_TYPES.STATUS },
        { id: "col-4", title: "Date", type: COLUMN_TYPES.DATE },
        { id: "col-5", title: "Files", type: COLUMN_TYPES.FILES },
        { id: "col-6", title: "Link", type: COLUMN_TYPES.LINK },
        { id: "col-7", title: "Time Tracker", type: COLUMN_TYPES.TIME_TRACKER },
      ],
    },
  ];
}
