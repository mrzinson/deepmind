
import React from 'react';
import { Icons } from '../constants';
import { Theme } from '../types';

interface VideoViewProps {
  onOpenMenu?: () => void;
  theme: Theme;
}

const VideoView: React.FC<VideoViewProps> = ({ onOpenMenu, theme }) => {
  const isDark = true; // Always dark mode

  return (
    <div className={`flex flex-col h-full p-8 text-center relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <button
        onClick={onOpenMenu}
        className={`absolute top-8 right-8 z-50 p-3 rounded-2xl border text-[#0285FF] active:scale-90 transition-transform backdrop-blur-md ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
      >
        <Icons.Menu />
      </button>

      <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className={`w-24 h-24 border rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="text-[#0285FF]">
            <Icons.Video active />
          </div>
        </div>
        <h2 className="text-4xl font-extrabold gradient-text mb-4">Dhowaan...</h2>
        <p className={`max-w-xs mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          DeepMind Video Feature wuxuu kuu ogolaan doonaa inaad khabiirka ka hor hadasho waji-ka-waji.
        </p>
        <div className="mt-10 px-6 py-2 rounded-full border border-[#0285FF]/20 text-[#0285FF] text-xs font-bold tracking-widest uppercase">
          Coming Soon
        </div>
      </div>
    </div>
  );
};

export default VideoView;
