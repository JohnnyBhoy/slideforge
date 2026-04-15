import React from 'react';
import { GenerationResult } from '../../types';
import { useGenerator } from '../../context/GeneratorContext';

interface DownloadCardProps {
  result: GenerationResult & { topic: string; gradeLevel: string };
  onGenerateAnother: () => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({ result, onGenerateAnother }) => {
  const { remainingTries, isSubscribed } = useGenerator();

  // fileUrl is a blob: URL created in generator.ts — clicking it re-triggers download
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.fileUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-2xl mx-auto mt-6">
      <div className="bg-green-600 text-white px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-bold text-lg">Your presentation is ready!</p>
          <p className="text-green-100 text-sm">Generated in seconds using AI</p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3 text-slate-700">
          <span className="text-2xl">📄</span>
          <div>
            <p className="font-semibold">{result.topic}</p>
            <p className="text-sm text-slate-500">{result.gradeLevel} • {result.slidesGenerated} slides</p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition"
        >
          ⬇ Download PowerPoint (.pptx)
        </button>

        <p className="text-center text-xs text-slate-400">
          File was downloaded automatically. Click above if it didn't start.
        </p>

        {(isSubscribed || (remainingTries !== null && remainingTries > 0)) && (
          <button
            onClick={onGenerateAnother}
            className="w-full text-blue-700 hover:text-blue-900 text-sm font-medium py-2 transition"
          >
            Generate another →
          </button>
        )}
      </div>
    </div>
  );
};

export default DownloadCard;
