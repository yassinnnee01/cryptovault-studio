import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle, FileCode } from 'lucide-react';
import { readTextFile, formatBytes } from '../utils/fileHelpers';

interface FileDropzoneProps {
  onFileLoaded: (content: string, filename: string) => void;
  currentFileName?: string;
  onClear?: () => void;
  accentColor?: 'cyan' | 'purple' | 'emerald';
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileLoaded,
  currentFileName,
  onClear,
  accentColor = 'cyan',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    try {
      const text = await readTextFile(file);
      setFileDetails({ name: file.name, size: file.size });
      onFileLoaded(text, file.name);
    } catch (err: any) {
      alert('Error reading file: ' + err.message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const colorStyles = {
    cyan: {
      borderActive: 'border-cyan-400 bg-cyan-950/20',
      icon: 'text-cyan-400',
      btn: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40',
    },
    purple: {
      borderActive: 'border-purple-400 bg-purple-950/20',
      icon: 'text-purple-400',
      btn: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40',
    },
    emerald: {
      borderActive: 'border-emerald-400 bg-emerald-950/20',
      icon: 'text-emerald-400',
      btn: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40',
    },
  }[accentColor];

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.text,.enc,.json,.key,.pem"
        className="hidden"
      />

      {(fileDetails || currentFileName) ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center space-x-3 truncate">
            <div className={`p-2 rounded-lg bg-slate-800 ${colorStyles.icon}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {fileDetails?.name || currentFileName}
              </p>
              {fileDetails && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(fileDetails.size)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900 transition-all"
            title="Clear file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? colorStyles.borderActive
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
          }`}
        >
          <div className={`p-3 rounded-full bg-slate-800/80 group-hover:scale-110 transition-transform ${colorStyles.icon}`}>
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-300">
            Drag & drop text file (<span className="font-mono text-cyan-400">.txt</span>) or <span className="underline decoration-cyan-500/50">browse</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Supports plain text, encrypted .txt files, or PEM keys</p>
        </div>
      )}
    </div>
  );
};
