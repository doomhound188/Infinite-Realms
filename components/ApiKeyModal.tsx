import React from 'react';
import { openKeySelection } from '../services/geminiService';

interface ApiKeyModalProps {
  onSuccess: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSuccess }) => {
  const handleSelect = async () => {
    try {
      await openKeySelection();
      // Assume success as per instructions to avoid race condition
      onSuccess();
    } catch (e) {
      console.error("Error selecting key", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-500/30 p-8 rounded-xl max-w-md w-full text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 font-serif">Premium Feature Locked</h2>
        <p className="text-gray-300 mb-6">
          To generate high-fidelity illustrations (1K, 2K, 4K) using the advanced <strong>Gemini 3 Pro Image</strong> model, you must connect a paid Google Cloud Project API key.
        </p>
        <button
          onClick={handleSelect}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors w-full mb-4"
        >
          Select API Key
        </button>
        <p className="text-xs text-gray-500">
            See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-yellow-500">Billing Documentation</a> for more info.
        </p>
      </div>
    </div>
  );
};