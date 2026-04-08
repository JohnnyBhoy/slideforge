import React from 'react';

interface LoaderProps {
  fullPage?: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullPage, text }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mb-4" />
        {text && <p className="text-slate-600 text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {text && <span>{text}</span>}
    </div>
  );
};

export default Loader;
