import React, { useRef } from 'react';
import { UploadCloud, File as FileIcon, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  id: string;
  label: string;
  stepNumber: string;
  subLabel: string;
  accept?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({ id, label, stepNumber, subLabel, accept = '.csv', file, onFileSelect }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelect(selectedFile);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-64">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
            {stepNumber}
          </span>
          {label}
        </h2>
      </div>

      <div
        className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
          file 
            ? 'border-indigo-200 bg-indigo-50 border-solid ring-2 ring-indigo-50' 
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
        }`}
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!file && e.dataTransfer.files?.[0]) {
            onFileSelect(e.dataTransfer.files[0]);
          }
        }}
      >
        {file ? (
          <>
            <FileIcon className="w-8 h-8 text-indigo-500 mb-2" />
            <p className="text-sm font-bold text-indigo-700 truncate px-4 text-center max-w-full">
              {file.name}
            </p>
            <p className="text-xs text-indigo-500 mt-1">Ready for parsing</p>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">Upload CSV</p>
            <p className="text-xs text-slate-400 mt-1">{subLabel}</p>
          </>
        )}
      </div>

      {file ? (
        <div className="mt-4 flex items-center justify-between text-xs font-medium">
          <span className="text-indigo-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> File verified
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 italic">
          <span>Ready for parsing...</span>
        </div>
      )}

      <input
        id={id}
        name={id}
        type="file"
        accept={accept}
        className="sr-only"
        ref={inputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
