import * as XLSX from 'xlsx';

/**
 * Parse a Monday.com Excel export file and convert it to our board format
 * @param {File} file - The Excel file to parse
 * @returns {Promise<{groups: Array, columns: Array}>} Parsed board data
 */
export async function parseMondayExport(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Parse the structure
        const result = parseMondayStructure(jsonData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse the Monday.com export structure
 * Monday.com exports have a specific structure:
 * - Board name row
 * - Group name rows
 * - Header row: ["Name", "Subitems", "Column1", "Column2", ...]
 * - Item rows with data
 * - If item has subitems:
 *   - Subitems header row: ["Subitems", "Name", "Owner", "Due Date", ...]
 *   - Subitem detail rows
 */
function parseMondayStructure(data) {
  if (!data || data.length === 0) {
    return { groups: [], columns: [] };
  }
  
  const groups = [];
  let currentGroup = null;
  let currentItem = null;
  let itemCounter = 0;
  let mainHeaders = [];
  let mainColumns = [];
  let subitemHeaders = [];
  let subitemColumns = [];
  let inSubitemsSection = false;
  let headerRowFound = false; // Track if we've found the main header row
  let groupBeforeHeader = null; // Track group that appeared before header
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const firstCell = String(row[0] || '').trim();
    
    // Check if this is a main header row (has "Name" as first column)
    if (firstCell === 'Name' && String(row[1] || '').trim() === 'Subitems') {
      mainHeaders = row;
      mainColumns = [];
      inSubitemsSection = false;
      headerRowFound = true; // Mark that we've found the header
      
      // If we found a group before the header, add it now
      if (groupBeforeHeader) {
        groups.push(groupBeforeHeader);
        currentGroup = groupBeforeHeader;
        groupBeforeHeader = null;
      }
      
      // Create columns from headers (skip "Name" and "Subitems")
      for (let j = 2; j < mainHeaders.length; j++) {
        const headerTitle = String(mainHeaders[j] || '').trim();
        if (headerTitle && 
            headerTitle.toLowerCase() !== 'item id (auto generated)' &&
            headerTitle !== '') {
          mainColumns.push({
            id: `col-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${j}`,
            title: headerTitle,
            type: inferColumnType(headerTitle),
          });
        }
      }
      continue;
    }
    
    // If we haven't found the header yet, check if this might be a group name
    if (!headerRowFound) {
      // Check if this looks like a group (single value, rest empty)
      if (firstCell) {
        let nonEmptyCells = 0;
        for (let k = 1; k < row.length; k++) {
          if (row[k] !== null && row[k] !== undefined && row[k] !== '') {
            nonEmptyCells++;
          }
        }
        if (nonEmptyCells < 2) {
          // This is likely the group name that comes before the header
          groupBeforeHeader = {
            id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${groups.length}`,
            title: firstCell,
            items: [],
          };
        }
      }
      continue;
    }
    
    // Check if this is a subitems header row
    if (firstCell === 'Subitems' && String(row[1] || '').trim() === 'Name') {
      subitemHeaders = row;
      subitemColumns = [];
      inSubitemsSection = true;
      
      // Create columns from subitem headers (skip "Subitems" and "Name")
      for (let j = 2; j < subitemHeaders.length; j++) {
        const headerTitle = String(subitemHeaders[j] || '').trim();
        if (headerTitle && 
            headerTitle.toLowerCase() !== 'item id (auto generated)' &&
            headerTitle !== '') {
          subitemColumns.push({
            id: `col-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${j}`,
            title: headerTitle,
            type: inferColumnType(headerTitle),
          });
        }
      }
      continue;
    }
    
    // Check if this is a group row (all empty except first cell)
    // But exclude rows that have an Item ID in the last few columns (those are items)
    const hasItemId = row[row.length - 2] || row[row.length - 3]; // Check last few columns for Item ID
    
    if (firstCell && isLikelyGroupRow(row) && !hasItemId) {
      currentGroup = {
        id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${groups.length}`,
        title: firstCell,
        items: [],
      };
      groups.push(currentGroup);
      currentItem = null;
      inSubitemsSection = false;
      continue;
    }
    
    // If we're in subitems section and first cell is empty, parse as subitem
    if (inSubitemsSection && currentItem && !firstCell && row[1]) {
      // Subitem row (first cell is empty, name is in second cell)
      const subitemName = String(row[1] || '').trim();
      if (!subitemName) continue;
      
      const subitem = {
        id: `subitem-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${itemCounter++}`,
        name: subitemName,
        columns: {},
      };
      
      // Map subitem column values
      for (let j = 0; j < subitemColumns.length && j + 2 < row.length; j++) {
        const column = subitemColumns[j];
        const value = row[j + 2] || '';
        subitem.columns[column.id] = {
          type: column.type,
          value: parseColumnValue(value, column.type),
        };
      }
      
      currentItem.subitems.push(subitem);
      continue;
    }
    
    // Otherwise, this is a regular item row
    if (firstCell && mainHeaders.length > 0) {
      if (!currentGroup) {
        currentGroup = {
          id: `group-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-default`,
          title: 'Imported Items',
          items: [],
        };
        groups.push(currentGroup);
      }
      
      const item = {
        id: `item-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${itemCounter++}`,
        name: firstCell,
        subitems: [],
        columns: {},
      };
      
      // Map main item column values (skip "Name" and "Subitems" columns)
      for (let j = 0; j < mainColumns.length && j + 2 < row.length; j++) {
        const column = mainColumns[j];
        const value = row[j + 2] || '';
        item.columns[column.id] = {
          type: column.type,
          value: parseColumnValue(value, column.type),
        };
      }
      
      currentGroup.items.push(item);
      currentItem = item;
      inSubitemsSection = false;
    }
  }
  
  // Merge main columns and subitem columns (remove duplicates)
  const allColumnTitles = new Set(mainColumns.map(col => col.title.toLowerCase()));
  const uniqueSubitemColumns = subitemColumns.filter(
    col => !allColumnTitles.has(col.title.toLowerCase())
  );
  
  const mergedColumns = [...mainColumns, ...uniqueSubitemColumns];
  
  return { groups, columns: mergedColumns };
}

/**
 * Check if a row is likely a group header
 */
function isLikelyGroupRow(row) {
  // A group row typically has:
  // - A name in the first column
  // - Empty or very few cells filled after that
  const firstCell = row[0];
  if (!firstCell) return false;
  
  // Count non-empty cells after the first
  let nonEmptyCells = 0;
  for (let i = 1; i < row.length; i++) {
    if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
      nonEmptyCells++;
    }
  }
  
  // If less than 2 cells are filled after the first, it's likely a group
  return nonEmptyCells < 2;
}


/**
 * Infer column type from header name
 */
function inferColumnType(header) {
  const lowerHeader = header.toLowerCase();
  
  if (lowerHeader === 'status') return 'status';
  if (lowerHeader === 'person' || lowerHeader === 'owner') return 'person';
  if (lowerHeader === 'date' || lowerHeader === 'due date' || lowerHeader === 'send date') return 'date';
  if (lowerHeader === 'priority') return 'priority';
  if (lowerHeader === 'timeline') return 'timeline';
  if (lowerHeader === 'files' || lowerHeader === 'file') return 'files';
  if (lowerHeader === 'link' || lowerHeader === 'url') return 'link';
  if (lowerHeader.includes('time tracker') || lowerHeader.includes('time tracking')) return 'time_tracker';
  
  // Check for partial matches as fallback
  if (lowerHeader.includes('status')) return 'status';
  if (lowerHeader.includes('person') || lowerHeader.includes('owner')) return 'person';
  if (lowerHeader.includes('date') || lowerHeader.includes('due')) return 'date';
  if (lowerHeader.includes('priority')) return 'priority';
  if (lowerHeader.includes('timeline')) return 'timeline';
  if (lowerHeader.includes('file') || lowerHeader.includes('attachment')) return 'files';
  if (lowerHeader.includes('link') || lowerHeader.includes('url')) return 'link';
  if (lowerHeader.includes('number') || lowerHeader.includes('count')) return 'number';
  if (lowerHeader.includes('time')) return 'time_tracker';
  
  // Default to text
  return 'text';
}

/**
 * Parse column value based on type
 */
function parseColumnValue(value, type) {
  if (value === null || value === undefined || value === '') {
    // Return appropriate empty value for type
    if (type === 'files' || type === 'person') return [];
    if (type === 'time_tracker') return { totalSeconds: 0, isRunning: false, startTime: null };
    return '';
  }
  
  switch (type) {
    case 'date':
      // Try to parse date
      try {
        if (typeof value === 'number') {
          // Excel date serial number
          const date = XLSX.SSF.parse_date_code(value);
          return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
        return value;
      } catch {
        return value;
      }
    
    case 'person':
      // Parse comma-separated names and create person objects
      if (typeof value === 'string' && value.trim()) {
        const colors = [
          'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
          'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
          'bg-teal-500', 'bg-cyan-500'
        ];
        
        return value.split(',').map((name, index) => {
          const trimmedName = name.trim();
          if (!trimmedName) return null;
          return {
            id: `person-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            name: trimmedName,
            color: colors[index % colors.length]
          };
        }).filter(Boolean);
      }
      return [];
    
    case 'files':
      // Parse comma-separated file URLs
      if (typeof value === 'string' && value.includes('http')) {
        return value.split(',').map(url => url.trim()).filter(Boolean);
      }
      return [];
    
    case 'link':
      // Return the URL as a string
      return String(value);
    
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    
    case 'time_tracker':
      return { totalSeconds: 0, isRunning: false, startTime: null };
    
    default:
      return String(value);
  }
}

