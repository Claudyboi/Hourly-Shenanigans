import Papa from 'papaparse';
import { embeddedRoster } from './roster';

export interface ProcessingResult {
  success: boolean;
  rowCount?: number;
  tsvData?: string;
  error?: string;
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

function getRoundedNowString() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:00:00`;
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

    processedRows.sort((a, b) => String(a['Updater name']).localeCompare(String(b['Updater name'])));

    const tsvString = Papa.unparse(processedRows, {
      delimiter: '\t',
      header: includeHeaders,
      columns: ['Updater name', 'Update - Date', 'Comments', 'Internal comments', 'Public comments', 'Tickets solved', 'Agent comments']
    });

    return { success: true, rowCount: processedRows.length, tsvData: tsvString };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processTimelogs(file: File, includeHeaders: boolean): Promise<ProcessingResult> {
  try {
    const data = await parseCSV(file);
    const roundedNow = getRoundedNowString();

    for (const row of data) {
      const logOutKey = 'Log Out' in row ? 'Log Out' : ('Logout' in row ? 'Logout' : 'End Time');
      const logoutVal = row[logOutKey];
      if (!logoutVal || String(logoutVal).trim() === '') {
        row[logOutKey] = roundedNow;
      }
    }

    data.sort((a, b) => {
      const rawDateA = String(a['Log In'] || a['Start Time'] || a['Date'] || '').trim();
      const rawDateB = String(b['Log In'] || b['Start Time'] || b['Date'] || '').trim();

      const dateA = new Date(rawDateA);
      const dateB = new Date(rawDateB);
      
      const dayA = isNaN(dateA.getTime()) ? rawDateA : `${dateA.getFullYear()}-${String(dateA.getMonth()+1).padStart(2, '0')}-${String(dateA.getDate()).padStart(2, '0')}`;
      const dayB = isNaN(dateB.getTime()) ? rawDateB : `${dateB.getFullYear()}-${String(dateB.getMonth()+1).padStart(2, '0')}-${String(dateB.getDate()).padStart(2, '0')}`;

      if (dayA !== dayB) {
        return dayA.localeCompare(dayB);
      }
      
      const nameA = String(a['Name'] || a['Employee Name'] || a['Employee'] || a['Agent Name'] || '').trim();
      const nameB = String(b['Name'] || b['Employee Name'] || b['Employee'] || b['Agent Name'] || '').trim();
      return nameA.localeCompare(nameB);
    });

    const tsvString = Papa.unparse(data, {
      delimiter: '\t',
      header: includeHeaders
    });

    return { success: true, rowCount: data.length, tsvData: tsvString };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processBreaklogs(file: File, includeHeaders: boolean): Promise<ProcessingResult> {
  try {
    const data = await parseCSV(file);
    const roundedNow = getRoundedNowString();

    for (const row of data) {
      const endVal = row['End'];
      if (!endVal || String(endVal).trim() === '') {
        row['End'] = roundedNow;
      }
    }

    data.sort((a, b) => {
      const rawDateA = String(a['Start'] || a['Date'] || '').trim();
      const rawDateB = String(b['Start'] || b['Date'] || '').trim();

      const dateA = new Date(rawDateA);
      const dateB = new Date(rawDateB);
      
      const dayA = isNaN(dateA.getTime()) ? rawDateA : `${dateA.getFullYear()}-${String(dateA.getMonth()+1).padStart(2, '0')}-${String(dateA.getDate()).padStart(2, '0')}`;
      const dayB = isNaN(dateB.getTime()) ? rawDateB : `${dateB.getFullYear()}-${String(dateB.getMonth()+1).padStart(2, '0')}-${String(dateB.getDate()).padStart(2, '0')}`;

      if (dayA !== dayB) {
        return dayA.localeCompare(dayB);
      }
      
      const nameA = String(a['Name'] || a['Employee Name'] || a['Employee'] || a['Agent Name'] || '').trim();
      const nameB = String(b['Name'] || b['Employee Name'] || b['Employee'] || b['Agent Name'] || '').trim();
      return nameA.localeCompare(nameB);
    });

    const tsvString = Papa.unparse(data, {
      delimiter: '\t',
      header: includeHeaders
    });

    return { success: true, rowCount: data.length, tsvData: tsvString };
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