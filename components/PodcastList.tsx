import React from 'react';
import { Podcast } from '../types';
import { Trash2, Plus, ExternalLink } from 'lucide-react';

interface PodcastListProps {
  podcasts: Podcast[];
  onRemove: (id: string) => void;
  onAdd: (url: string) => void; // Simplified for demo
}

const PodcastList: React.FC<PodcastListProps> = ({ podcasts, onRemove }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          <span>Add Podcast</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {podcasts.map((podcast) => (
          <div key={podcast.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
            <div className="h-24 bg-gradient-to-r from-slate-700 to-slate-800 relative">
              <div className="absolute -bottom-6 left-6">
                 {/* Placeholder for real image since RSS images can be messy */}
                <div className="w-16 h-16 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-xl font-bold border-4 border-slate-800 shadow-lg">
                  {podcast.name.charAt(0)}
                </div>
              </div>
            </div>
            <div className="pt-8 pb-6 px-6">
              <h3 className="text-lg font-bold text-white mb-1 truncate" title={podcast.name}>{podcast.name}</h3>
              <p className="text-sm text-slate-400 truncate mb-4">{podcast.rssUrl}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <a 
                  href={podcast.rssUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>RSS Feed</span>
                  <ExternalLink size={12} />
                </a>
                <button 
                  onClick={() => onRemove(podcast.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Unsubscribe"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastList;