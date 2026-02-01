
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signOut, sendPasswordResetEmail, User } from 'firebase/auth';
import { Icons } from '../constants';
import { Theme, NavPage, Language } from '../types';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

interface SettingsViewProps {
  onOpenMenu?: () => void;
  theme: Theme;
  onNavigate: (page: NavPage, chatType?: any, callType?: any, mode?: any) => void;
  user: User | null;
  userData?: any;
  userRole: 'user' | 'admin' | 'sub_admin';
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onNavigate, user, userData, userRole }) => {
  const isDark = true; // Always dark mode
  const { language, setLanguage, t } = useLanguage();
  const [activeModal, setActiveModal] = useState<'coming_soon' | 'premium' | 'language' | 'help' | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const SettingRow = ({
    icon,
    title,
    value,
    color,
    onClick,
    showChevron = true,
    isDestructive = false
  }: {
    icon: React.ReactNode;
    title: string;
    value?: string;
    color: string;
    onClick?: () => void;
    showChevron?: boolean;
    isDestructive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 py-3 px-4 active:bg-slate-200/10 dark:active:bg-white/10 transition-colors text-left border-b ${isDark ? 'border-white/5' : 'border-slate-100'} last:border-0`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${color} shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-[16px] font-medium ${isDestructive ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
          {title}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className="text-slate-500 text-[15px] font-medium">{value}</span>}
        {showChevron && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
    </button>
  );

  const Section = ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div className="space-y-1.5 mb-7">
      {title && <h4 className={`px-5 text-[12px] font-bold text-slate-500 uppercase tracking-widest ${language === 'ar' ? 'text-right' : ''}`}>{title}</h4>}
      <div className={`overflow-hidden rounded-2xl ${isDark ? 'bg-[#1c1c1e]' : 'bg-white shadow-sm border border-slate-100'}`}>
        {children}
      </div>
    </div>
  );

  const handleComingSoon = () => setActiveModal('coming_soon');
  const handlePremium = () => setActiveModal('premium');
  const handleLanguage = () => setActiveModal('language');
  const handleOfficialLink = () => window.open('https://www.facebook.com/share/17MxPceJvZ/', '_blank');

  const FAQS = [
    { q: "Waa maxay DeepMind?", a: "DeepMind waa xarun caqliga macmalka ah (AI Hub) oo loogu talagalay in lagu caawiyo bulshada Soomaaliyeed, iyadoo bixisa adeegyo Chat iyo Call oo lix luqadood ku hadla." },
    { q: "Mabaash baa mise waa lacag?", a: "App-ku hadda wuxuu leeyahay nidaam lacag-bixin (Premium) iyo mid lacag-abuur (Ambassador). Waxaad ku samayn kartaa dakhli dheeraad ah adigoo dadka kale ku casuumaya inay isticmaalaan app-ka." },
    { q: "Sideen ula xiriiri karaa Hamze Zinson?", a: "Waxaad nagala soo xiriiri kartaa qaybta 'Contact Support' ee hoose, hadday ahaan lahayd WhatsApp ama Email." },
    { q: "Xogtaydu ma ammaan baa?", a: "Haa, xogtaada iyo wada-hadalladii Hore waa ammaan, waxaanuna isticmaalnaa habka ugu dambeeya ee dhowrista xogta (Encrypted)." }
  ];

  const isVerified = userData?.verificationBadge || userData?.isAmbassador;
  const autoUsername = userData?.username || (user?.email ? user.email.split('@')[0] : 'dark_mind_member');

  return (
    <div className={`flex flex-col h-full transition-colors duration-500 pb-28 relative bg-[#000000] text-white ${language === 'ar' ? 'rtl' : 'ltr'}`}>

      <header className="pt-14 pb-8 px-4 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-white/5 overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : (user?.displayName?.charAt(0) || 'D')}
          </div>
          {isVerified ? (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#0285FF] rounded-full flex items-center justify-center shadow-lg border-2 border-black active:scale-90 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" />
                <path d="M8 12L11 15L16 9" stroke="#0285FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-black active:scale-90 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-black tracking-tight">{user?.displayName || 'DeepMind User'}</h1>
          {isVerified && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0285FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
          )}
        </div>
        <p className="text-slate-500 text-[15px] font-medium">{user?.email || '+252 61 234 5678'}</p>
        <p className={`text-[14px] font-black mt-1 tracking-[0.1em] uppercase ${isVerified ? 'text-[#0285FF]' : 'text-slate-600'}`}>@{autoUsername}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 no-scrollbar">

        <Section>
          <SettingRow
            onClick={handleComingSoon}
            color="bg-blue-500"
            title={t('saved')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>}
          />
          <SettingRow
            onClick={handleComingSoon}
            color="bg-[#0285FF]"
            title={t('history_chat')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
          />
          <SettingRow
            onClick={handleComingSoon}
            color="bg-green-500"
            title={t('recent_calls')}
            icon={<Icons.Call />}
          />
        </Section>

        <Section title={t('security_management')}>
          <SettingRow
            onClick={handleComingSoon}
            color="bg-[#0285FF]"
            title={t('update_password')}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          />
          <SettingRow
            onClick={() => window.open(`https://wa.me/252637930329?text=Asc%20Admin,%20waxaan%20rabaa%20inuu%20dalbado%20Promo%20Code%20maadaama%20aan%20ahay%20paid%20user.%20Email-kaygu%20waa:%20${user?.email}`, '_blank')}
            color="bg-purple-600"
            title="Dalbo Promo Code 🎁"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>}
          />
        </Section>

        {(userRole === 'admin' || userRole === 'sub_admin') && (
          <Section title={t('administration')}>
            <SettingRow
              onClick={() => onNavigate(NavPage.ADMIN)}
              color="bg-blue-600"
              title={t('open_admin')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></svg>}
            />
          </Section>
        )}

        <Section title={t('appearance')}>
          <SettingRow
            onClick={handleLanguage}
            color="bg-pink-500"
            title={t('language')}
            value={language === 'so' ? 'Af-Soomaali' : 'English'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>}
          />
        </Section>

        <Section title={t('monetization')}>
          <SettingRow
            onClick={() => onNavigate(NavPage.MONETIZATION)}
            color="bg-green-600"
            title={t('monetization_desc')}
            icon={<Icons.Premium active />}
          />
        </Section>

        <Section title="Ecosystem">
          <SettingRow
            onClick={handleOfficialLink}
            color="bg-blue-600"
            title="DeepMind Official"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>}
          />
          <SettingRow
            onClick={() => onNavigate(NavPage.CHANNEL)}
            color="bg-purple-600"
            title="Team DeepMind Channel"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>}
          />
        </Section>

        <Section title={t('support_legal')}>
          <SettingRow
            onClick={() => onNavigate(NavPage.ABOUT)}
            color="bg-blue-600"
            title={t('about_app')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>}
          />
          <SettingRow
            onClick={handlePremium}
            color="bg-yellow-500"
            title={t('premium')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
          />
          <SettingRow
            onClick={() => setActiveModal('help')}
            color="bg-slate-600"
            title={t('help_support')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
          />
          <SettingRow
            onClick={() => onNavigate(NavPage.PRIVACY)}
            color="bg-gray-400"
            title={t('privacy_policy')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          />
          <SettingRow
            onClick={() => onNavigate(NavPage.TERMS)}
            color="bg-gray-400"
            title={t('terms_conditions')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
          />
        </Section>

        <Section>
          <SettingRow
            isDestructive
            onClick={async () => {
              await signOut(auth);
            }}
            color="bg-red-500"
            title={t('logout')}
            showChevron={false}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
          />
        </Section>

        <div className="text-center py-8">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">{t('home')}</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('version')} 2.5.0 • {t('developed_by')}</p>
        </div>
      </div>

      {activeModal === 'language' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in ltr">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-[#111622] rounded-[3rem] p-8 text-center shadow-2xl overflow-hidden">
            <h3 className="text-xl font-black mb-6 dark:text-white">{t('choose_language')}</h3>
            <div className="space-y-3">
              <button
                onClick={() => { setLanguage('so'); setActiveModal(null); }}
                className={`w-full p-5 rounded-2xl flex items-center justify-between font-bold transition-all ${language === 'so' ? 'bg-[#0285FF] text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-white'}`}
              >
                <span>1. Somali</span>
                {language === 'so' && <span className="text-xs opacity-60">Selected</span>}
              </button>
              <button
                onClick={() => { setLanguage('en'); setActiveModal(null); }}
                className={`w-full p-5 rounded-2xl flex items-center justify-between font-bold transition-all ${language === 'en' ? 'bg-[#0285FF] text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-white'}`}
              >
                <span>2. English</span>
                {language === 'en' && <span className="text-xs opacity-60">Selected</span>}
              </button>
            </div>
            <button onClick={() => setActiveModal(null)} className="mt-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest">{t('cancel')}</button>
          </div>
        </div>
      )}

      {activeModal === 'coming_soon' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in ltr">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-[#111622] border border-black/5 dark:border-white/10 rounded-[3rem] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full gradient-bg mx-auto mb-6 flex items-center justify-center shadow-xl">
              <Logo size="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black dark:text-white mb-2">Shaqadan waa "Soon"</h3>
            <p className="text-slate-500 text-sm leading-relaxed">App-ku hadda wuxuu ku jiraa xaalad tijaabo (Trial Mode). Shaqadan dhowaan ayay iman doontaa.</p>
            <button onClick={() => setActiveModal(null)} className="mt-8 w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 dark:text-white font-bold">Waan gartay</button>
          </div>
        </div>
      )}

      {activeModal === 'premium' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in ltr">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-sm overflow-hidden rounded-[3rem] bg-white dark:bg-[#1c1c1e] shadow-2xl border border-black/5 dark:border-white/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
                <span className="text-3xl">👑</span>
              </div>
              <div>
                <h3 className="text-2xl font-black dark:text-white mb-2">{t('premium')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">Nidaamka lacag bixinta hadda waa diyaar! Waxaad sidoo kale ku biiri kartaa kooxda **Ambassador** si aad lacag u kasbato adigoo dadka ku dhiirigelinaya DeepMind.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs">Sii wad bilaashka</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'help' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in ltr">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-sm bg-[#0a0f1e] border border-white/5 rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-spring-up text-white">
            <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0f1e]/80 backdrop-blur-md z-10">
              <div>
                <h3 className="text-xl font-black">{t('help_support')}</h3>
                <p className="text-[10px] uppercase font-bold text-[#0285FF] tracking-widest mt-0.5">Support Center</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><Icons.Close /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="space-y-3">
                {FAQS.map((item, i) => (
                  <div key={i} className="border border-white/5 rounded-2xl overflow-hidden bg-white/5">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-white/5"
                    >
                      <span className="text-[14px] font-bold pr-4">{item.q}</span>
                      <svg className={`transform transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <p className="text-[13px] text-slate-400 leading-relaxed font-medium">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">{t('contact_support')}</h4>
                <div className="space-y-3">
                  <a href="https://wa.me/252637930329" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg"><Icons.Call /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{t('chat_whatsapp')}</p>
                      <p className="text-[11px] text-green-500/70 font-bold uppercase">Direct Support</p>
                    </div>
                  </a>
                  <a href="mailto:zinsonhamze@gmail.com" className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Email Us</p>
                      <p className="text-[11px] text-blue-500/70 font-bold uppercase">General Inquiry</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <footer className="p-8 border-t border-white/5 text-center">
              <button onClick={() => setActiveModal(null)} className="w-full py-4 rounded-[2rem] gradient-bg text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Waan gartay</button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
      `}</style>
    </div>
  );
};

export default SettingsView;
