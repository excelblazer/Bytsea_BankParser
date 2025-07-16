
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
    <div className="w-full max-w-2xl mx-auto">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`group relative overflow-hidden flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-blue-400/50 hover:bg-slate-800/50'
        } ${
          dragActive 
            ? 'border-blue-500/70 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-xl shadow-blue-500/20' 
            : 'border-slate-600/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
          {/* Upload Icon */}
          <div className={`relative mb-6 p-6 rounded-full border transition-all duration-300 ${
            dragActive 
              ? 'border-blue-400/50 bg-blue-500/20 shadow-lg shadow-blue-500/30' 
              : 'border-slate-600/50 bg-slate-700/50 group-hover:border-blue-400/30 group-hover:bg-blue-500/10'
          }`}>
            <svg className={`w-12 h-12 transition-all duration-300 ${
              dragActive ? 'text-blue-400 scale-110' : 'text-slate-400 group-hover:text-blue-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            {dragActive && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping"></div>
            )}
          </div>
          
          {/* Upload Text */}
          <div className="space-y-2">
            <h3 className={`text-xl font-bold transition-colors duration-300 ${
              dragActive ? 'text-blue-300' : 'text-white group-hover:text-blue-300'
            }`}>
              {dragActive ? 'Drop your file here' : 'Upload Document'}
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              dragActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
            }`}>
              <span className="font-semibold">Click to browse</span> or drag and drop your file
            </p>
            <div className={`inline-flex items-center px-4 py-2 rounded-xl border transition-all duration-300 ${
              dragActive 
                ? 'border-blue-400/30 bg-blue-500/10 text-blue-300' 
                : 'border-slate-600/50 bg-slate-700/30 text-slate-400 group-hover:border-slate-500/50 group-hover:text-slate-300'
            }`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span className="text-xs font-medium">PDF, DOCX, TXT, JPG, PNG, WEBP</span>
            </div>
          </div>
        </div>
        
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          onChange={handleChange} 
          accept={acceptedTypesString} 
          disabled={disabled} 
        />
      </label>
      
      {/* File Status */}
      {fileName && (
        <div className="mt-6 animate-fade-in">
          <div className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${
            disabled 
              ? 'border-slate-600/50 bg-slate-800/30' 
              : 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10'
          }`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-xl mr-3 ${
                disabled ? 'bg-slate-700/50' : 'bg-green-500/20'
              }`}>
                <svg className={`w-5 h-5 ${
                  disabled ? 'text-slate-400' : 'text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p className={`font-medium ${disabled ? 'text-slate-300' : 'text-green-300'}`}>
                  {disabled ? 'Processing:' : 'Selected:'}
                </p>
                <p className={`text-sm ${disabled ? 'text-slate-400' : 'text-green-400'}`}>
                  {fileName}
                </p>
              </div>
            </div>
            {disabled && (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
