
import React, { useState, useEffect } from 'react';
import { NavPage, Theme, StoryData, Language } from '../types';
import { Icons } from '../constants';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

// Shared Notification/Post Data
const NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'DeepMind 2.5 Hub is Live! 🚀',
    content: 'Waxaan si rasmi ah u furay AI Hub-ka cusub ee DeepMind. Hadda waxaad heli kartaa kaaliyeyaal dhanka Shukaansiga iyo Waxbarashada ah.',
    time: '10:30 AM',
    isNew: true,
    type: 'post'
  },
  {
    id: 'notif-2',
    title: 'Cusboonaysiinta Amniga 🔒',
    content: 'Waxaan kordhinay amniga iyo xogta moodalladayada si ay u noqdaan kuwa ugu horreeya dhanka xog-ilaalinta.',
    time: 'Yesterday',
    isNew: false,
    type: 'post'
  },
  {
    id: 'notif-3',
    title: 'Update-kii Ugu Weynaa ee Abid! 🔥',
    content: 'Gabi ahaanba waa la beddelay qaab dhismeedkii hore iyo nidaamkii uu u shaqaynayay AI-ga.',
    time: '2 days ago',
    isNew: false,
    type: 'update'
  }
];

const HOME_CONTENT = {
  breakingStory: {
    id: 'breaking-1',
    category: 'BREAKING NEWS & UPDATE',
    time: '3 min read',
    title: 'DeepMind: Update-kii Ugu Weynaa ee Abid Lagu Sameeyo! 🚀',
    content: `**HORDHAC**
Waxaan si farxad leh idiinku soo bandhigaynaa update-kii ugu ballaarnaa ee abid lagu sameeyo DeepMind. Gabi ahaanba waa la beddelay qaab dhismeedkii hore iyo nidaamkii uu u shaqaynayay AI-ga, si aad u hesho khibrad heer sare ah oo aan horay loo arag.

**ISBEDDELADA MUHIIMKA AH**
Waxaan halkan ku soo koobaynaa qodobada ugu muhiimsan ee update-kan ka midka ah:

- **1. Naqshadda Hub-ka:** Waxaan gabi ahaanba dib u dhisnay muuqaalka (UI) si uu u noqdo mid casri ah, indhaha u roon, oo u shaqaynaya si aad u degdeg badan.
- **2. Chat-yo Cusub:** Waxaan ku soo kordhiyey laba Chat oo muhiim ah: Shukaansi AI (Baro qofka qalbigaaga dega) iyo Waxbarasho AI (Macalinkaaga gaarka ah ee aan waligii daalin).
- **3. Adeegga Wicitaanka (Calls):** Hadda waxaad cod ahaan ula hadli kartaa AI-da Shukaansiga iyo Waxbarashada si toos ah.
- **4. Codadka Cali & Layla:** Waxaan ku daray laba AI Voice oo cusub oo leh lahjada dabiiciga ah ee Soomaaliga.
- **5. Settings-ka Cusub:** Meesha laga hago App-ka oo si heer sare ah loo badalay, adigoo awood u leh inaad adigu xukunto awoodaha AI-ga.
- **6. Official Channel:** Meel gaar ah oo aan ugu tala galay inaan idin kula wadaagno wararka ugu dambeeya.

**GABAGABO**
Ku raaxayso update-kan weyn oo ay Team DeepMind idiin diyaariyeen! Haddii aad aragto wax cilad ah, fadlan nala soo wadaag adiga oo nagu soo xiriiraya baraha bulshada.

Mahadsanidiin,
**DeepMind Admin**`,
    rating: '5.0',
    tag: '#DeepMind_V2',
    imageType: 'radar',
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800'
  } as StoryData,
  updates: [
    {
      id: 'update-1',
      category: 'DeepMind CORE',
      time: '2h ago',
      title: 'Autonomous Agents reach human-level coordination...',
      content: 'DeepMind autonomous agents have reached a historic milestone by collaboratively executing complex business tasks.',
      rating: '4.8',
      tag: '#AGI_PROGRESS',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'update-2',
      category: 'INTEGRATION',
      time: '5h ago',
      title: 'Why DeepMind\'s new SDK is changing software...',
      content: 'DeepMind\'s new SDK enables small businesses to easily use AI for accounting and customer management.',
      rating: '5.0',
      tag: '#SDK_RELEASE',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'update-3',
      category: 'AI INSIGHTS',
      time: '1d ago',
      title: 'Quantum computing benchmarks for AI established...',
      content: 'Quantum computing has now been used to train new DeepMind models, increasing AI learning speed significantly.',
      rating: '4.7',
      tag: '#QUANTUM',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=300'
    }
  ] as StoryData[]
};

interface HomeViewProps {
  onNavigate: (page: NavPage, mode?: 'channel' | 'profile', chatType?: any) => void;
  onOpenMenu: () => void;
  theme: Theme;
  onStorySelect: (story: StoryData) => void;
  onOpenSearch: () => void;
  onOpenNotif: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenMenu, theme, onStorySelect }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedPosts(newExpanded);
  };

  const filteredUpdates = searchQuery
    ? HOME_CONTENT.updates.filter(u => u.title.toLowerCase().includes(searchQuery.toLowerCase()) || u.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : HOME_CONTENT.updates;

  return (
    <div className={`flex flex-col h-full overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#f2f2f7] text-slate-900'}`}>

      {/* Search Overlay - Premium Design */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[500] animate-fade-in flex flex-col justify-start">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-[100px]" onClick={() => setIsSearchOpen(false)} />
          <div className="relative flex flex-col w-full max-w-2xl mx-auto h-full p-6 pt-12">
            <div className="flex items-center space-x-4 mb-10">
              <div className="flex-1 h-14 bg-white/5 rounded-full border border-white/10 flex items-center px-6 focus-within:border-[#0285FF]/50 transition-all">
                <svg className="text-white/30 mr-4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="bg-transparent border-none outline-none flex-1 text-[16px] font-bold text-white placeholder-white/20"
                />
              </div>
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {searchQuery && <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0285FF]/60 mb-2 px-2">Search Results</p>}
              {filteredUpdates.length > 0 ? (
                filteredUpdates.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => { onStorySelect(item); setIsSearchOpen(false); }}
                    className="group p-5 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-[#0285FF]/30 transition-all duration-300 flex items-center space-x-5 cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-2xl relative">
                      <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-[#0285FF]/10 group-hover:opacity-0 transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-[#0285FF] uppercase tracking-widest mb-1.5 block">{item.category}</span>
                      <h4 className="text-[15px] font-black leading-snug group-hover:text-[#0285FF] transition-colors">{item.title}</h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 opacity-60 uppercase">{item.time}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 scale-110">
                    <Logo size="w-14 h-14" spinning={!!searchQuery} />
                  </div>
                  <p className="font-black uppercase text-[11px] tracking-[0.4em] opacity-40">No matches found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Side-Sheet - Higher Premium Feel */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[500] animate-fade-in flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsNotifOpen(false)} />
          <div className="relative w-full max-w-sm h-full flex flex-col shadow-2xl animate-slide-left border-l border-white/5 bg-[#050810]">
            <header className="p-8 pt-12 flex items-center justify-between border-b border-white/5">
              <div>
                <h2 className="text-2xl font-black tracking-tighter">Activity</h2>
                <p className="text-[10px] uppercase font-black text-[#0285FF] tracking-widest mt-1.5">{t('notifications')}</p>
              </div>
              <button
                onClick={() => setIsNotifOpen(false)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 active:scale-95 transition-all"
              >
                <Icons.Close />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {NOTIFICATIONS.length > 0 ? (
                NOTIFICATIONS.map((notif, i) => (
                  <div
                    key={notif.id}
                    className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${notif.type === 'post' ? 'text-[#0285FF]' : 'text-purple-500'}`}>{notif.type}</span>
                      <span className="text-[9px] font-bold text-slate-500">{notif.time}</span>
                    </div>
                    <h3 className="font-black text-[15px] mb-1 group-hover:text-[#0285FF] transition-colors">{notif.title}</h3>
                    <p className="text-[12px] font-medium text-slate-400 leading-relaxed line-clamp-2">{notif.content}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 opacity-20">
                    <Icons.Chat />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">{t('no_notifications')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenMenu}
            className={`lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isDark ? 'bg-white/5 text-white active:bg-white/10' : 'bg-white text-slate-900 shadow-md shadow-black/5 active:scale-95'}`}
          >
            <Icons.Menu />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-xl font-bold text-white tracking-tight">DeepMind</h2>
          </div>
          <div className="lg:hidden">
            <Logo variant="main" size="w-8 h-8" />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isDark ? 'bg-white/5 text-white active:bg-white/10' : 'bg-white text-slate-900 shadow-md shadow-black/5 active:scale-95'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </button>
          <button
            onClick={() => setIsNotifOpen(true)}
            className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isDark ? 'bg-white/5 text-white active:bg-white/10' : 'bg-white text-slate-900 shadow-md shadow-black/5 active:scale-95'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-[#0285FF] rounded-full ring-2 ring-white dark:ring-[#050810]"></span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 lg:pb-10 space-y-10 no-scrollbar">
        {/* HERO SECTION - FEATURED STORY */}
        <section className="relative group">
          <div
            onClick={() => onStorySelect(HOME_CONTENT.breakingStory)}
            className={`relative w-full aspect-[4/5] lg:aspect-[16/7] rounded-[3.5rem] overflow-hidden cursor-pointer shadow-2xl transition-transform duration-700 hover:scale-[0.99] border ${isDark ? 'border-white/10 shadow-[#0285FF]/5' : 'border-black/5'}`}
          >
            <img
              src={HOME_CONTENT.breakingStory.thumbnail}
              alt="Story"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050810]/95 via-[#050810]/40 to-transparent' : 'from-black/80 via-black/20 to-transparent'}`}></div>

            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-4 py-1.5 rounded-full bg-[#0285FF] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#0285FF]/30">
                  {t('breaking_news')}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                  {HOME_CONTENT.breakingStory.time}
                </span>
              </div>

              <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] tracking-tighter mb-6 group-hover:text-[#0285FF] transition-colors duration-300">
                {HOME_CONTENT.breakingStory.title}
              </h1>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5">
                    <Logo size="w-full h-full" />
                  </div>
                  <div className="text-left text-white">
                    <p className="text-[11px] font-black uppercase tracking-widest">DeepMind Team</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase">Official Hub</p>
                  </div>
                </div>
                <div className="flex items-center text-white/50 text-xs font-black uppercase tracking-widest group-hover:text-[#0285FF] transition-all">
                  <span className="mr-1">{t('read_story')}</span>
                  <svg className="transform group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m9 18 6-6-6-6" /></svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LATEST UPDATES LIST */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{t('latest_updates')}</h2>
            <button className="text-[10px] font-black text-[#0285FF] uppercase tracking-widest flex items-center group">
              {t('view_all')} <svg className="ml-1 transform transition-transform group-hover:translate-x-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {HOME_CONTENT.updates.map((story, i) => (
              <div
                key={story.id}
                onClick={() => onStorySelect(story)}
                className={`group p-6 rounded-[2.8rem] transition-all duration-300 cursor-pointer border ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-[#0285FF]/20 shadow-2xl relative' : 'bg-white border-black/5 hover:shadow-xl'
                  }`}
              >
                <div className="flex items-start space-x-5">
                  <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden shrink-0 shadow-lg relative">
                    <img src={story.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#0285FF]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-[#0285FF] uppercase tracking-widest">{story.category}</span>
                      <span className="text-[9px] font-black text-slate-500 opacity-60 uppercase">{story.time}</span>
                    </div>
                    <h3 className="text-[15px] font-black leading-snug group-hover:text-[#0285FF] transition-colors mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      <span className="text-[10px] font-black">{story.rating}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'} flex items-center justify-between`}>
                  <p className="text-[10px] font-black text-[#0285FF] opacity-80 uppercase tracking-widest">{story.tag}</p>
                  <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#0285FF] group-hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s ease-out backwards; }
        .animate-slide-left { animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default HomeView;
