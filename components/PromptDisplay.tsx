import React, { useState } from 'react';
import { VideoPrompt } from '../types';
import { CopyIcon, CheckIcon } from './icons';

interface PromptDisplayProps {
  promptData: VideoPrompt;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ promptData }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(promptData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm shadow-2xl rounded-lg w-full p-6 animate-fade-in flex flex-col max-h-[calc(100vh-20rem)]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 flex-shrink-0">
        <h3 className="text-xl font-bold text-white">Generated JSON Prompt</h3>
        <button
          onClick={handleCopy}
          className="p-2 bg-gray-700 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-sm"
          title="Copy JSON"
        >
          {copied ? (
            <>
              <CheckIcon className="w-5 h-5 text-green-400" />
              <span className="text-gray-300">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-5 h-5 text-gray-300" />
              <span className="text-gray-300">Copy JSON</span>
            </>
          )}
        </button>
      </div>
      
      <div className="overflow-auto bg-gray-900/70 p-4 rounded-lg">
        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
