import React, { useState, useCallback } from 'react';
import { analyzePaper } from '../services/geminiService';
import { DialogueLine, GameSettings } from '../types';

interface UploadScreenProps {
  onScriptGenerated: (script: DialogueLine[], title: string) => void;
  onBack: () => void;
  settings: GameSettings;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onScriptGenerated, onBack, settings }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Preparing mana...");

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError("Please upload a PDF file, 主殿 (Master)!");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setLoadingText("Reading the ancient texts (Parsing PDF)...");

    try {
      // Simulate phases of "thinking" for better UX
      const thinkingTimer = setTimeout(() => setLoadingText("Consulting the spirits (Gemini Thinking)..."), 2000);
      
      const result = await analyzePaper(file, settings);
      
      clearTimeout(thinkingTimer);
      setLoadingText("Transcribing logic to magic...");
      
      onScriptGenerated(result.script, result.title);
    } catch (err) {
      setError("Failed to summon the explanation. Is the API Key valid?");
      setIsProcessing(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white/50 backdrop-blur-md p-8">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-gal-pink-dark hover:text-gal-pink font-bold flex items-center gap-2 transition-colors"
      >
        <i className="fas fa-arrow-left"></i> Return to Shrine
      </button>

      <div className="max-w-xl w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Summon Paper Spirit</h2>
        <p className="text-center text-gray-500 mb-8">Upload your research PDF to begin the ritual.</p>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl shadow-xl border-4 border-gal-pink/30">
             <div className="w-16 h-16 border-4 border-gal-pink border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-xl text-gal-pink-dark font-serif animate-pulse">{loadingText}</p>
             <p className="text-sm text-gray-400 mt-2">This may take a moment...</p>
          </div>
        ) : (
          <div 
            className={`
              relative group cursor-pointer
              flex flex-col items-center justify-center p-12 
              border-4 border-dashed rounded-3xl transition-all duration-300
              ${isDragging 
                ? 'border-gal-blue bg-blue-50 scale-105' 
                : 'border-gal-pink/50 bg-white hover:border-gal-pink hover:shadow-xl'
              }
            `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              accept=".pdf" 
              onChange={onFileSelect}
            />
            
            <div className={`w-20 h-20 bg-gal-pink/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <i className="fas fa-book-open text-3xl text-gal-pink-dark"></i>
            </div>
            
            <p className="text-xl font-bold text-gray-700 mb-2">
              Click or Drag PDF Here
            </p>
            <p className="text-sm text-gray-400">
              Maximum file size: 10MB
            </p>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm font-bold flex items-center animate-bounce">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};