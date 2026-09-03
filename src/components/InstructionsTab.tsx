import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function InstructionsTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">How to Use This Tool</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            This tool was created to make the hourly ECE TPH update process faster and easier for RTAs.
          </p>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Previously, preparing the hourly TPH update required manually downloading and cleaning Timelogs, Breaklogs, and Zendesk agent comment data for all Flex agents. Since the raw reports include data from multiple companies and customers, the process also required filtering only ECE agents, checking column formats, sorting dates, and manually adjusting incomplete log end times.
          </p>
          <p className="text-slate-600 mt-4 font-medium">
            This tool handles most of that work automatically.
          </p>
        </div>

        {/* Zendesk */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Zendesk Data
          </h3>
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 space-y-3 text-sm text-slate-700">
            <p>
              Get the Zendesk report here:{' '}
              <a 
                href="https://getflex.zendesk.com/explore?brand_id=360002102693#/pivot-table/connection/9929971/report/264874421"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 break-all font-medium"
              >
                Zendesk Explore Report <ExternalLink size={14} />
              </a>
            </p>
            <p>Set the report to the date you want to update, then export it as CSV.</p>
            <p className="leading-relaxed">
              Upload the CSV to the web app. Once processed, copy the output and paste it into the <strong>Tickets RD</strong> tab of:
              <br />
              <span className="inline-block mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs shadow-sm">
                ECE/GetFlex | TPH Calculator - Sept 2026
              </span>
            </p>
          </div>
        </section>

        {/* Timelogs and Breaklogs */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Timelogs and Breaklogs
          </h3>
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 space-y-3 text-sm text-slate-700">
            <p>Download the Timelog and Breaklog reports for the date or date range you need.</p>
            <p>Upload them to the web app. The tool will automatically:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>sort the records by date</li>
              <li>standardize the output</li>
              <li>handle incomplete logs</li>
              <li>use the latest completed hour as the temporary end time for logs that do not yet have an end time</li>
            </ul>
            
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-900 shadow-sm">
              <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" size={18} />
              <div>
                <strong className="block mb-1 text-amber-800">Important:</strong> 
                Before pasting updated data into the TPH Calculator, delete the existing records for the date you are updating. This prevents duplicate entries.
              </div>
            </div>
          </div>
        </section>

        {/* Hourly Interval Tool */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Hourly Interval Tool
          </h3>
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 text-sm text-slate-700 space-y-2">
            <p>The hourly interval extractor is also included inside the same web app.</p>
            <p>Use this when updating hourly queue volumes so you do not have to switch between multiple tools or browser tabs during your shift.</p>
          </div>
        </section>

        {/* Summary */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center shadow-sm">
          <p className="font-bold text-indigo-900 mb-3 uppercase tracking-wider text-xs">In short</p>
          <p className="text-indigo-800 font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
            <span>Download reports</span>
            <span className="text-indigo-400">→</span>
            <span>Upload to web app</span>
            <span className="text-indigo-400">→</span>
            <span>Copy output</span>
            <span className="text-indigo-400">→</span>
            <span>Paste into Calculator</span>
          </p>
        </div>
        
      </div>
    </div>
  );
}
