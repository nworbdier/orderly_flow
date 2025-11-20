# Excel Import Guide

## Overview
The Excel Import feature allows you to import boards from Monday.com exports directly into Orderly Flow.

## How to Use

1. **Export from Monday.com**
   - Go to your Monday.com board
   - Click the three-dot menu in the top right
   - Select "Export board to Excel"
   - Download the .xlsx file

2. **Import to Orderly Flow**
   - Open your board in Orderly Flow
   - Click the "Import" button in the top right corner
   - Drag and drop your Excel file or click to browse
   - Wait for the import to complete

## What Gets Imported

### ✅ Supported
- **Groups**: All groups with their names
- **Items**: All items within each group
- **Subitems**: Subitems are properly nested under their parent items
- **Columns**: Column types are auto-detected based on header names:
  - **Person** - Detects "Person", "Owner" columns
  - **Date** - Detects "Date", "Due Date" columns
  - **Status** - Detects "Status" columns
  - **Files** - Detects "Files", "File" columns (imports URLs)
  - **Link** - Detects "Link", "URL" columns
  - **Time Tracker** - Detects time-related columns
  - **Text** - Default for unrecognized columns

### 🚫 Excluded
- **Name Column**: The "Name" column is not imported as a separate column (it's used for item names)
- **Subitems Column**: The "Subitems" column is not imported (subitems are nested structures)
- **Item ID (auto generated)**: Monday.com's internal IDs are not imported
- **Board Name Row**: The first row with board name is automatically skipped

### ⚠️ Limitations
- **Files/Attachments**: Cannot be imported (Excel doesn't contain the actual files)
- **Time Tracker**: Will be reset to 0 on import
- **Custom Column Types**: Will be imported as text columns

## Import Behavior

- **Merging**: Imported data is added to your existing board
- **Columns**: New columns are added; existing columns with the same name are reused
- **Groups**: Imported groups are added after existing groups
- **IDs**: All imported items get new unique IDs

## Tips

- The first row of the Excel file should contain column headers
- Group rows typically have only the group name in the first column
- Make sure your Excel file is from a recent Monday.com export
- Large files may take a few seconds to process

## Troubleshooting

**Error: "No data found in the file"**
- Check that the Excel file contains data
- Ensure it's a valid Monday.com export

**Error: "Failed to parse the Excel file"**
- Make sure the file isn't corrupted
- Try exporting from Monday.com again
- Check that it's a .xlsx or .xls file

**Columns not appearing correctly**
- Column types are auto-detected based on the header name
- You can manually change column types after import

## Example Excel Structure

Monday.com exports follow this structure:

```
| Name         | Subitems    | Person     | Status     | Date       |
|------------- |-------------|------------|------------|------------|
| Group 1      |             |            |            |            |
| Task 1       | Sub1, Sub2  | John       | In Progress| 2025-01-15 |
| Subitems     | Name        | Owner      | Status     | Due Date   |
|              | Sub1        | John       | Done       | 2025-01-10 |
|              | Sub2        | Jane       | Working    | 2025-01-12 |
| Task 2       |             | Bob        | Done       | 2025-01-10 |
```

**Key Points:**
- First column is "Name" (for items), second is "Subitems" (list of subitem names)
- When an item has subitems, there's a "Subitems" header row followed by subitem detail rows
- Subitem rows have empty first column, name in second column
- Group rows have only the group name in first column, rest empty

