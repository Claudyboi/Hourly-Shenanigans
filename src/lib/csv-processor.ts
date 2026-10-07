import Papa from 'papaparse';
import { embeddedRoster } from './roster';

export interface ProcessingResult {
  success: boolean;
  rowCount?: number;
  rawRowCount?: number;
  tsvData?: string;
  error?: string;
  rows?: Record<string, any>[];
  columns?: string[];
}

function parseCSV(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
        } else {
          resolve(results.data as Record<string, any>[]);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

function getRoundedEstNowString(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  });
  
  const parts = formatter.formatToParts(new Date());
  const p: Record<string, string> = {};
  parts.forEach(part => p[part.type] = part.value);
  // Format: DD MMM YYYY HH:00:00 (e.g. 03 Sep 2026 14:00:00)
  return `${p.day} ${p.month} ${p.year} ${p.hour}:00:00`;
}

export async function processZendesk(file: File, includeHeaders: boolean): Promise<ProcessingResult> {
  try {
    const data = await parseCSV(file);
    const emailToName = new Map<string, string>(Object.entries(embeddedRoster));
    const processedRows: Record<string, any>[] = [];

    for (const row of data) {
      const rawEmail = String(row['Updater email'] || '').toLowerCase().trim();
      
      if (rawEmail.includes('.e@getflex')) {
        const mappedName = emailToName.get(rawEmail) || rawEmail;
        processedRows.push({
          'Updater name': mappedName,
          'Update - Date': row['Update - Date'] || '',
          'Comments': row['Comments'] || '',
          'Internal comments': row['Internal comments'] || '',
          'Public comments': row['Public comments'] || '',
          'Tickets solved': row['Tickets solved'] || '',
          'Agent comments': row['Agent comments'] || ''
        });
      }
    }

    processedRows.sort((a, b) => {
      const dateA = new Date(a['Update - Date'] || 0).getTime();
      const dateB = new Date(b['Update - Date'] || 0).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      return String(a['Updater name']).localeCompare(String(b['Updater name']));
    });

    const columns = ['Updater name', 'Update - Date', 'Comments', 'Internal comments', 'Public comments', 'Tickets solved', 'Agent comments'];

    const tsvString = Papa.unparse(processedRows, {
      delimiter: '\t',
      header: includeHeaders,
      columns
    });

    return {
      success: true,
      rawRowCount: data.length,
      rowCount: processedRows.length,
      tsvData: tsvString,
      rows: processedRows,
      columns
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processTimelogs(
  file: File,
  includeHeaders: boolean,
  autoFillMissingEnd: boolean = true
): Promise<ProcessingResult> {
  try {
    const rawData = await parseCSV(file);
    if (!rawData.length) {
      throw new Error("File is empty or invalid.");
    }

    const targetColumns = [
      'Employee Number', 'Employee', 'Team', 'Account', 'Date',
      'Schedule (Start)', 'Schedule (End)', 'Working Hrs', 'Late',
      'Undertime', 'Absent', 'Lunch', 'Log In', 'Log Out',
      'Login Hours', 'Status', 'Dispute Note', 'Note',
      'Modified Time', 'Modified User', 'OT Filed', 'Error Checking'
    ];

    // Configuration dictionary of header aliases in order of priority
    const priorityAliases: Record<string, string[]> = {
      'Employee Number': ['employee number', 'emp id', 'emp no'],
      'Employee': ['employee', 'name', 'agent name', 'employee name'],
      'Team': ['team', 'department'],
      'Account': ['account', 'client'],
      'Date': ['date', 'log date'],
      'Schedule (Start)': ['schedule (start)', 'shift start'],
      'Schedule (End)': ['schedule (end)', 'shift end'],
      'Working Hrs': ['working hrs', 'working hours', 'hours'],
      'Late': ['late'],
      'Undertime': ['undertime'],
      'Absent': ['absent'],
      'Lunch': ['lunch', 'break'],
      'Log In': ['log in', 'login', 'start time'],
      'Log Out': ['log out', 'logout', 'end time'],
      'Login Hours': ['login hours'],
      'Status': ['status'],
      'Dispute Note': ['dispute note'],
      'Note': ['note', 'notes'],
      'Modified Time': ['modified time'],
      'Modified User': ['modified user'],
      'OT Filed': ['ot filed'],
      'Error Checking': ['error checking']
    };

    // Build header mapping from the first row
    const rawHeaders = Object.keys(rawData[0]);
    const headerMapping: Record<string, string> = {};
    
    // For each target column, find the first matching alias in the raw headers
    for (const targetKey of targetColumns) {
      const aliases = priorityAliases[targetKey] || [];
      for (const alias of aliases) {
        const matchedHeader = rawHeaders.find(h => h.toLowerCase().trim() === alias);
        if (matchedHeader) {
          headerMapping[matchedHeader] = targetKey;
          break; // Stop looking once we found the highest priority match
        }
      }
    }

    // Generate EST fallback time (rounded down to nearest hour)
    const estFallbackTime = getRoundedEstNowString();

    const processedData: Record<string, any>[] = [];

    for (const row of rawData) {
      const mappedRow: Record<string, any> = {};
      
      // Initialize with empty strings for all target columns
      targetColumns.forEach(tc => mappedRow[tc] = "");

      // Map values
      Object.keys(row).forEach(rawKey => {
        const targetKey = headerMapping[rawKey];
        if (targetKey) {
          mappedRow[targetKey] = row[rawKey] === null || row[rawKey] === undefined ? "" : String(row[rawKey]).trim();
        }
      });

      // Mandatory filtering: Skip if Log In is empty
      if (!mappedRow['Log In']) {
        continue;
      }

      // EST Time Injection for missing Log Out (only when autoFillMissingEnd is enabled)
      if (!mappedRow['Log Out']) {
        mappedRow['Log Out'] = autoFillMissingEnd ? estFallbackTime : "";
      }

      processedData.push(mappedRow);
    }

    // Sort: Primary by Date, Secondary by Employee
    processedData.sort((a, b) => {
      const dateA = new Date(a['Date'] || 0).getTime();
      const dateB = new Date(b['Date'] || 0).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      const empA = (a['Employee'] || "").toLowerCase();
      const empB = (b['Employee'] || "").toLowerCase();
      return empA.localeCompare(empB);
    });

    // Export as TSV enforcing target columns
    const tsvString = Papa.unparse(processedData, {
      delimiter: '\t',
      header: includeHeaders,
      columns: targetColumns
    });

    return {
      success: true,
      rawRowCount: rawData.length,
      rowCount: processedData.length,
      tsvData: tsvString,
      rows: processedData,
      columns: targetColumns
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processBreaklogs(
  file: File,
  includeHeaders: boolean,
  autoFillMissingEnd: boolean = true
): Promise<ProcessingResult> {
  try {
    const rawData = await parseCSV(file);
    if (!rawData.length) {
      throw new Error("File is empty or invalid.");
    }

    const estFallbackTime = getRoundedEstNowString();

    // 1. Mandatory filtering: Discard rows where Start time or Date is missing/empty
    const validRows: Record<string, any>[] = [];

    for (const row of rawData) {
      const startVal = row['Start'] || row['Start Time'] || row['Log In'] || row['Date'];
      if (!startVal || String(startVal).trim() === '') {
        continue;
      }

      // 2. Data Cleansing & EST Time Injection for missing End times
      const endKey = 'End' in row ? 'End' : ('End Time' in row ? 'End Time' : ('Log Out' in row ? 'Log Out' : 'End'));
      const endVal = row[endKey];
      if (!endVal || String(endVal).trim() === '') {
        row[endKey] = autoFillMissingEnd ? estFallbackTime : '';
      }

      validRows.push(row);
    }

    // 3. Sorting: Primary Chronological by Date, Secondary Alphabetical by Employee
    validRows.sort((a, b) => {
      const rawDateA = a['Date'] || a['Start'] || a['Start Time'] || 0;
      const rawDateB = b['Date'] || b['Start'] || b['Start Time'] || 0;

      const dateA = new Date(rawDateA).getTime();
      const dateB = new Date(rawDateB).getTime();
      
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateA - dateB;
      }
      
      const nameA = String(a['Employee'] || a['Name'] || a['Employee Name'] || a['Agent Name'] || '').toLowerCase().trim();
      const nameB = String(b['Employee'] || b['Name'] || b['Employee Name'] || b['Agent Name'] || '').toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

    const columns = validRows.length > 0 ? Object.keys(validRows[0]) : [];

    const tsvString = Papa.unparse(validRows, {
      delimiter: '\t',
      header: includeHeaders
    });

    return {
      success: true,
      rawRowCount: rawData.length,
      rowCount: validRows.length,
      tsvData: tsvString,
      rows: validRows,
      columns
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Transforms raw CSV logs into structured data mapped for pasting into Google Sheets starting at Column B.
 * 
 * Output Schema (Columns B through G):
 * 1. Column B: Updater email (Lowercase, sanitized email string)
 * 2. Column C: Update - Date (Date string exactly as in CSV or YYYY-MM-DD)
 * 3. Column D: Updater name (EMPTY string, reserved for Google Sheets lookup formula)
 * 4. Column E: Update - Hour (Integer hour: 0 to 23)
 * 5. Column F: Total Comments (Public comments + Internal comments)
 * 6. Column G: Public comments (Count of public comments)
 * (Internal comments - Column H is NOT included)
 * 
 * Aggregates by (Update - Date, Update - Hour, Updater email)
 * Sorts:
 * 1st: Update - Date ascending
 * 2nd: Update - Hour ascending
 * 3rd: Updater email alphabetically
 */
export async function processHourlyComments(
  file: File,
  includeHeaders: boolean
): Promise<ProcessingResult> {
  try {
    const rawData = await parseCSV(file);
    if (!rawData.length) {
      throw new Error("File is empty or invalid.");
    }

    const rawHeaders = Object.keys(rawData[0] || {});
    const findHeader = (candidates: string[]) => {
      return rawHeaders.find(h => candidates.includes(h.toLowerCase().trim())) || '';
    };

    const emailCol = findHeader(['updater email', 'email', 'agent email', 'user email']);
    const dateCol = findHeader(['update - date', 'update date', 'date', 'log date']);
    const hourCol = findHeader(['update - hour', 'update hour', 'hour']);
    const internalCol = findHeader(['internal comments', 'internal comment', 'internal']);
    const publicCol = findHeader(['public comments', 'public comment', 'public']);

    if (!emailCol || !dateCol || !hourCol) {
      throw new Error(
        `Missing required column(s). Found headers: [${rawHeaders.join(', ')}]. Expected 'Updater email', 'Update - Date', and 'Update - Hour'.`
      );
    }

    // Helper to sanitize date string to YYYY-MM-DD when possible
    const cleanDate = (val: any): string => {
      const s = String(val || '').trim();
      if (!s) return '';
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return s;
    };

    // Helper to parse clean integer count without decimals or NaN
    const parseCount = (val: any): number => {
      if (val === null || val === undefined) return 0;
      const cleaned = String(val).replace(/,/g, '').trim();
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : Math.max(0, num);
    };

    // Helper to parse clean integer hour (0 to 23)
    const parseHour = (val: any): number => {
      if (val === null || val === undefined) return 0;
      const cleaned = String(val).replace(/[^0-9]/g, '').trim();
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : Math.min(23, Math.max(0, num));
    };

    // Grouping by (Date, Hour, Email)
    const groupMap = new Map<string, {
      email: string;
      date: string;
      hour: number;
      internalComments: number;
      publicComments: number;
    }>();

    for (const row of rawData) {
      const rawEmail = String(row[emailCol] || '').toLowerCase().trim();
      const formattedDate = cleanDate(row[dateCol]);

      // Strictly limit to updater emails having .e@getflex.com
      if (!rawEmail || !formattedDate || !rawEmail.includes('.e@getflex.com')) {
        continue;
      }

      const hour = parseHour(row[hourCol]);
      const internal = internalCol ? parseCount(row[internalCol]) : 0;
      const pub = publicCol ? parseCount(row[publicCol]) : 0;

      const groupKey = `${formattedDate}___${hour}___${rawEmail}`;
      const existing = groupMap.get(groupKey);

      if (existing) {
        existing.internalComments += internal;
        existing.publicComments += pub;
      } else {
        groupMap.set(groupKey, {
          email: rawEmail,
          date: formattedDate,
          hour,
          internalComments: internal,
          publicComments: pub
        });
      }
    }

    // Transform into final 6-column structure: Columns B through G
    const processedRows = Array.from(groupMap.values()).map(g => {
      const total = g.publicComments + g.internalComments;
      return {
        'Updater email': g.email,
        'Update - Date': g.date,
        'Updater name': '', // Column D: blank string reserved for Google Sheets lookup formula
        'Update - Hour': g.hour,
        'Total Comments': total,
        'Public comments': g.publicComments
      };
    });

    // Primary Sorting Logic:
    // 1st by: Update - Date (Column C) ascending
    // 2nd by: Updater email (Column B) alphabetically
    // 3rd by: Update - Hour (Column E) ascending
    processedRows.sort((a, b) => {
      const timeA = new Date(a['Update - Date']).getTime();
      const timeB = new Date(b['Update - Date']).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
      const dateCompare = String(a['Update - Date']).localeCompare(String(b['Update - Date']));
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const emailCompare = a['Updater email'].localeCompare(b['Updater email']);
      if (emailCompare !== 0) {
        return emailCompare;
      }

      return a['Update - Hour'] - b['Update - Hour'];
    });

    const columns = [
      'Updater email',
      'Update - Date',
      'Updater name',
      'Update - Hour',
      'Total Comments',
      'Public comments'
    ];

    const tsvString = Papa.unparse(processedRows, {
      delimiter: '\t',
      header: includeHeaders,
      columns
    });

    return {
      success: true,
      rawRowCount: rawData.length,
      rowCount: processedRows.length,
      tsvData: tsvString,
      rows: processedRows,
      columns
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface HourlyData {
  time: string;
  queues: {
    normalOcr: number;
    priorityOcr: number;
    faNormal: number;
    faPriority: number;
    epf: number;
    moveIn: number;
    iv: number;
    disputes: number;
    p2p: number;
    controlCenter: number;
  };
}

export const processHourlyVolume = async (file: File): Promise<HourlyData> => {
  return new Promise((resolve, reject) => {
    // 1. Extract hour from filename (e.g., "export_14-00.csv" -> "14:00:00")
    const timeMatch = file.name.match(/(\d{1,2})[-_]?(\d{2})/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:00:00` 
      : `${new Date().getHours().toString().padStart(2, '0')}:00:00`; // Fallback to current hour

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) return reject(new Error("File is empty or invalid"));

        // Initialize queue counts at 0
        const queues = {
          normalOcr: 0, priorityOcr: 0, faNormal: 0, faPriority: 0,
          epf: 0, moveIn: 0, iv: 0, disputes: 0, p2p: 0, controlCenter: 0
        };

        const headers = data[0].map(h => h?.toLowerCase().trim());
        const queueIdx = headers.findIndex(h => h.includes('queue'));
        const ticketIdx = headers.findIndex(h => h.includes('tickets in queue') || h.includes('tickets'));

        if (queueIdx === -1 || ticketIdx === -1) {
          return reject(new Error("Could not find 'Queue' or 'Tickets in queue' columns."));
        }

        // Loop through rows and categorize
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[queueIdx] || !row[ticketIdx]) continue;

          const queueName = row[queueIdx].toLowerCase().trim();
          // Remove commas from numbers (e.g., "1,250" -> 1250)
          const count = parseInt(row[ticketIdx].replace(/,/g, ''), 10) || 0;

          // Fuzzy match logic
          if (queueName.includes('normal ocr')) queues.normalOcr += count;
          else if (queueName.includes('priority ocr')) queues.priorityOcr += count;
          else if (queueName.includes('flex anywhere normal') || queueName.includes('fa normal')) queues.faNormal += count;
          else if (queueName.includes('flex anywhere priority') || queueName.includes('fa priority')) queues.faPriority += count;
          else if (queueName.includes('epf')) queues.epf += count;
          else if (queueName.includes('move in')) queues.moveIn += count;
          else if (queueName.includes('income verification') || queueName.includes('iv')) queues.iv += count;
          else if (queueName.includes('disputes')) queues.disputes += count;
          else if (queueName.includes('p2p')) queues.p2p += count;
          else if (queueName.includes('control center')) queues.controlCenter += count;
        }

        resolve({ time, queues });
      },
      error: (error) => reject(error),
      header: false,
      skipEmptyLines: true
    });
  });
};