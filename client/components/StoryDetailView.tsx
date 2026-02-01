
import React, { useState } from 'react';
import { NavPage, StoryData, Theme } from '../types';
import Logo from './Logo';

interface StoryDetailViewProps {
  story: StoryData;
  onBack: () => void;
  onNavigate?: (page: NavPage, chatType?: any, callType?: any, mode?: 'channel' | 'profile') => void;
  theme: Theme;
}

const StoryDetailView: React.FC<StoryDetailViewProps> = ({ story, onBack, onNavigate, theme }) => {
  const isDark = true; // Always dark mode
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 1000);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();

      // Render Header (marked with **Header**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <h2 key={i} className={`text-xl font-black mt-8 mb-4 uppercase tracking-tight ${isDark ? 'text-[#0285FF]' : 'text-[#0285FF]'}`}>
            {trimmedLine.replace(/\*\*/g, '')}
          </h2>
        );
      }

      // Render List Item (marked with - )
      if (trimmedLine.startsWith('- ')) {
        const parts = trimmedLine.replace('- ', '').split(/(\*\*.*?\*\*)/g);
        return (
          <li key={i} className="ml-2 mb-3 list-none flex items-start space-x-3 group">
            <span className="text-[#0285FF] mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#0285FF] group-hover:scale-150 transition-transform"></span>
            <span className="leading-relaxed font-medium">
              {parts.map((part, pi) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pi} className="text-[#0285FF] font-bold">{part.replace(/\*\*/g, '')}</strong>;
                }
                return part;
              })}
            </span>
          </li>
        );
      }

      if (trimmedLine === '') return <div key={i} className="h-4"></div>;

      // Render standard paragraph with support for mid-sentence bolding
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={`mb-5 leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {parts.map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pi} className="text-[#0285FF] font-black">{part.replace(/\*\*/g, '')}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 relative ${isDark ? 'bg-[#050810] text-white' : 'bg-white text-slate-900'}`}>

      {/* Hero Header Area */}
      <div className="relative h-[45%] w-full flex flex-col justify-end p-8 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-t z-10 ${isDark ? 'from-[#050810]' : 'from-white'} via-transparent to-transparent`}></div>
        <div className="absolute inset-0 opacity-60">
          <img src={story.thumbnail || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200'} alt="cover" className="w-full h-full object-cover" />
        </div>

        <button
          onClick={onBack}
          className={`absolute top-12 left-6 z-50 p-2 rounded-2xl backdrop-blur-md transition-transform active:scale-90 ${isDark ? 'bg-black/20 text-white' : 'bg-white/60 text-slate-900'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        <div className="relative z-20 space-y-4">
          <div className="flex items-center space-x-3">
            <span className="bg-pink-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white shadow-lg">{story.category}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{story.time}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-2xl">{story.title}</h1>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto no-scrollbar p-8 pb-32 ltr text-left ${isDark ? 'bg-[#050810]' : 'bg-white'}`}>
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Enhanced Author Section */}
          <button
            onClick={() => onNavigate?.(NavPage.CHANNEL, undefined, undefined, 'profile')}
            className={`w-full flex items-center space-x-4 p-5 rounded-[2.5rem] border transition-all active:scale-[0.98] ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 shadow-sm'}`}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#0285FF] shadow-lg">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100" alt="Hamze" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-sm font-black">DeepMind Admin</h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0285FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
              </div>
              <p className="text-[10px] font-black text-[#0285FF] uppercase tracking-widest mt-0.5">Admin • Founder of DeepMind</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <div className="text-[17px] leading-relaxed">
            {renderContent(story.content)}
          </div>

          {/* Social Actions */}
          <div className="pt-10 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button onClick={handleLike} className={`flex items-center space-x-3 transition-colors ${isLiked ? 'text-pink-500' : 'text-slate-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.046 3 5.5L12 21l7-7Z" /></svg>
                <span className="text-xs font-black uppercase tracking-widest">{isLiked ? 'Loved' : 'Love'}</span>
              </button>
              <button onClick={() => setIsCommentModalOpen(true)} className="flex items-center space-x-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <span className="text-xs font-bold uppercase tracking-widest">Comment</span>
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DeepMind © 2025</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-sm z-30">
        <button onClick={onBack} className="w-full py-5 rounded-[2rem] gradient-bg text-white font-black uppercase tracking-[0.3em] text-xs shadow-xl active:scale-95 transition-all">
          KU NOQO HUB-KA
        </button>
      </div>
    </div>
  );
};

export default StoryDetailView;
