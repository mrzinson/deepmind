import React, { useState, useEffect, Suspense, lazy } from 'react';
import { NavPage, Theme, StoryData, ChatType, CallType, Language } from './types';
import { Icons } from './constants';
import Logo from './components/Logo';

// LAZY LOADED COMPONENTS FOR BETTER PERFORMANCE
const HomeView = lazy(() => import('./components/HomeView'));
const ChatView = lazy(() => import('./components/ChatView'));
const VoiceView = lazy(() => import('./components/VoiceView'));
const VideoView = lazy(() => import('./components/VideoView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const StoryDetailView = lazy(() => import('./components/StoryDetailView'));
const ChatHubView = lazy(() => import('./components/ChatHubView'));
const CallHubView = lazy(() => import('./components/CallHubView'));
const TeamZinsonChannel = lazy(() => import('./components/TeamZinsonChannel'));
const AuthView = lazy(() => import('./components/AuthView'));
const OnboardingView = lazy(() => import('./components/OnboardingView'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TermsAndConditionsView = lazy(() => import('./components/TermsAndConditionsView'));
const PrivacyPolicyView = lazy(() => import('./components/PrivacyPolicyView'));
const AboutView = lazy(() => import('./components/AboutView'));
const MonetizationView = lazy(() => import('./components/MonetizationView'));
const MonetizationGuideView = lazy(() => import('./components/MonetizationGuideView'));
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useLanguage } from './context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>(NavPage.HOME);
  const [activeChatType, setActiveChatType] = useState<ChatType | null>(null);
  const [activeCallType, setActiveCallType] = useState<CallType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme: Theme = 'dark';
  const { language, setLanguage, t } = useLanguage();
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);
  const [channelViewMode, setChannelViewMode] = useState<'channel' | 'profile'>('channel');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(1);
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'sub_admin'>('user');
  const [userData, setUserData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [monetizationStatus, setMonetizationStatus] = useState<any>(null);
  const [hasMonetizationUpdate, setHasMonetizationUpdate] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Priority 1: Force Admin for master email
        if (currentUser.email === 'seo.zinson.ai@gmail.com') {
          setUserRole('admin');
        }

        // Priority 2: Check Firestore for additional profile info/roles
        try {
          // Check if profile exists (only for incomplete check)
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) {
            setIsProfileIncomplete(true);
            if (currentUser.email !== 'seo.zinson.ai@gmail.com') setUserRole('user');
          } else {
            setIsProfileIncomplete(false);
            // Update last login
            updateDoc(doc(db, "users", currentUser.uid), { lastLoginAt: serverTimestamp() }).catch(() => { });
          }
        } catch (e) {
          console.error("Profile check error:", e);
        }
      } else {
        setUserRole('user');
        setIsProfileIncomplete(false);
      }
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // User Data Listener (Real-time updates for Blue Tick, etc.)
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (user.email !== 'seo.zinson.ai@gmail.com') {
          setUserRole(data.role || 'user');
        }
      }
    });

    return () => unsub();
  }, [user]);

  // Monetization Status Listener
  useEffect(() => {
    if (!user) {
      setMonetizationStatus(null);
      setHasMonetizationUpdate(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "monetization", user.uid), (snap: any) => {
      if (snap.exists()) {
        const data = snap.data();
        const prevStatus = monetizationStatus;
        setMonetizationStatus(data);

        // Check if there's an update that needs attention
        // 1. Payment approved but social proof not started
        // 2. Social approved but dashboard not unlocked
        const needsAttention = (data.paymentStatus === 'approved' && data.socialStatus === 'none') ||
          (data.status === 'approved' && !data.isFullyActive);

        if (needsAttention) {
          setHasMonetizationUpdate(true);
        } else {
          setHasMonetizationUpdate(false);
        }
      }
    });
    return () => unsub();
  }, [user]);

  // Education Subscription Listener
  useEffect(() => {
    if (!user) {
      setSubscriptionData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "subscriptions", user.uid), (snap) => {
      if (snap.exists()) {
        setSubscriptionData(snap.data());
      } else {
        setSubscriptionData(null);
      }
    });

    return () => unsub();
  }, [user]);

  // Reset badge when visiting monetization page
  useEffect(() => {
    if (currentPage === NavPage.MONETIZATION) {
      setHasMonetizationUpdate(false);
    }
  }, [currentPage]);

  // History Management for Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.chatType) setActiveChatType(event.state.chatType);
        if (event.state.callType) setActiveCallType(event.state.callType);
      } else {
        setCurrentPage(NavPage.HOME);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initial state
    window.history.replaceState({ page: NavPage.HOME }, '');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for API Key on startup
  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        setIsKeyMissing(true);
      }
    };
    checkApiKey();


    const hasSeenWelcome = sessionStorage.getItem('zinson_welcome_v3_seen');
    const hasCompletedOnboarding = localStorage.getItem('dark_mind_onboarding_completed');

    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else if (!hasSeenWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeyMissing(false);
    }
  };

  const closeWelcome = () => {
    setShowWelcome(false);
    setWelcomeStep(1);
    sessionStorage.setItem('zinson_welcome_v3_seen', 'true');
  };

  const nextWelcomeStep = () => {
    if (welcomeStep < 7) {
      setWelcomeStep(prev => prev + 1);
    } else {
      closeWelcome();
    }
  };

  const prevWelcomeStep = () => {
    if (welcomeStep > 1) {
      setWelcomeStep(prev => prev - 1);
    }
  };

  const navigate = (page: NavPage, chatType?: ChatType, callType?: CallType, mode: 'channel' | 'profile' = 'channel') => {
    // History Tracking
    window.history.pushState({ page, chatType, callType, mode }, '');

    setCurrentPage(page);
    if (chatType) setActiveChatType(chatType);
    if (callType) setActiveCallType(callType);
    if (page === NavPage.CHANNEL) setChannelViewMode(mode);
    setIsSidebarOpen(false);
    setSelectedStory(null);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('dark_mind_onboarding_completed', 'true');
    // Show regular welcome modal if needed after onboarding
    setShowWelcome(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case NavPage.HOME:
        return <HomeView onNavigate={(p: any, m?: any, ct?: any) => navigate(p, ct, undefined, m)} onOpenMenu={() => setIsSidebarOpen(true)} theme={theme} onStorySelect={(s) => { setSelectedStory(s); setCurrentPage(NavPage.STORY); }} onOpenSearch={() => { }} onOpenNotif={() => { }} />;
      case NavPage.CHAT_HUB:
        return <ChatHubView onSelectChat={(type) => { setActiveChatType(type); navigate(type === 'team_zinson' ? NavPage.CHANNEL : NavPage.CHAT_DETAIL); }} theme={theme} subscriptionStatus={subscriptionData?.status} />;
      case NavPage.CHAT_DETAIL:
        return (
          <ChatView
            key={activeChatType || 'ganacsi'}
            type={activeChatType || 'ganacsi'}
            onBack={() => setCurrentPage(NavPage.CHAT_HUB)}
            onSwitchChat={(newType) => {
              setActiveChatType(newType);
            }}
            theme={theme}
          />
        );
      case NavPage.ADMIN:
        return <AdminDashboard onBack={() => setCurrentPage(NavPage.HOME)} />;
      case NavPage.CALL_HUB:
        return <CallHubView onSelectCall={(type) => { setActiveCallType(type); navigate(NavPage.CALL_DETAIL); }} theme={theme} />;
      case NavPage.CALL_DETAIL:
        return <VoiceView key={activeCallType || 'ganacsi'} type={activeCallType || 'ganacsi'} onBack={() => setCurrentPage(NavPage.CALL_HUB)} theme={theme} />;
      case NavPage.VIDEO:
        return <VideoView onOpenMenu={() => setIsSidebarOpen(true)} theme={theme} />;
      case NavPage.SETTING:
        return <SettingsView user={user} userData={userData} userRole={userRole} theme={theme} onNavigate={navigate} />;
      case NavPage.STORY:
        return selectedStory ? <StoryDetailView story={selectedStory} onBack={() => setCurrentPage(NavPage.HOME)} onNavigate={navigate} theme={theme} /> : null;
      case NavPage.CHANNEL:
        return <TeamZinsonChannel initialView={channelViewMode} onBack={() => setCurrentPage(NavPage.HOME)} theme={theme} />;
      case NavPage.TERMS:
        return <TermsAndConditionsView onBack={() => setCurrentPage(NavPage.SETTING)} />;
      case NavPage.PRIVACY:
        return <PrivacyPolicyView onBack={() => setCurrentPage(NavPage.SETTING)} />;
      case NavPage.ABOUT:
        return <AboutView onBack={() => setCurrentPage(NavPage.SETTING)} />;
      case NavPage.MONETIZATION:
        return <MonetizationView onBack={() => setCurrentPage(NavPage.HOME)} />;
      case NavPage.MONETIZATION_GUIDE:
        return <MonetizationGuideView onBack={() => setCurrentPage(NavPage.HOME)} />;
      default:
        return <HomeView onNavigate={(p: any, m?: any, ct?: any) => navigate(p, ct, undefined, m)} onOpenMenu={() => setIsSidebarOpen(true)} theme={theme} onStorySelect={(s) => { setSelectedStory(s); setCurrentPage(NavPage.STORY); }} onOpenSearch={() => { }} onOpenNotif={() => { }} />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#050810] flex items-center justify-center">
        <Logo size="w-16 h-16" spinning />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden ${isDark ? 'bg-[#050810] text-white' : 'bg-[#f2f2f7] text-slate-900'}`}>

      {/* API KEY SELECTION MODAL */}
      {isKeyMissing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
          <div className={`relative w-full max-w-sm overflow-hidden rounded-[3rem] p-10 text-center shadow-2xl border ${isDark ? 'bg-[#0a0f1e] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="w-20 h-20 bg-[#0285FF]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0285FF]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h2 className="text-xl font-black mb-3">API Key Maqan! 🔑</h2>
            <p className="text-sm opacity-60 leading-relaxed mb-8">Si uu App-ku u shaqeeyo, fadlan dooro API Key sax ah. Waxaad ka heli kartaa Google AI Studio.</p>
            <div className="space-y-4">
              <button
                onClick={handleSelectKey}
                className="w-full py-4 rounded-2xl gradient-bg text-white font-black uppercase tracking-widest text-[11px] shadow-xl"
              >
                Dooro API Key
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#0285FF] transition-colors">
                Sidee Key loo helaa?
              </a>
            </div>
          </div>
        </div>
      )}

      {/* WELCOME ONBOARDING - FULL SCREEN MOBILE OPTIMIZED */}
      {showWelcome && !isKeyMissing && (
        <div className="fixed inset-0 z-[1500] bg-[#050810] flex flex-col animate-fade-in overflow-hidden">
          {/* Background Decorative Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0285FF]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative flex-1 flex flex-col justify-between p-8 pt-12 sm:p-12">

            {/* TOP LOGO INDICATOR */}
            <div className="flex justify-center mb-8">
              <Logo size="w-12 h-12" />
            </div>

            {/* CONTENT AREA - FLEX-1 CENTERING */}
            <div className="w-full flex-1 flex flex-col items-center justify-center max-w-lg mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={welcomeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full space-y-8 flex flex-col items-center"
                >
                  {welcomeStep === 1 && (
                    <div className="space-y-8 text-center">
                      <div className="relative mx-auto w-32 h-32">
                        <div className="absolute -inset-8 bg-[#0285FF]/20 blur-3xl rounded-full"></div>
                        <Logo size="w-32 h-32" spinning />
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-4xl font-black tracking-tight leading-tight">Ku soo dhowow <br /><span className="gradient-text">DeepMind!</span> 🚀</h2>
                        <p className="text-[17px] leading-relaxed opacity-60 max-w-[300px] mx-auto font-medium">
                          Dunida AI-ga oo halkan ku furan. Hal Maskax, Kun Fursadood.
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 2 && (
                    <div className="space-y-10 text-center w-full">
                      <div className="grid grid-cols-3 gap-6 max-w-[320px] mx-auto">
                        <div className="aspect-square rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center space-y-2 shadow-lg shadow-blue-500/5">
                          <span className="text-3xl">💼</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Biz</span>
                        </div>
                        <div className="aspect-square rounded-[2rem] bg-pink-500/10 border border-pink-500/20 flex flex-col items-center justify-center space-y-2 shadow-lg shadow-pink-500/5">
                          <span className="text-3xl">❤️</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">Love</span>
                        </div>
                        <div className="aspect-square rounded-[2rem] bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center space-y-2 shadow-lg shadow-green-500/5">
                          <span className="text-3xl">🎓</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Edu</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">AI Chat Agents 🤖</h2>
                        <p className="text-[16px] leading-relaxed opacity-60 font-medium">
                          Ganacsi, Shukaansi, iyo Waxbarasho. Waxaan kuu haynaa agents u tababaran mowduuc kasta.
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 3 && (
                    <div className="space-y-10 text-center">
                      <div className="flex items-center justify-center space-x-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-[#0285FF]/10 border border-[#0285FF]/20 flex items-center justify-center text-4xl shadow-xl shadow-blue-500/10 animate-pulse">🎙️</div>
                        <div className="w-20 h-20 rounded-[2.5rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/10 animate-bounce">📹</div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">Voice & Video ⚡</h2>
                        <p className="text-[16px] leading-relaxed opacity-60 font-medium">
                          Ha isku koobin qoraal kaliya. La hadal AI-ga adigoo isticmaalaya cod ama muuqaal toos ah.
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 4 && (
                    <div className="space-y-10 text-center">
                      <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] border border-green-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/10">
                        <span className="text-5xl">💰</span>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight text-green-500">Earn While You Chat 📈</h2>
                        <p className="text-[16px] leading-relaxed opacity-60 font-medium">
                          Mashruuca lacag-abuurka ee DeepMind waa fure kuu furan. Lacag ka samee dadka aad keento!
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 5 && (
                    <div className="space-y-8 text-center w-full">
                      <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 relative overflow-hidden shadow-2xl shadow-green-500/5">
                        <div className="text-6xl font-black text-green-500 mb-2">40%</div>
                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-green-500/60">Commission Joogto Ah</p>
                        <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 rotate-12">💎</div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">Noqo Ambassador! 💎</h2>
                        <p className="text-[16px] leading-relaxed opacity-80 font-bold text-white">
                          Qof kasta oo aad keento, waxaad helaysaa 40% lacagta uu bixiyo. Lacagtaadu waa mid joogto ah!
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 6 && (
                    <div className="space-y-10 text-center w-full">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                          <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</span>
                          <span className="font-black text-2xl text-green-500">$450.00</span>
                        </div>
                        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                          <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Payout Status</span>
                          <span className="font-black text-lg text-blue-500">Processing...</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">Tracking & Payouts 🏦</h2>
                        <p className="text-[16px] leading-relaxed opacity-60 font-medium">
                          La soco dakhligaaga maalin kasta. Lacag bixintu waa mid toos ah (EVC Plus, iwm).
                        </p>
                      </div>
                    </div>
                  )}

                  {welcomeStep === 7 && (
                    <div className="space-y-10 text-center">
                      <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 bg-[#0285FF]/30 blur-3xl rounded-full scale-110 animate-pulse"></div>
                        <Logo size="w-32 h-32" />
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg animate-bounce">READY</div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">Diyaar ma u tahay? ✨</h2>
                        <p className="text-[16px] leading-relaxed opacity-60 font-medium">
                          Safar cusub ayaa hadda kuu bilaabanaya. Ku soo dhowow DeepMind.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* NAVIGATION FOOTER - STICKY TO BOTTOM */}
            <div className="w-full max-w-lg mx-auto space-y-10 py-6">
              {/* PROGRESS INDICATOR */}
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${welcomeStep === s ? 'w-10 bg-[#0285FF] shadow-[0_0_10px_rgba(2,133,255,0.5)]' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-4">
                {welcomeStep > 1 && (
                  <button
                    onClick={prevWelcomeStep}
                    className="flex-1 py-6 rounded-[2.5rem] bg-white/5 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all border border-white/5 hover:bg-white/10"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={nextWelcomeStep}
                  className="flex-[2] py-6 rounded-[2.5rem] gradient-bg text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-[#0285FF]/20 active:scale-95 transition-all"
                >
                  {welcomeStep === 7 ? 'Gudo Gal Hub-ka ✨' : 'Sii Soco (Next) →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(!user || isProfileIncomplete) ? (
        <Suspense fallback={
          <div className="h-screen w-screen bg-[#050810] flex items-center justify-center">
            <Logo size="w-16 h-16" spinning />
          </div>
        }>
          {showOnboarding && !user ? <OnboardingView onComplete={handleOnboardingComplete} /> : <AuthView onProfileComplete={() => setIsProfileIncomplete(false)} />}
        </Suspense>
      ) : currentPage === NavPage.ADMIN ? (
        <Suspense fallback={
          <div className="h-screen w-screen bg-[#050810] flex items-center justify-center">
            <Logo size="w-16 h-16" spinning />
          </div>
        }>
          <AdminDashboard onBack={() => setCurrentPage(NavPage.HOME)} />
        </Suspense>
      ) : (
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#050810]">
            <Logo size="w-16 h-16" spinning />
          </div>
        }>
          <>
            {/* SIDEBAR */}
            <aside className={`fixed lg:static inset-0 z-[100] lg:z-10 w-full lg:w-80 h-full transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex`}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
              <div className={`relative w-[85%] max-w-[320px] lg:w-full h-full flex flex-col border-r shadow-2xl lg:shadow-none transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] border-white/5' : 'bg-white border-slate-200'}`}>

                <div className="p-8 pb-4 flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0285FF] to-cyan-400 rounded-full blur opacity-20 animate-pulse"></div>
                    <Logo size="w-12 h-12" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0a0f1e]"></div>
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-[0.2em] text-[#0285FF] uppercase">DeepMind</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Elite Access</p>
                  </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-7 overflow-y-auto no-scrollbar">
                  <div className="px-2 mb-4">
                    <button
                      onClick={() => navigate(NavPage.CHANNEL, undefined, undefined, 'profile')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-3xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'} active:scale-95`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#0285FF]">
                        <img src="/user_profile.jpg" alt="Hamze" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center space-x-1">
                          <p className={`text-[13px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData?.fullName || 'DeepMind Admin'}</p>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0285FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                        <p className="text-[9px] font-bold text-[#0285FF] uppercase tracking-widest">Profile Portfolio</p>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <SidebarItem icon={Icons.Home} label={t('home')} isActive={currentPage === NavPage.HOME} onClick={() => navigate(NavPage.HOME)} />
                    <SidebarItem
                      icon={() => (
                        <div className="relative">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18.1H3" /></svg>
                          <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0a0f1e] shadow-sm"></div>
                        </div>
                      )}
                      label="DeepMind Channel"
                      isNew
                      status="online"
                      isActive={currentPage === NavPage.CHANNEL && channelViewMode === 'channel'}
                      onClick={() => navigate(NavPage.CHANNEL, undefined, undefined, 'channel')}
                    />
                    <SidebarItem
                      icon={Icons.Call}
                      label={t('call')}
                      isActive={currentPage === NavPage.CALL_HUB || currentPage === NavPage.CALL_DETAIL}
                      onClick={() => navigate(NavPage.CALL_HUB)}
                    />
                  </div>

                  <div className="space-y-1.5 px-3">
                    <SidebarItem
                      icon={() => (
                        <div className="relative">
                          <Icons.Premium />
                          {hasMonetizationUpdate && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0f1e] animate-pulse"></div>
                          )}
                        </div>
                      )}
                      label={t('monetization')}
                      isActive={currentPage === NavPage.MONETIZATION}
                      onClick={() => navigate(NavPage.MONETIZATION)}
                      isNew
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50 flex items-center">
                      <span>AI Chat Agents</span>
                      <span className="ml-3 h-[1px] flex-1 bg-slate-500/10"></span>
                    </p>
                    <SidebarItem icon={Icons.Chat} label={t('business_dm')} isActive={currentPage === NavPage.CHAT_DETAIL && activeChatType === 'ganacsi'} onClick={() => navigate(NavPage.CHAT_DETAIL, 'ganacsi')} />
                    <SidebarItem icon={Icons.Romance} label={t('romance_dm')} isNew isActive={currentPage === NavPage.CHAT_DETAIL && activeChatType === 'shukaansi'} onClick={() => navigate(NavPage.CHAT_DETAIL, 'shukaansi')} />

                    <SidebarItem icon={Icons.Education} label={t('education_dm')} isNew isActive={currentPage === NavPage.CHAT_DETAIL && activeChatType === 'waxbarasho'} onClick={() => navigate(NavPage.CHAT_DETAIL, 'waxbarasho')} />
                  </div>

                  <div className="space-y-1.5">
                    <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50 flex items-center">
                      <span>Hubs</span>
                      <span className="ml-3 h-[1px] flex-1 bg-slate-500/10"></span>
                    </p>
                    <SidebarItem icon={Icons.Chat} label={t('chat') + " Hub"} isActive={currentPage === NavPage.CHAT_HUB} onClick={() => navigate(NavPage.CHAT_HUB)} />
                    <SidebarItem icon={Icons.Video} label={t('video_call') + " Hub"} isSoon isActive={currentPage === NavPage.VIDEO} onClick={() => navigate(NavPage.VIDEO)} />
                  </div>
                </nav>

                <div className={`p-6 border-t ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
                  <SidebarItem icon={Icons.Setting} label={t('settings')} isActive={currentPage === NavPage.SETTING} onClick={() => navigate(NavPage.SETTING)} />
                </div>
              </div>
            </aside>

            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
              <main className="flex-1 relative h-full overflow-hidden w-full">
                {renderPage()}
              </main>

              {/* BOTTOM NAVIGATION */}
              {!["chat_detail", "call_detail", "story", "channel"].includes(currentPage) && (
                <div className="lg:hidden fixed bottom-10 left-0 right-0 z-[60] safe-area-bottom">
                  <div className="mx-6 p-2 rounded-[2.5rem] bg-black/20 backdrop-blur-3xl border border-white/5 shadow-2xl">
                    <nav className="flex justify-around items-center px-2 py-1">
                      <BottomNavItem icon={Icons.Home} label="Home" isActive={currentPage === NavPage.HOME} onClick={() => navigate(NavPage.HOME)} />
                      <BottomNavItem icon={Icons.Chat} label="Chats" isActive={currentPage === NavPage.CHAT_HUB} onClick={() => navigate(NavPage.CHAT_HUB)} />

                      <button
                        onClick={() => navigate(NavPage.VIDEO)}
                        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90"
                      >
                        <div className={`relative flex items-center justify-center w-14 h-9 rounded-full transition-all duration-300 ${currentPage === NavPage.VIDEO ? 'bg-[#0285FF] text-white shadow-lg' : 'bg-[#0285FF]/10 text-[#0285FF]'}`}>
                          <Icons.Video active={currentPage === NavPage.VIDEO} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${currentPage === NavPage.VIDEO ? 'text-[#0285FF]' : 'text-slate-400'}`}>Video</span>
                      </button>

                      <BottomNavItem icon={Icons.Call} label="Calls" isActive={currentPage === NavPage.CALL_HUB} onClick={() => navigate(NavPage.CALL_HUB)} />
                      <BottomNavItem icon={Icons.Setting} label="Settings" isActive={currentPage === NavPage.SETTING} onClick={() => navigate(NavPage.SETTING)} />
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </>
        </Suspense>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes springUp { 
          0% { transform: scale(0.8) translateY(100px); opacity: 0; }
          70% { transform: scale(1.05) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.5s ease-out; }
        .animate-spring-up { animation: springUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, isActive, isNew, isSoon, status, onClick }: any) => {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-300 ${isActive
        ? 'bg-gradient-to-r from-[#0285FF] to-[#0060BF] text-white shadow-xl shadow-[#0285FF]/20 translate-x-1'
        : 'text-slate-500 hover:bg-[#0285FF]/10 hover:text-[#0285FF]'
        }`}
    >
      <div className="flex items-center">
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70'}`}>
          <Icon active={isActive} />
        </div>
        <div className="ml-4 flex flex-col items-start">
          <div className="flex items-center space-x-2">
            <span className={`text-[14px] ${isActive ? 'font-black' : 'font-bold'} tracking-tight`}>
              {label.replace(' DM', '')}
            </span>
            {label.includes(' DM') && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-[#0285FF]/10 text-[#0285FF]'}`}>DM</span>
            )}
          </div>
          {status === 'online' && !isActive && (
            <span className="text-[8px] text-green-500 font-black uppercase tracking-widest mt-0.5">Online Now</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isNew && !isActive && (
          <span className="text-[7px] font-black bg-[#0285FF] text-white px-2 py-0.5 rounded-md animate-pulse shadow-sm shadow-[#0285FF]/40">NEW</span>
        )}
        {isSoon && !isActive && (
          <span className="text-[7px] font-black bg-slate-400 text-white px-2 py-0.5 rounded-md opacity-80 shadow-sm">SOON</span>
        )}

        {isActive && (
          <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_white]"></div>
        )}
      </div>
    </button>
  );
};

const BottomNavItem = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90">
    <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? 'text-[#0285FF]' : 'text-slate-400'}`}>
      <Icon active={isActive} />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-colors ${isActive ? 'text-[#0285FF]' : 'text-slate-400 opacity-70'}`}>{label}</span>
  </button>
);

export default App;
