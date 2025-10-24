import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptDisplay } from './components/PromptDisplay';
import Loader from './components/Loader';
import { generateVideoPrompt } from './services/geminiService';
import { VideoPrompt } from './types';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix e.g. "data:image/png;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoPrompt, setVideoPrompt] = useState<VideoPrompt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleImageUpload = useCallback((files: FileList) => {
    const newFiles = Array.from(files);
    setImageFiles(newFiles);
    
    // Clean up old object URLs before creating new ones
    imageUrls.forEach(url => URL.revokeObjectURL(url));

    const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
    setImageUrls(newImageUrls);
    
    setVideoPrompt(null);
    setError(null);
  }, [imageUrls]);

  const handleGenerateClick = async () => {
    if (imageFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setVideoPrompt(null);

    try {
      const imagePayloads = await Promise.all(
        imageFiles.map(async (file) => {
          const base64 = await fileToBase64(file);
          return { base64, mimeType: file.type };
        })
      );
      const prompt = await generateVideoPrompt(imagePayloads);
      setVideoPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearImages = () => {
    setImageFiles([]);
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    setImageUrls([]);
    setVideoPrompt(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="text-center my-8 animate-fade-in-down">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Visual-to-Video Prompt Generator
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Transform any image into a detailed, cinematic video prompt. Powered by Gemini.
        </p>
      </header>
      
      <main className="w-full max-w-6xl flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6 h-full items-center">
          <ImageUploader onImageUpload={handleImageUpload} imageUrls={imageUrls} isLoading={isLoading} />
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handleGenerateClick}
              disabled={imageFiles.length === 0 || isLoading}
              className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isLoading ? 'Generating...' : 'Generate Prompt'}
            </button>
            {imageFiles.length > 0 && !isLoading && (
              <button
                onClick={handleClearImages}
                className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
              >
                Clear Images
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full h-full min-h-[16rem] lg:min-h-0">
          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg w-full text-center">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : videoPrompt ? (
            <PromptDisplay promptData={videoPrompt} />
          ) : (
            <div className="text-center text-gray-500 p-8 bg-gray-800/50 rounded-lg w-full">
              <p className="text-xl">Your generated prompt will appear here.</p>
              <p className="mt-2 text-sm">Upload one or more images and click "Generate Prompt" to start.</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="w-full text-center py-6 mt-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Visual-to-Video AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
