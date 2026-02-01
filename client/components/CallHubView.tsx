
import React from 'react';
import { CallType, Theme } from '../types';
import { Icons } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface CallHubViewProps {
  onSelectCall: (type: CallType) => void;
  theme: Theme;
}

const CallHubView: React.FC<CallHubViewProps> = ({ onSelectCall, theme }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();

  const calls = [
    {
      id: 'ganacsi' as CallType,
      title: t('business_dm'),
      desc: t('business_call_desc'),
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200',
      iconColor: 'text-[#0285FF]'
    },
    {
      id: 'shukaansi' as CallType,
      title: t('romance_dm'),
      desc: t('romance_call_desc'),
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
      iconColor: 'text-pink-500'
    },
    {
      id: 'waxbarasho' as CallType,
      title: t('education_dm'),
      desc: t('education_call_desc'),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
      iconColor: 'text-blue-500'
    }
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#F7F9FC] text-[#0a1b3d]'} ${language === 'ar' ? 'rtl text-right' : 'ltr'}`}>
      <header className="px-8 pt-16 pb-10">
        <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0a1b3d]'}`}>{t('voice_hub')}</h1>
        <p className={`text-[15px] font-bold tracking-tight opacity-50 ${isDark ? 'text-slate-400' : 'text-[#4A5568]'}`}>{t('voice_hub_desc')}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-32 no-scrollbar">
        {calls.map((call, idx) => (
          <button
            key={call.id}
            onClick={() => onSelectCall(call.id)}
            className={`w-full relative overflow-hidden text-left p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] animate-fade-in flex items-center space-x-5 ${isDark
              ? 'bg-[#111622] border-white/5 shadow-2xl'
              : 'bg-white border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
              }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-full overflow-hidden shadow-md border-2 ${isDark ? 'border-white/10' : 'border-slate-50'}`}>
                <img src={call.avatar} className="w-full h-full object-cover" alt={call.title} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-[#111622] rounded-full flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 truncate">
                  <h3 className={`text-[18px] font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-[#0a1b3d]'}`}>
                    {call.title.replace(' DM', '')}
                  </h3>
                  {call.title.includes(' DM') && (
                    <span className="bg-[#0285FF] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm shadow-[#0285FF]/20">DM</span>
                  )}
                </div>
                <div className={call.iconColor}>
                  <Icons.Call />
                </div>
              </div>
              <p className={`text-[13px] font-medium leading-relaxed opacity-60 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-[#4A5568]'}`}>
                {call.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CallHubView;
