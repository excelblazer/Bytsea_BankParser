
import React, { useCallback, useState } from 'react';
import { ACCEPTED_FILE_TYPES } from '../constants';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const acceptedTypesString = Object.keys(ACCEPTED_FILE_TYPES).join(',');

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES]) {
        onFileSelect(file);
        setFileName(file.name);
      } else {
        alert("Invalid file type. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP files.");
        setFileName(null);
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES]) {
        onFileSelect(file);
        setFileName(file.name);
      } else {
        alert("Invalid file type. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP files.");
        setFileName(null);
        e.target.value = ''; // Reset file input
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-800 p-8 rounded-xl shadow-2xl transition-all duration-300 ease-in-out">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-slate-700'}
                    ${dragActive ? 'border-blue-500 bg-slate-700' : 'border-slate-600 bg-slate-700/50'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className={`w-10 h-10 mb-3 ${dragActive ? 'text-blue-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className={`mb-2 text-sm ${dragActive ? 'text-blue-300' : 'text-slate-400'}`}>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className={`text-xs ${dragActive ? 'text-blue-400' : 'text-slate-500'}`}>PDF, DOCX, TXT, JPG, PNG, WEBP</p>
        </div>
        <input id="file-upload" type="file" className="hidden" onChange={handleChange} accept={acceptedTypesString} disabled={disabled} />
      </label>
      {fileName && !disabled && <p className="mt-4 text-center text-sm text-green-400">Selected: {fileName}</p>}
      {fileName && disabled && <p className="mt-4 text-center text-sm text-slate-400">Processing: {fileName}</p>}
    </div>
  );
};

export default FileUpload;
