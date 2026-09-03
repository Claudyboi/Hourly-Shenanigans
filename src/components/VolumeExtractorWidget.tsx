import React, { useState } from 'react';
import { UploadCloud, Copy, Trash2, Check } from 'lucide-react';
import { processHourlyVolume, HourlyData } from '../lib/csv-processor';

export default function VolumeExtractorWidget() {
  const [data, setData] = useState<HourlyData[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await processHourlyVolume(file);
      // Replace existing data instead of appending
      setData([parsedData]);
    } catch (error) {
      alert("Error parsing file. Check format.");
    }
    e.target.value = ''; // Reset input
  };

  const handleCopy = async () => {
    if (data.length === 0) return;
    
    // Format as Tab-Separated Values (TSV) for easy spreadsheet pasting
    const tsvString = data.map(row => {
      const q = row.queues;
      return `${row.time}\t${q.normalOcr}\t${q.priorityOcr}\t${q.faNormal}\t${q.faPriority}\t${q.epf}\t${q.moveIn}\t${q.iv}\t${q.disputes}\t${q.p2p}\t${q.controlCenter}`;
    }).join('\n');

    await navigator.clipboard.writeText(tsvString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Hourly Volume Extractor</h2>
          <p className="text-xs text-slate-500 mt-1">Uploads Zendesk queue exports and extracts volumes for tracking.</p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {data.length > 0 && (
            <button onClick={() => setData([])} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={18} />
            </button>
          )}
          <button 
            onClick={handleCopy} 
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {isCopied ? 'Copied!' : 'Copy Data'}
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors mb-6 group">
        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2" />
        <span className="text-sm font-bold text-slate-700">Drop Zendesk Export (.csv or .txt) here</span>
        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
      </label>

      {/* Data Table */}
      {data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 mt-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200">Time</th>
                <th className="px-4 py-3 border-b border-slate-200">Normal OCR</th>
                <th className="px-4 py-3 border-b border-slate-200">Priority OCR</th>
                <th className="px-4 py-3 border-b border-slate-200">FA Normal</th>
                <th className="px-4 py-3 border-b border-slate-200">FA Priority</th>
                <th className="px-4 py-3 border-b border-slate-200">EPF</th>
                <th className="px-4 py-3 border-b border-slate-200">Move In</th>
                <th className="px-4 py-3 border-b border-slate-200">IV</th>
                <th className="px-4 py-3 border-b border-slate-200">Disputes</th>
                <th className="px-4 py-3 border-b border-slate-200">P2P</th>
                <th className="px-4 py-3 border-b border-slate-200 text-nowrap">Control Center</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-slate-900 bg-slate-100">{row.time}</td>
                  <td className="px-4 py-4">{row.queues.normalOcr}</td>
                  <td className="px-4 py-4">{row.queues.priorityOcr}</td>
                  <td className="px-4 py-4">{row.queues.faNormal}</td>
                  <td className="px-4 py-4">{row.queues.faPriority}</td>
                  <td className="px-4 py-4">{row.queues.epf}</td>
                  <td className="px-4 py-4">{row.queues.moveIn}</td>
                  <td className="px-4 py-4">{row.queues.iv}</td>
                  <td className="px-4 py-4 text-red-600 font-bold">{row.queues.disputes}</td>
                  <td className="px-4 py-4">{row.queues.p2p}</td>
                  <td className="px-4 py-4">{row.queues.controlCenter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
