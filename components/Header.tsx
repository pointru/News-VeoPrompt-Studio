
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">VeoPrompt Studio</h1>
            <p className="text-slate-400 text-sm font-medium">Professional Video Prompt Engineering</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold uppercase tracking-wider">
            Gemini 3 Pro Powered
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
