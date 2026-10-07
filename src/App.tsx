import { useState, useMemo, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Filter, 
  Clock, 
  HelpCircle, 
  Search, 
  Table, 
  FileText, 
  Maximize2, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  processZendesk, 
  processTimelogs, 
  processBreaklogs, 
  processHourlyComments,
  ProcessingResult 
} from './lib/csv-processor';
import VolumeExtractorWidget from './components/VolumeExtractorWidget';
import InstructionsTab from './components/InstructionsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sanitizer' | 'volumes' | 'guide'>('sanitizer');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [autoFillMissingEnd, setAutoFillMissingEnd] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1700px] mx-auto w-full space-y-5 flex flex-col h-[calc(100vh-2.5rem)] sm:h-[calc(100vh-3.5rem)]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Hourly Shenanigans
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Process Zendesk queues, clean logs, aggregate hourly comments, and format for Google Sheets.
              </p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-slate-800 p-1 rounded-lg gap-1">
              <button 
                onClick={() => setActiveTab('sanitizer')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'sanitizer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Filter size={16} /> Data Sanitizers (4)
              </button>
              <button 
                onClick={() => setActiveTab('volumes')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'volumes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Clock size={16} /> Hourly Volumes
              </button>
              <button 
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'guide' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <HelpCircle size={16} /> Guide
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'sanitizer' && (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            {/* Global Settings Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Default: Include Headers in TSV Outputs</span>
                </label>

                <div className="hidden sm:block h-4 w-px bg-slate-200" aria-hidden="true" />

                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={autoFillMissingEnd}
                    onChange={(e) => setAutoFillMissingEnd(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>
                    Auto-fill missing Logout/End times with EST hour{' '}
                    <span className="font-normal text-slate-500">(Timelogs & Breaklogs)</span>
                  </span>
                </label>
              </div>

              <div className="text-xs text-slate-500 hidden xl:flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Google Sheets format: Tab-delimited TSV</span>
              </div>
            </div>

            {/* 4 Sanitizer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5 flex-1 overflow-y-auto pb-4">
              <SanitizerSection 
                title="1. Zendesk TPH"
                badge="Tickets RD"
                description="Filters non-Flex agents, matches ZD Names, and exports comment columns."
                processFn={processZendesk}
                globalIncludeHeaders={includeHeaders}
                searchPlaceholder="Search agent or date..."
              />
              <SanitizerSection 
                title="2. Timelogs"
                badge="Timelogs"
                description={
                  autoFillMissingEnd
                    ? "Filters blank logins, fills missing 'Log Out' with EST, and sorts by date & employee."
                    : "Filters blank logins, keeps missing 'Log Out' blank, and sorts by date & employee."
                }
                processFn={processTimelogs}
                globalIncludeHeaders={includeHeaders}
                autoFillMissingEnd={autoFillMissingEnd}
                searchPlaceholder="Search employee name..."
              />
              <SanitizerSection 
                title="3. Breaklogs"
                badge="Breaklogs"
                description={
                  autoFillMissingEnd
                    ? "Filters blank starts, fills missing 'End' with EST, and sorts by date & employee."
                    : "Filters blank starts, keeps missing 'End' blank, and sorts by date & employee."
                }
                processFn={processBreaklogs}
                globalIncludeHeaders={includeHeaders}
                autoFillMissingEnd={autoFillMissingEnd}
                searchPlaceholder="Search employee name..."
              />
              <SanitizerSection 
                title="4. Hourly Comments"
                badge="Col B–G (Google Sheets)"
                description="Filters .e@getflex.com, sorts Date → Email → Hour. Formatted for Sheet Col B."
                processFn={processHourlyComments}
                globalIncludeHeaders={includeHeaders}
                isHourlyComments={true}
                searchPlaceholder="Search agent email..."
              />
            </div>
          </div>
        )}
        
        {activeTab === 'volumes' && (
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <VolumeExtractorWidget />
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="flex-1 min-h-0 pb-4">
            <InstructionsTab />
          </div>
        )}

      </div>
    </div>
  );
}

function SanitizerSection({
  title,
  badge,
  description,
  processFn,
  globalIncludeHeaders,
  autoFillMissingEnd,
  isHourlyComments,
  searchPlaceholder = "Filter records..."
}: {
  title: string;
  badge?: string;
  description: string;
  processFn: Function;
  globalIncludeHeaders: boolean;
  autoFillMissingEnd?: boolean;
  isHourlyComments?: boolean;
  searchPlaceholder?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [output, setOutput] = useState('');
  const [rows, setRows] = useState<Record<string, any>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rawCount, setRawCount] = useState<number | null>(null);
  const [logs, setLogs] = useState<{type: string, msg: string}[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Section-specific interactive controls
  const [viewMode, setViewMode] = useState<'table' | 'tsv'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [localIncludeHeaders, setLocalIncludeHeaders] = useState(globalIncludeHeaders);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync with global header change if user hasn't overridden
  useEffect(() => {
    setLocalIncludeHeaders(globalIncludeHeaders);
  }, [globalIncludeHeaders]);

  // Recalculate TSV string when localIncludeHeaders changes and rows exist
  useEffect(() => {
    if (rows && columns.length > 0) {
      const updatedTsv = Papa.unparse(rows, {
        delimiter: '\t',
        header: localIncludeHeaders,
        columns
      });
      setOutput(updatedTsv);
    }
  }, [localIncludeHeaders, rows, columns]);

  const addLog = (type: string, msg: string) => {
    setLogs(prev => [...prev, { type, msg }]);
  };

  const handleProcess = async () => {
    if (!file) {
      addLog('ERROR', 'No file selected.');
      return;
    }
    
    setLogs([]);
    setStatus('processing');
    addLog('INFO', `Processing ${file.name}...`);
    if (typeof autoFillMissingEnd === 'boolean') {
      addLog(
        'INFO',
        autoFillMissingEnd
          ? 'Missing Logout/End times: Auto-filling with current EST hour.'
          : 'Missing Logout/End times: Keeping blank.'
      );
    }

    const result = await processFn(file, localIncludeHeaders, autoFillMissingEnd);

    if (result.success) {
      setStatus('success');
      setOutput(result.tsvData || '');
      setRows(result.rows || null);
      setColumns(result.columns || []);
      setRawCount(result.rawRowCount ?? null);
      setViewMode('table');
      addLog('OK', `Success! Generated ${result.rowCount} rows.`);
    } else {
      setStatus('error');
      addLog('ERROR', result.error);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered rows for interactive preview table
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();
    return rows.filter(row => {
      return Object.values(row).some(val => 
        String(val ?? '').toLowerCase().includes(term)
      );
    });
  }, [rows, searchTerm]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden transition-shadow hover:shadow-md">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-800">{title}</h2>
              {badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          </div>
          {rows && (
            <button 
              onClick={() => setIsExpanded(true)}
              title="Expand table preview"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
          
          {/* Upload Dropzone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center relative cursor-pointer transition-colors select-none ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50/70' 
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
            onClick={() => document.getElementById(`file-${title}`)?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.length) {
                setFile(e.dataTransfer.files[0]);
                setStatus('idle');
                setOutput('');
                setRows(null);
              }
            }}
          >
            <input 
              type="file" 
              id={`file-${title}`}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setFile(e.target.files[0]);
                  setStatus('idle');
                  setOutput('');
                  setRows(null);
                }
              }}
            />
            <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-indigo-500 mb-1.5" />
            <span className="text-xs sm:text-sm font-bold text-slate-700">Choose or Drop CSV</span>
            <span className="text-xs text-slate-500 mt-0.5 max-w-[220px] truncate">
              {file ? file.name : 'No file selected'}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleProcess}
              disabled={!file || status === 'processing'}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {status === 'processing' ? 'Processing...' : 'Process File'}
            </button>
          </div>

          {/* Console Logs */}
          {logs.length > 0 && status !== 'success' && (
            <div className="bg-slate-900 rounded-lg p-3 h-20 overflow-y-auto font-mono text-[11px] shrink-0">
              {logs.map((log, i) => (
                <div key={i} className="mb-0.5">
                  <span className={
                    log.type === 'INFO' ? 'text-blue-400 font-semibold' :
                    log.type === 'OK' ? 'text-green-400 font-semibold' :
                    'text-red-400 font-semibold'
                  }>[{log.type}]</span> <span className="text-slate-300">{log.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success Dashboard & Preview */}
          {status === 'success' && (
            <div className="flex flex-col gap-2 flex-1 min-h-[220px] overflow-hidden">
              
              {/* Summary Stats Banner */}
              <div className="flex flex-wrap items-center justify-between text-xs bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">
                  {rawCount ? `Processed ${rawCount} raw rows → ` : ''}
                  <strong className="text-slate-900 font-bold">{rows?.length || 0}</strong> records
                </span>
                
                {/* Header Mode Toggle for this card */}
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={localIncludeHeaders}
                    onChange={(e) => setLocalIncludeHeaders(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                  />
                  <span>Headers</span>
                </label>
              </div>

              {/* View Mode & Copy Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                      viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Table size={13} /> Table
                  </button>
                  <button 
                    onClick={() => setViewMode('tsv')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                      viewMode === 'tsv' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText size={13} /> TSV
                  </button>
                </div>

                <button 
                  onClick={handleCopy}
                  className={`text-xs flex items-center gap-1 font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy Data for Google Sheets</>
                  )}
                </button>
              </div>

              {/* View Content */}
              {viewMode === 'table' && rows ? (
                <div className="flex flex-col flex-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  {/* Search Bar */}
                  <div className="p-2 border-b border-slate-200 bg-white flex items-center gap-2">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Scrollable Data Table Preview */}
                  <div className="flex-1 overflow-auto max-h-[220px]">
                    <PreviewTable 
                      rows={filteredRows} 
                      columns={columns} 
                      isHourlyComments={isHourlyComments} 
                    />
                  </div>
                  
                  {/* Table Footer */}
                  <div className="bg-white px-3 py-1 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                    <span>Showing {filteredRows.length} of {rows.length} rows</span>
                    <button 
                      onClick={() => setIsExpanded(true)} 
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      Open Full View
                    </button>
                  </div>
                </div>
              ) : (
                /* Raw TSV View */
                <textarea 
                  value={output} 
                  readOnly 
                  className="w-full flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[10px] resize-none whitespace-pre focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal for Fullscreen Table Inspection */}
      {isExpanded && rows && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  {title} <span className="text-xs font-normal text-slate-500">(Google Sheets Preview)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredRows.length} of {rows.length} formatted records. Click copy to paste directly into Google Sheets.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCopy}
                  className={`text-xs flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? <><Check size={14} /> Copied to Clipboard!</> : <><Copy size={14} /> Copy Data for Google Sheets</>}
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Search Toolbar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Search size={15} className="text-slate-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full text-xs bg-transparent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={localIncludeHeaders}
                    onChange={(e) => setLocalIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span>Include Headers in Output</span>
                </label>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <PreviewTable 
                  rows={filteredRows} 
                  columns={columns} 
                  isHourlyComments={isHourlyComments} 
                  isModal={true}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>{localIncludeHeaders ? "Headers included in TSV copy." : "Data only (formatted for pasting into cell B2)."}</span>
              <button 
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewTable({ 
  rows, 
  columns, 
  isHourlyComments,
  isModal = false 
}: { 
  rows: Record<string, any>[]; 
  columns: string[]; 
  isHourlyComments?: boolean;
  isModal?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No records match your search criteria.
      </div>
    );
  }

  // Column letters for Columns B through G
  const colLetterMap: Record<number, string> = {
    0: 'Col B',
    1: 'Col C',
    2: 'Col D',
    3: 'Col E',
    4: 'Col F',
    5: 'Col G'
  };

  return (
    <table className="w-full text-left border-collapse text-[11px] font-sans">
      <thead>
        <tr className="bg-slate-100/90 text-slate-700 sticky top-0 border-b border-slate-200 z-10 shadow-xs">
          <th className="py-2 px-2.5 font-bold text-slate-400 w-10 text-center">#</th>
          {columns.map((col, idx) => (
            <th key={col} className="py-2 px-2.5 font-bold whitespace-nowrap">
              {isHourlyComments && colLetterMap[idx] && (
                <span className="block text-[9px] font-mono text-indigo-600 font-semibold uppercase">
                  {colLetterMap[idx]}
                </span>
              )}
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx} className="hover:bg-indigo-50/40 transition-colors">
            <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-400 select-none">
              {rowIdx + 1}
            </td>
            {columns.map((col) => {
              const val = row[col];
              const isColD = isHourlyComments && col === 'Updater name';
              return (
                <td 
                  key={col} 
                  className={`py-1.5 px-2.5 whitespace-nowrap text-slate-700 ${
                    typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && !String(val).includes('-') && !String(val).includes('@'))
                      ? 'font-mono tabular-nums'
                      : ''
                  }`}
                >
                  {isColD && !val ? (
                    <span className="text-slate-300 italic text-[10px] select-none">(blank for formula)</span>
                  ) : val !== undefined && val !== null && val !== '' ? (
                    String(val)
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
