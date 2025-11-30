import React, { useState } from 'react';
import { SummaryResult } from '../types';
import { Mail, Clock, ExternalLink, Download, Copy, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { copyDigestToClipboard, downloadDigestAsHtml, sendEmailDigest } from '../services/emailService';

interface EmailPreviewProps {
  summaries: SummaryResult[];
  targetEmail: string;
  onSendEmail: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ summaries, targetEmail, onSendEmail }) => {
  const [hasCopied, setHasCopied] = useState(false);
  
  const handleDownload = () => {
    downloadDigestAsHtml(summaries);
  };

  const handleCopyClick = async () => {
    await copyDigestToClipboard(summaries);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleRealEmail = () => {
    sendEmailDigest(targetEmail, summaries);
  };

  if (!summaries || summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Mail size={48} className="mb-4 opacity-50" />
        <p className="text-lg">No digest generated yet.</p>
        <p className="text-sm">Go to Dashboard and click "Generate Report Now".</p>
      </div>
    );
  }

  const successCount = summaries.filter(s => !s.translatedTitle.includes('Failed')).length;
  const failCount = summaries.length - successCount;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
            <h2 className="text-xl font-semibold text-white">Report Preview</h2>
            <p className="text-xs text-slate-400 mt-1">
                {successCount} Success, {failCount > 0 ? <span className="text-red-400">{failCount} Failed</span> : '0 Failed'}
            </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Download size={14} />
            <span>下载报告 (Download HTML)</span>
          </button>

          <button 
            onClick={handleCopyClick}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-slate-700"
          >
            {hasCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>复制内容 (Copy)</span>
          </button>
          
          <button 
            onClick={handleRealEmail}
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
            title="Opens your local email client"
          >
            <Mail size={14} />
            <span>发送邮件 (Open Mail)</span>
          </button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg flex items-start text-xs text-amber-200">
        <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Important:</p>
          <p>
            Due to browser security, web apps cannot directly send emails to your inbox without a backend server. 
            Please use <strong>Download HTML</strong> to save the report, or <strong>Copy</strong> to paste it manually. 
            The "Open Mail" button will try to open your default email app.
          </p>
        </div>
      </div>

      {/* Email Visual Preview */}
      <div className="bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden font-sans">
        
        <div className="bg-slate-900 p-8 text-center border-b-4 border-indigo-500">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Daily Podcast Digest</h1>
          <p className="text-indigo-200 text-sm flex items-center justify-center">
            <Clock size={14} className="mr-2" />
            {today}
          </p>
        </div>

        <div className="p-8 space-y-12 bg-slate-50">
          {summaries.map((item, idx) => {
            const isError = item.translatedTitle.includes('Failed') || item.translatedTitle.includes('失败') || item.status === 'error';
            return (
                <div key={idx} className={`bg-white border rounded-xl p-6 shadow-sm ${isError ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 pb-4 border-b border-slate-100">
                    <div>
                    <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase mb-1 block">
                        {item.podcastName}
                    </span>
                    <h3 className={`text-xl font-bold leading-tight ${isError ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.translatedTitle}
                    </h3>
                    <h4 className="text-sm text-slate-500 mt-1 font-medium">
                        {item.originalTitle}
                    </h4>
                    </div>
                    {item.originalLink && (
                        <a 
                        href={item.originalLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="mt-4 md:mt-0 flex items-center text-xs font-semibold text-white bg-slate-900 px-4 py-2 rounded-full hover:bg-slate-800 transition-colors self-start whitespace-nowrap"
                        >
                        Link <ExternalLink size={12} className="ml-2" />
                        </a>
                    )}
                </div>

                {isError ? (
                    <div className="text-red-800 text-sm p-4 bg-red-100 rounded-lg">
                        <strong>Error:</strong> {item.summaryChinese}
                        <br/>
                        <span className="text-xs opacity-75">Could not parse feed content. The source RSS might be blocking cross-origin requests.</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Summary (Chinese)</h5>
                            <p className="text-slate-700 leading-relaxed text-sm text-justify">
                                {item.summaryChinese}
                            </p>
                            </div>
                            <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Summary (English)</h5>
                            <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                {item.summaryEnglish}
                            </p>
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                            <h5 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center">
                            Key Takeaways
                            </h5>
                            <ul className="space-y-2">
                            {item.keyPoints.map((point, k) => (
                                <li key={k} className="flex items-start text-sm text-indigo-900">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                                <span>{point}</span>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </>
                )}

                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;