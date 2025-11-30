import React from 'react';
import { Radio, Settings, FileText, Zap } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight">
            PodDigest.ai
          </span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4">
          <NavItem 
            icon={<Radio size={20} />} 
            label="Daily Digest" 
            isActive={currentView === AppView.DASHBOARD} 
            onClick={() => onChangeView(AppView.DASHBOARD)} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Email Preview" 
            isActive={currentView === AppView.PREVIEW} 
            onClick={() => onChangeView(AppView.PREVIEW)} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            isActive={currentView === AppView.SETTINGS} 
            onClick={() => onChangeView(AppView.SETTINGS)} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 hidden lg:block">
          <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Status</p>
            <p>API: Connected</p>
            <p>Model: Gemini 2.5</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-lg transition-all duration-200 group ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
    }`}
  >
    <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
      {icon}
    </span>
    <span className="hidden lg:block ml-3 font-medium">{label}</span>
  </button>
);

export default Layout;