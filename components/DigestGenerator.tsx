import React from 'react';
import { Podcast } from '../types';
import { Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DigestGeneratorProps {
  podcasts: Podcast[];
  onGenerate: () => void;
  loading: boolean;
  status: string;
  progress: number;
}

const DigestGenerator: React.FC<DigestGeneratorProps> = ({ 
  podcasts, 
  onGenerate, 
  loading, 
  status, 
  progress 
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 text-center max-w-3xl mx-auto my-12 shadow-2xl">
      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 mb-4">
         {loading ? <Loader2 className="animate-spin" size={32} /> : <Send size={32} />}
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-3">Generate Daily Digest</h2>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">
        Trigger the AI agent to check all {podcasts.length} subscriptions, fetch the latest episodes, and compile a bilingual summary report.
      </p>

      {!loading ? (
        <button
          onClick={onGenerate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/40 transform transition hover:-translate-y-1 active:translate-y-0"
        >
          Generate Report Now
        </button>
      ) : (
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-indigo-300 mb-2 font-medium">
            <span className="truncate pr-4">{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-left text-xs space-y-2">
            <p className="font-semibold text-slate-300 flex items-center">
                <AlertTriangle size={12} className="mr-2 text-amber-400" />
                Note on Stability
            </p>
            <p className="text-slate-500">
                Fetching RSS feeds via public proxies can sometimes fail due to CORS or timeouts. 
                If a podcast fails, it will still appear in the final report marked as "Fetch Failed".
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-slate-500">
        <div className="flex items-center">
            <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
            <span>Gemini 2.5 Flash</span>
        </div>
        <div className="flex items-center">
            <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
            <span>Auto-Translate</span>
        </div>
        <div className="flex items-center">
            <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
            <span>Bilingual Extract</span>
        </div>
      </div>
    </div>
  );
};

export default DigestGenerator;