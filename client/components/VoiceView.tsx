
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icons } from '../constants';
import { Theme, CallType } from '../types';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

interface VoiceViewProps {
  type: CallType;
  onBack: () => void;
  theme: Theme;
}

type CallQuality = 'excellent' | 'good' | 'poor' | 'detecting';

const VoiceView: React.FC<VoiceViewProps> = ({ type, onBack, theme }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();

  // --- States ---
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcription, setTranscription] = useState<{ role: string, text: string }[]>([]);
  const [errorStatus, setErrorStatus] = useState<boolean>(false);

  // Shukaansi specific states
  const [onboardingStep, setOnboardingStep] = useState(type === 'shukaansi' ? 'name' : 'none');
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<'man' | 'woman' | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<'Fenrir' | 'Kore' | 'Puck'>('Fenrir');

  const [quality, setQuality] = useState<CallQuality>('detecting');

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const timerIntervalRef = useRef<number | null>(null);

  const getPartnerAvatar = () => {
    if (type === 'shukaansi') {
      return userGender === 'man'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300' // Leyla
        : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300&h=300'; // Cali
    }
    if (type === 'waxbarasho') return 'https://images.unsplash.com/photo-1544717297-fa154da097e6?auto=format&fit=crop&q=80&w=300&h=300';
    return 'https://images.unsplash.com/photo-1519085185603-3a111d67440d?auto=format&fit=crop&q=80&w=300&h=300';
  };

  const getPartnerName = () => {
    if (type === 'shukaansi') return userGender === 'man' ? 'Leyla' : 'Cali';
    return 'DeepMind';
  };

  const cleanup = useCallback(() => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (timerIntervalRef.current) { window.clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    setCallSeconds(0);
    nextStartTimeRef.current = 0;
  }, []);

  const startCall = async () => {
    alert(language === 'so' ? "Wicitaanada hadda waxaa lagu socodsiiyaa update xagga dambe ah. Fadlan dib isku day." : "Voice calls are currently being updated. Please try again later.");
    return;
  };

  useEffect(() => { return cleanup; }, [cleanup]);

  const handleGenderSelect = (gender: 'man' | 'woman') => {
    setUserGender(gender);
    setSelectedVoice(gender === 'man' ? 'Kore' : 'Fenrir');
    setOnboardingStep('none');
  };

  // --- CREDIT ERROR PAGE ---
  if (errorStatus) {
    return (
      <div className="fixed inset-0 z-[500] bg-white flex flex-col items-center p-8 overflow-y-auto no-scrollbar animate-fade-in text-slate-900">
        <header className="w-full flex justify-end mb-8">
          <button onClick={() => setErrorStatus(false)} className="p-3 bg-slate-100 rounded-full active:scale-90 transition-transform">
            <Icons.Close />
          </button>
        </header>

        <div className="w-full max-w-sm space-y-8 flex-1 flex flex-col justify-center pb-20">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-red-600 animate-pulse">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-red-600">{language === 'so' ? 'Xaddigii wuu dhamaaday' : 'Limit Reached'}</h2>
            <p className="text-[15px] leading-relaxed font-bold text-slate-500">
              {language === 'so' ? 'Mahaysatid creddit aad ku isticmaashid appkuna wuxuu ku jiraa xaalad tijaabo...' : 'You do not have enough credits to proceed as the app is in trial mode.'}
            </p>
          </div>

          <button
            onClick={() => setErrorStatus(false)}
            className="w-full py-5 rounded-[1.8rem] bg-slate-100 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 hover:bg-slate-200 transition-colors"
          >
            {language === 'so' ? 'Sii wad hadda' : 'Continue for now'}
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStep === 'name') {
    return (
      <div className={`flex flex-col h-full items-center justify-center p-8 transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#F7F9FC] text-[#0a1b3d]'}`}>
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight">{t('romance_dm')} ❤️</h2>
            <p className="opacity-50 font-bold">{language === 'so' ? 'Waa maxay magacaaga?' : 'What is your name?'}</p>
          </div>
          <input
            autoFocus
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={language === 'so' ? "Qor magacaaga..." : "Type your name..."}
            className={`w-full p-6 rounded-[2rem] border text-center font-black text-xl outline-none focus:border-[#0285FF] transition-colors ${isDark ? 'bg-[#111622] border-white/10' : 'bg-white border-slate-200'}`}
          />
          <button
            disabled={!userName.trim()}
            onClick={() => setOnboardingStep('gender')}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-white transition-all active:scale-95 ${!userName.trim() ? 'bg-slate-300' : 'gradient-bg shadow-xl shadow-[#0285FF]/20'}`}
          >
            {t('view_all').replace('View All', 'Continue').replace('Eeg Dhammaan', 'Sii wad')}
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStep === 'gender') {
    return (
      <div className={`flex flex-col h-full items-center justify-center p-8 transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#F7F9FC] text-[#0a1b3d]'}`}>
        <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
          <h2 className="text-2xl font-black">{language === 'so' ? 'Adigu maxaad tahay? 👫' : 'What is your gender? 👫'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleGenderSelect('man')} className={`p-8 rounded-[2.5rem] border flex flex-col items-center space-y-4 transition-all active:scale-95 ${isDark ? 'bg-[#111622] border-white/10' : 'bg-white border-slate-200'}`}>
              <span className="text-4xl">👨</span>
              <span className="font-black uppercase tracking-widest text-xs">{language === 'so' ? 'Nin' : 'Man'}</span>
            </button>
            <button onClick={() => handleGenderSelect('woman')} className={`p-8 rounded-[2.5rem] border flex flex-col items-center space-y-4 transition-all active:scale-95 ${isDark ? 'bg-[#111622] border-white/10' : 'bg-white border-slate-200'}`}>
              <span className="text-4xl">👩</span>
              <span className="font-black uppercase tracking-widest text-xs">{language === 'so' ? 'Naag' : 'Woman'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050810] text-white' : 'bg-[#F7F9FC] text-[#0a1b3d]'}`}>
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button onClick={() => { cleanup(); onBack(); }} className="p-2 text-slate-400"><Icons.Close /></button>
        <div className="text-center">
          <h2 className="text-[14px] font-black uppercase tracking-widest">{getPartnerName()}</h2>
          <p className="text-[10px] font-bold text-green-500 animate-pulse">{isActive ? 'CALL ACTIVE' : isConnecting ? t('connecting').toUpperCase() : 'READY'}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <div className={`w-56 h-56 rounded-full p-1.5 shadow-2xl relative z-10 ${isActive ? 'ring-4 ring-green-500/20' : ''}`}>
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-[#111622]">
            <img src={getPartnerAvatar()} alt="AI" className="w-full h-full object-cover" />
          </div>
          {isActive && (
            <div className="absolute -bottom-2 right-4 bg-green-500 p-2 rounded-full border-4 border-white dark:border-[#111622] shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center space-y-2">
          <h1 className="text-2xl font-black">{getPartnerName()}</h1>
          <p className="text-sm font-bold opacity-50">{isActive ? new Date(callSeconds * 1000).toISOString().substr(14, 5) : (language === 'so' ? 'Wicitaan Cod ah' : 'Voice Call')}</p>
        </div>

        {showTranscription && transcription.length > 0 && (
          <div className="mt-6 w-full max-w-xs bg-black/5 dark:bg-white/5 p-4 rounded-2xl text-center">
            <p className="text-xs font-bold leading-relaxed">{transcription[transcription.length - 1].text}</p>
          </div>
        )}
      </div>

      <div className="p-8 pb-12 flex flex-col space-y-4">
        {!isActive && !isConnecting ? (
          <button onClick={startCall} className="w-full py-5 rounded-[2.5rem] gradient-bg text-white font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all">
            <Icons.Call />
            <span>{language === 'so' ? 'Bilaaw Wicitaanka' : 'Start Call'}</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-6 rounded-[2rem] flex items-center justify-center border ${isMuted ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
              <Icons.Mic active={!isMuted} />
            </button>
            <button onClick={() => { cleanup(); onBack(); }} className="p-6 rounded-[2rem] bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <div className="rotate-[135deg]"><Icons.Call /></div>
            </button>
            <button onClick={() => setShowTranscription(!showTranscription)} className={`p-6 rounded-[2rem] flex items-center justify-center border ${showTranscription ? 'bg-[#0285FF] text-white border-[#0285FF]' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
              <Icons.Chat />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default VoiceView;
