import { useState, useCallback, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Copy, Check, Filter, Clock, HelpCircle } from 'lucide-react';
import { processZendesk, processTimelogs, processBreaklogs } from './lib/csv-processor';
import VolumeExtractorWidget from './components/VolumeExtractorWidget';
import InstructionsTab from './components/InstructionsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sanitizer' | 'volumes' | 'guide'>('sanitizer');
  const [includeHeaders, setIncludeHeaders] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Hourly Shenanigans
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Process Zendesk queues, handle timestamps, and track agent volumes.
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
                <Filter size={16} /> Data Sanitizers
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
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                Include Headers in TSV Outputs
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-4">
              <SanitizerSection 
                title="1. Zendesk TPH"
                description="Filters out non-Flex agents, matches ZD Names, and exports specific columns."
                processFn={processZendesk}
                includeHeaders={includeHeaders}
              />
              <SanitizerSection 
                title="2. Timelogs"
                description="Fills missing 'Log Out' times with the current system time (rounded down)."
                processFn={processTimelogs}
                includeHeaders={includeHeaders}
              />
              <SanitizerSection 
                title="3. Breaklogs"
                description="Fills missing 'End' times with the current system time (rounded down)."
                processFn={processBreaklogs}
                includeHeaders={includeHeaders}
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

function SanitizerSection({ title, description, processFn, includeHeaders }: { title: string, description: string, processFn: Function, includeHeaders: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [output, setOutput] = useState('');
  const [logs, setLogs] = useState<{type: string, msg: string}[]>([]);
  const [copied, setCopied] = useState(false);

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

    const result = await processFn(file, includeHeaders);

    if (result.success) {
      setStatus('success');
      setOutput(result.tsvData);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <h2 className="font-bold text-lg text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 relative group cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
          onClick={() => document.getElementById(`file-${title}`)?.click()}
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
              }
            }}
          />
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2" />
          <span className="text-sm font-bold text-slate-700">Choose CSV File</span>
          <span className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{file ? file.name : 'No file selected'}</span>
        </div>

        <button 
          onClick={handleProcess}
          disabled={!file || status === 'processing'}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {status === 'processing' ? 'Processing...' : 'Process File'}
        </button>

        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-3 h-24 overflow-y-auto font-mono text-[11px]">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className={
                  log.type === 'INFO' ? 'text-blue-400' :
                  log.type === 'OK' ? 'text-green-400' :
                  'text-red-400'
                }>[{log.type}]</span> <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
          </div>
        )}

        {output && (
          <div className="flex flex-col gap-2 flex-1 min-h-[200px] mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output TSV</span>
              <button 
                onClick={handleCopy}
                className="text-xs flex items-center gap-1 font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                {copied ? <><Check className="w-3 h-3 text-green-600"/> Copied</> : <><Copy className="w-3 h-3"/> Copy</>}
              </button>
            </div>
            <textarea 
              value={output} 
              readOnly 
              className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[10px] resize-none whitespace-pre focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>
    </div>
  );
}
