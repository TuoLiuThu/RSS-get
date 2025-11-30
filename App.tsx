import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PodcastList from './components/PodcastList';
import DigestGenerator from './components/DigestGenerator';
import EmailPreview from './components/EmailPreview';
import { Podcast, SummaryResult, AppView, DEFAULT_PODCASTS, UserSettings } from './types';
import { fetchLatestEpisodes } from './services/rssService';
import { generatePodcastSummary } from './services/geminiService';
import { sendEmailDigest } from './services/emailService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [podcasts, setPodcasts] = useState<Podcast[]>(DEFAULT_PODCASTS);
  const [generatedSummaries, setGeneratedSummaries] = useState<SummaryResult[]>([]);
  
  const [settings, setSettings] = useState<UserSettings>({
    targetEmail: 'torialiuhey@gmail.com',
    deliveryTime: '00:00'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string>('');
  const [genProgress, setGenProgress] = useState(0);

  // Scheduler
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        const lastRun = localStorage.getItem('lastRunDate');
        const todayStr = now.toDateString();
        
        if (!isGenerating && lastRun !== todayStr) {
          console.log("Auto-scheduler triggered at 00:00");
          localStorage.setItem('lastRunDate', todayStr);
          handleGenerateDigest(true);
        }
      }
    };

    const intervalId = setInterval(checkSchedule, 60000); 
    return () => clearInterval(intervalId);
  }, [isGenerating]);

  const handleGenerateDigest = async (autoSend: boolean = false) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenProgress(5);
    setGenStatus('Starting daily digest sequence...');
    
    try {
      setGenStatus('Fetching RSS feeds (Optimized Mode)...');
      const episodes = await fetchLatestEpisodes(podcasts);
      setGenProgress(20);
      
      if (episodes.length === 0) {
        setGenStatus('Error: Could not fetch any episodes. Check network/proxies.');
        setIsGenerating(false);
        return;
      }

      setGenStatus(`Summarizing ${episodes.length} episodes with Gemini...`);
      
      const results: SummaryResult[] = [];
      const total = episodes.length;
      
      for (let i = 0; i < total; i++) {
        setGenStatus(`Processing (${i + 1}/${total}): ${episodes[i].podcastName}`);
        const summary = await generatePodcastSummary(episodes[i]);
        results.push(summary);
        setGenProgress(20 + Math.floor(((i + 1) / total) * 70));
      }
      
      setGeneratedSummaries(results);
      setGenStatus('Compilation complete.');
      setGenProgress(100);

      // We immediately switch to preview so the user can see the result/download it
      setCurrentView(AppView.PREVIEW);
      
      if (autoSend) {
        // If auto-triggered at midnight, we can try to open the mailto
        // but browsers usually block popups without user interaction.
        // We log it instead.
        console.log("Auto-generation complete. Ready for user download.");
      }
      
    } catch (error: any) {
      console.error(error);
      setGenStatus(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualEmailSend = async () => {
    await sendEmailDigest(settings.targetEmail, generatedSummaries);
  };

  const handleRemovePodcast = (id: string) => {
    setPodcasts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddPodcast = (url: string) => {
    const newPodcast: Podcast = {
      id: Date.now().toString(),
      name: 'New Podcast',
      rssUrl: url
    };
    setPodcasts([...podcasts, newPodcast]);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="space-y-12">
            <header>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-slate-400">
                Scheduled to run daily at <span className="text-indigo-400 font-mono">00:00</span>.
              </p>
            </header>
            
            <DigestGenerator 
              podcasts={podcasts} 
              onGenerate={() => handleGenerateDigest(false)}
              loading={isGenerating}
              status={genStatus}
              progress={genProgress}
            />
            
            <PodcastList 
              podcasts={podcasts} 
              onRemove={handleRemovePodcast} 
              onAdd={handleAddPodcast}
            />
          </div>
        );
      case AppView.PREVIEW:
        return (
          <div className="space-y-8">
             <header>
              <h1 className="text-4xl font-bold text-white mb-2">Digest Preview</h1>
              <p className="text-slate-400">Review, Download, or Email your report.</p>
            </header>
            <EmailPreview 
              summaries={generatedSummaries} 
              targetEmail={settings.targetEmail}
              onSendEmail={handleManualEmailSend}
            />
          </div>
        );
      case AppView.SETTINGS:
        return (
          <div className="max-w-2xl">
             <header className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
              <p className="text-slate-400">Configure delivery preferences.</p>
            </header>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
               <h3 className="text-xl font-semibold mb-6 text-white">Email Configuration</h3>
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Recipient Email</label>
                   <input 
                    type="email" 
                    value={settings.targetEmail}
                    onChange={(e) => setSettings({...settings, targetEmail: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Delivery Time</label>
                   <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-sm">
                     Fixed at 00:00 (Midnight)
                   </div>
                 </div>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;