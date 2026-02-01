
import React from 'react';
import { ChatType, Theme } from '../types';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

interface ChatHubViewProps {
  onSelectChat: (type: ChatType) => void;
  theme: Theme;
  subscriptionStatus?: string;
}

const ChatHubView: React.FC<ChatHubViewProps> = ({ onSelectChat, theme, subscriptionStatus }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();

  const chats = [
    {
      id: 'ganacsi' as ChatType,
      title: t('business_dm'),
      desc: t('business_ai_desc'),
      icon: '💼',
      label: 'BUSINESS EXPERT',
      color: 'text-[#0285FF] bg-[#0285FF]/10'
    },
    {
      id: 'shukaansi' as ChatType,
      title: t('romance_dm'),
      desc: t('romance_ai_desc'),
      icon: '❤️',
      label: 'ROMANCE GURU',
      color: 'text-pink-600 bg-pink-100/50'
    },
    {
      id: 'waxbarasho' as ChatType,
      title: t('education_dm'),
      desc: t('education_ai_desc'),
      icon: '🎓',
      label: 'EDUCATION PRO',
      color: 'text-blue-600 bg-blue-100/50'
    },
    {
      id: 'team_zinson' as ChatType,
      title: 'Team DeepMind',
      desc: t('team_dark_mind_desc'),
      icon: '🚀',
      label: 'OFFICIAL',
      color: 'text-[#0285FF] bg-[#0285FF]/10'
    }
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#F7F9FC] text-[#0a1b3d]'} ${language === 'ar' ? 'rtl text-right' : 'ltr'}`}>
      <header className="px-8 pt-16 pb-10">
        <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0a1b3d]'}`}>{t('ai_hub')}</h1>
        <p className={`text-[15px] font-bold tracking-tight opacity-50 ${isDark ? 'text-slate-400' : 'text-[#4A5568]'}`}>{t('ai_hub_desc')}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-32 no-scrollbar">
        {chats.map((chat, idx) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full relative overflow-hidden text-left p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] animate-fade-in flex items-center space-x-5 ${isDark
              ? 'bg-[#111622] border-white/5 shadow-2xl'
              : 'bg-white border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
              }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-3xl shrink-0 shadow-sm ${isDark ? 'bg-white/5' : 'bg-[#F7F9FC]'}`}>
              {chat.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 truncate">
                  <h3 className={`text-[18px] font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-[#0a1b3d]'}`}>
                    {chat.title.replace(' DM', '')}
                  </h3>
                  {chat.title.includes(' DM') && (
                    <span className="bg-[#0285FF] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm shadow-[#0285FF]/20">DM</span>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase ${chat.color}`}>
                  {chat.label}
                </span>
              </div>
              <p className={`text-[13px] font-medium leading-relaxed opacity-60 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-[#4A5568]'}`}>
                {chat.desc}
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

export default ChatHubView;
