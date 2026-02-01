
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

interface TeamZinsonChannelProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  initialView?: 'channel' | 'profile';
}

const TeamZinsonChannel: React.FC<TeamZinsonChannelProps> = ({ onBack, theme, initialView = 'channel' }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();
  const [showProfile, setShowProfile] = useState(initialView === 'profile');

  useEffect(() => {
    setShowProfile(initialView === 'profile');
  }, [initialView]);

  const news = [
    {
      id: 1,
      title: 'DeepMind 2.5 Hub is Live! 🚀',
      content: language === 'so' ? 'Waxaan si rasmi ah u furay AI Hub-ka cusub ee DeepMind. Hadda waxaad heli kartaa kaaliyeyaal dhanka Shukaansiga iyo Waxbarashada ah. Tani waa guul weyn oo u soo hoyatay bahda Team DeepMind.' : 'We have officially launched the new DeepMind AI Hub. You can now access assistants for Romance and Education. This is a big win for Team DeepMind.',
      time: '10:30 AM',
      date: language === 'so' ? 'Maanta' : 'Today',
      likes: 124,
      comments: 56,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 2,
      author: 'Hamze Zinson',
      title: language === 'so' ? 'Cusboonaysiinta Amniga 🔒' : 'Security Update 🔒',
      content: language === 'so' ? 'Waxaan kordhinay amniga iyo xogta moodalladayada si ay u noqdaan kuwa ugu horreeya dhanka xog-ilaalinta ee geeska Afrika. Amniga macmiilku waa muhiimadayada koowaad.' : 'We have increased the security and data privacy of our models to be leaders in the Horn of Africa. Customer security is our first priority.',
      time: '09:15 PM',
      date: language === 'so' ? 'Shalay' : 'Yesterday',
      likes: 89,
      comments: 42
    }
  ];

  const socialLinks = {
    facebook: 'https://www.facebook.com/share/17MxPceJvZ/',
    tiktok: 'https://www.tiktok.com/@hamze.zinson?_r=1&_t=ZS-93GloSWjqo4',
    instagram: 'https://www.instagram.com/mr.zinson?igsh=MXVpcnc2Z2R2b2xuaA==',
    email: 'mailto:zinsonhamze@gmail.com',
    whatsapp: 'https://wa.me/252637930329'
  };

  const wallpaperStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l2 2m10 5l-1-1m20 10h2m-5 15l1 1m30-20v2m-10 10l-2-2m-30 40h2m15-10l-1-1M10 80l2 2m60-10v2M20 40l-1 1' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='85' cy='15' r='1.5' fill='%23ffffff' fill-opacity='0.05'/%3E%3Ccircle cx='40' cy='65' r='1.5' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E")`,
    backgroundSize: '200px 200px'
  };

  if (showProfile) {
    return (
      <div className={`fixed inset-0 z-[200] animate-fade-in flex flex-col items-center overflow-y-auto no-scrollbar pb-20 bg-[#050810]`}>
        <div className={`w-full flex items-center justify-between px-6 py-6 sticky top-0 backdrop-blur-md z-30 bg-[#050810]/80`}>
          <button onClick={() => { if (initialView === 'profile') onBack(); else setShowProfile(false); }} className={`p-2 active:scale-90 transition-transform text-white`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h2 className={`text-[14px] font-black tracking-tight uppercase text-white`}>DeepMind Portfolio</h2>
          <div className="w-10"></div>
        </div>

        <div className="mt-8 flex flex-col items-center w-full px-8 max-w-lg">
          <div className="relative mb-6">
            <div className={`w-36 h-36 rounded-full p-1.5 shadow-2xl relative z-10 bg-white/5`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 ring-4 ring-[#0285FF]/30">
                <img src="/user_profile.jpg" alt="DeepMind Admin" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 gradient-bg p-2 rounded-full border-4 border-[#050810] z-20 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <h1 className={`text-3xl font-black tracking-tight text-white`}>DeepMind Admin</h1>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#0285FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
            </div>
            <p className="text-[#0285FF] font-black text-[14px] uppercase tracking-widest leading-relaxed">Leading Developer & Creator</p>
            <p className={`mt-2 text-sm font-bold opacity-50 text-slate-400`}>{language === 'so' ? 'Aasaasaha Nidaamka DeepMind' : 'Founder of DeepMind Ecosystem'}</p>
          </div>

          <SectionCard title={language === 'so' ? 'Khibradda Matrix' : 'Experience Matrix'}>
            <div className="text-[15px] leading-relaxed font-medium text-slate-300">
              {language === 'so' ? 'Dhisidda adeegyo AI oo heer caalami ah oo loogu talagalay bulshada Soomaaliyeed. Ku takhasusay naqshadaynta is-dhexgalka iyo caqliga otomaatiga ah.' : 'Building world-class AI solutions for the Somali community. Specialists in interaction design and automated intelligence.'}
              <div className="space-y-3 mt-6">
                <Badge iconColor="bg-[#0285FF]" text="System Architecture" />
                <Badge iconColor="bg-pink-500" text="AI Strategy" />
                <Badge iconColor="bg-blue-500" text="Fullstack Lead" />
              </div>
            </div>
          </SectionCard>

          <div className="w-full mb-12">
            <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-5 px-6 text-white/40`}>{language === 'so' ? 'Nala soo Xiriir' : 'Connect Directly'}</h3>
            <div className="grid grid-cols-1 gap-4">
              <SocialLinkItem href={socialLinks.facebook} icon="facebook" label="Facebook" username="Hamze Zinson" theme="dark" color="blue" />
              <SocialLinkItem href={socialLinks.tiktok} icon="tiktok" label="TikTok" username="@hamze.zinson" theme="dark" color="pink" />
              <SocialLinkItem href={socialLinks.whatsapp} icon="whatsapp" label="WhatsApp" username="+252 63 7930329" theme="dark" color="green" />
              <SocialLinkItem href={socialLinks.email} icon="email" label="Email" username="zinsonhamze@gmail.com" theme="dark" color="orange" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full relative bg-[#050810]`}>
      <div className="absolute inset-0 z-0" style={wallpaperStyle}></div>

      {/* Header */}
      <header className="px-6 py-6 flex items-center border-b border-white/5 z-20 sticky top-0 bg-[#050810]/95 backdrop-blur-xl">
        <button onClick={onBack} className="p-1 mr-4 transition-transform active:scale-90 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0285FF]/10 flex items-center justify-center shadow-2xl border border-[#0285FF]/20">
            <Logo size="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white uppercase">DeepMind Channel</h1>
            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {language === 'so' ? '2.4k Ayaa hadda ku jira' : '2.4k Active Now'}
            </p>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar pb-32 relative z-10">
        {news.map((item) => (
          <div key={item.id} className="max-w-[650px] mx-auto animate-fade-in">
            <div className="bg-[#111622] rounded-[1.2rem] border border-white/5 overflow-hidden shadow-2xl">

              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <button onClick={() => setShowProfile(true)} className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#0285FF]/20">
                    <img src="/user_profile.jpg" className="w-full h-full object-cover" alt="Author" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[14px] font-black text-white/90">{item.author || "DeepMind Admin"}</span>
                      <div className="bg-[#0285FF] p-0.5 rounded-full"><svg width="7" height="7" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-tighter uppercase">{item.date} • {item.time}</span>
                  </div>
                </button>
                <button className="text-slate-500 hover:text-white transition-colors p-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg></button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <h3 className="text-[16px] font-black text-[#0285FF] mb-2 leading-snug">{item.title}</h3>
                <p className="text-[15px] leading-relaxed text-slate-300 font-medium">
                  {item.content}
                </p>
              </div>

              {/* Media */}
              {item.image && (
                <div className="w-full px-4 mb-2">
                  <div className="rounded-xl overflow-hidden border border-white/5 aspect-video md:aspect-auto">
                    <img src={item.image} alt="post content" className="w-full object-cover max-h-[400px]" />
                  </div>
                </div>
              )}

              {/* Interaction Bar - YouTube Style */}
              <div className="px-1 py-1 border-t border-white/5 flex items-center space-x-1">
                <div className="flex items-center bg-white/5 rounded-full px-1 py-1 m-1">
                  <button className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-l-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                    <span className="text-[12px] font-black">{item.likes}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-white/10"></div>
                  <button className="px-3 py-2 hover:bg-white/10 rounded-r-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                  </button>
                </div>

                <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 my-1 rounded-full transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <span className="text-[12px] font-black">{item.comments}</span>
                </button>

                <button className="flex items-center bg-white/5 hover:bg-white/10 p-2 my-1 rounded-full transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const SectionCard = ({ children, title }: { children?: React.ReactNode; title: string }) => (
  <div className="w-full rounded-[1.5rem] p-7 mb-6 shadow-sm border bg-[#121826] border-white/5">
    <div className="flex items-center space-x-3 mb-5">
      <div className="p-2 bg-[#0285FF]/10 rounded-xl text-[#0285FF] shadow-md border border-[#0285FF]/10"><Logo size="w-5 h-5" /></div>
      <h3 className="text-[14px] font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const Badge = ({ iconColor, text }: { iconColor: string; text: string }) => (
  <div className="flex items-center space-x-2.5">
    <span className={`w-1.5 h-1.5 rounded-full ${iconColor} shadow-lg shadow-current/50`}></span>
    <span className="text-[11px] font-black uppercase tracking-wider opacity-80 text-white/70">{text}</span>
  </div>
);

const SocialLinkItem = ({ href, icon, label, username, color }: { href: string; icon: string; label: string; username: string; theme: string; color: 'blue' | 'pink' | 'green' | 'orange' }) => {
  const getIcon = () => {
    switch (icon) {
      case 'facebook': return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
      case 'tiktok': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>;
      case 'whatsapp': return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
      case 'email': return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
      default: return null;
    }
  }

  const colors = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/10',
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/10',
    green: 'bg-green-500/10 text-green-500 border-green-500/10',
    orange: 'bg-[#0285FF]/10 text-[#0285FF] border-[#0285FF]/10'
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-5 rounded-[1.8rem] border transition-all active:scale-95 group ${colors[color]} hover:bg-opacity-20`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner`}>{getIcon()}</div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">{label}</span>
          <span className="text-[15px] font-black tracking-tight">{username}</span>
        </div>
      </div>
      <div className="opacity-30 group-hover:opacity-100 transition-opacity"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l10-10M7 7h10v10" /></svg></div>
    </a>
  );
};

export default TeamZinsonChannel;
