
import React, { useState, useRef, useEffect } from 'react';
// GoogleGenAI import removed - using Backend API
import { Icons } from '../constants';
import { Message, Theme, ChatType } from '../types';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';
import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot, collection, addDoc, query, orderBy, limit, where } from 'firebase/firestore';

interface ChatViewProps {
  type: ChatType;
  onBack: () => void;
  onSwitchChat?: (type: ChatType) => void;
  theme: Theme;
}

type RomanceMode = 'tutor' | 'simulation' | null;

const ChatView: React.FC<ChatViewProps> = ({ type, onBack, onSwitchChat, theme }) => {
  const isDark = true; // Always dark mode
  const { language, t } = useLanguage();

  const [romanceMode, setRomanceMode] = useState<RomanceMode>(null);
  const [eduSchool, setEduSchool] = useState<string | null>(null);
  const [eduSchoolName, setEduSchoolName] = useState<string | null>(null);
  const [eduClass, setEduClass] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<'man' | 'woman' | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zaad' | 'edahab' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [memberCount, setMemberCount] = useState(0);

  const [onboardingStep, setOnboardingStep] = useState<string>(
    type === 'shukaansi' ? 'romance_mode' :
      type === 'waxbarasho' ? 'edu_warning' : 'none'
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [visibleAdIds, setVisibleAdIds] = useState<Set<string>>(new Set(['welcome']));
  const [adLoadingIds, setAdLoadingIds] = useState<Set<string>>(new Set());

  // Education Internal Sidebar State
  const [isInternalSideOpen, setIsInternalSideOpen] = useState(false);
  const [activeSubMode, setActiveSubMode] = useState<'group' | 'private'>('group');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ id: string, title: string, timestamp: number }[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  // Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const socialLinks = {
    facebook: 'https://www.facebook.com/share/17MxPceJvZ/',
    tiktok: 'https://www.tiktok.com/@hamze.zinson?_r=1&_t=ZS-93GloSWjqo4',
    telegram: 'https://t.me/DeepMind_news',
    whatsapp: 'https://wa.me/252637930329'
  };

  // Check Subscription Status
  useEffect(() => {
    const isEdu = type === 'waxbarasho' || type === 'waxbarasho_group' || type === 'waxbarasho_private';
    if (isEdu && auth.currentUser) {
      const unsub = onSnapshot(doc(db, "subscriptions", auth.currentUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSubscriptionStatus(data.status);
            if (data.status === 'approved') {
              // Only clear onboarding for the generic type
              if (type === 'waxbarasho') setOnboardingStep('none');
              setEduSchoolName(data.schoolName);
              setEduClass(data.className);
            } else if (data.status === 'pending') {
              if (type === 'waxbarasho') setOnboardingStep('edu_pending');
            } else if (data.status === 'rejected') {
              if (type === 'waxbarasho') setOnboardingStep('edu_rejected');
            }
          }
        },
        (err) => console.error("Subscription status listener error:", err)
      );
      return () => unsub();
    }
  }, [type]);

  const groupId = (['waxbarasho', 'waxbarasho_group'].includes(type) && eduSchoolName && eduClass) ? `${eduSchoolName}_${eduClass}`.replace(/\s+/g, '_') : null;

  // Sync Messages (Dual Mode Support)
  useEffect(() => {
    const isEdu = ['waxbarasho', 'waxbarasho_group', 'waxbarasho_private'].includes(type);

    // Basic validation
    if (isEdu && subscriptionStatus !== 'approved') {
      setLoadingMessages(false);
      return;
    }

    // Reset messages when switching modes
    setLoadingMessages(true);
    setMessages([]);

    let q;
    if (activeSubMode === 'group' && groupId) {
      q = query(
        collection(db, "group_chats", groupId, "messages"),
        orderBy("timestamp", "asc"),
        limit(100)
      );
    } else if (activeSubMode === 'private' && auth.currentUser) {
      // Private Chat: Stored in users/{uid}/chats/waxbarasho_private/messages
      q = query(
        collection(db, "users", auth.currentUser.uid, "chats", "waxbarasho_private", "messages"),
        orderBy("timestamp", "asc"),
        limit(100)
      );
    } else {
      // Fallback for non-education chats (legacy behavior)
      setLoadingMessages(false);
      return;
    }

    const unsub = onSnapshot(q,
      (snap) => {
        const msgs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

        if (msgs.length > 0) {
          setMessages(msgs);
        } else if (activeSubMode === 'private') {
          // If private chat is empty, show welcome
          setMessages([{
            id: 'welcome_private',
            role: 'model',
            text: `Haye ${userName}! 👋 Waxaan ahay macalinkaaga gaarka ah (Private Tutor). I waydii wax kasta oo ku saabsan ${eduClass}, diyaar baan u ahay inaan kuu sharaxo. 📚✨`,
            timestamp: Date.now()
          }]);
        }
        setLoadingMessages(false);
      },
      (err) => {
        console.error("Messages listener error:", err);
        setLoadingMessages(false);
      }
    );
    return () => unsub();
  }, [groupId, subscriptionStatus, activeSubMode, type, eduSchoolName, eduClass]);

  // Sync Member Count
  useEffect(() => {
    if (type === 'waxbarasho' && eduSchoolName && eduClass) {
      const q = query(
        collection(db, "subscriptions"),
        where("schoolName", "==", eduSchoolName),
        where("className", "==", eduClass),
        where("status", "==", "approved")
      );
      const unsub = onSnapshot(q,
        (snap) => {
          setMemberCount(snap.size);
        },
        (err) => console.error("Member count listener error:", err)
      );
      return () => unsub();
    }
  }, [type, eduSchoolName, eduClass]);

  useEffect(() => {
    // Only set initial welcome for Non-Education chats OR if in Group mode and empty
    if (type !== 'waxbarasho' && onboardingStep === 'none' && messages.length === 0) {
      let welcomeText = `Haye saaxiib! 👋 Waxaan ahay kaaliyahaaga ${type}. Sideen maanta isku caawinaa? 😊✨`;
      if (type === 'shukaansi') {
        if (romanceMode === 'simulation') {
          const aiName = userGender === 'man' ? 'Leyla' : 'Cali';
          welcomeText = `Abaayo/Aboowe ${userName}, noloshaada ku soo dhowow ${aiName}. Sidee kuugu raaxeeyaa maanta? ❤️✨`;
        } else {
          welcomeText = `Soo dhowow ${userName} gacaliye! 🤗 Waxaan ahay khabiirkaaga shukaansiga. Sawir ii soo dir aan ku falanqeeyo "War bal aan kaa eego qofka e..." 😉🔥`;
        }
      } else if (type === 'ganacsi') {
        welcomeText = `Haye ganacsade ${userName}! 💼💰 Maanta maxaan dhisnaa? Ma fikrad cusub mise macaamiishii ayaan badinaa? 😊🚀`;
      }
      setMessages([{ id: 'welcome', role: 'model', text: welcomeText, timestamp: Date.now() }]);
    }
  }, [onboardingStep, type, activeSubMode]);

  useEffect(() => {
    if (scrollRef.current && isAutoScrollEnabled.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollEnabled.current = isAtBottom;
  };

  const handleReaction = (msgId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, reaction: m.reaction === type ? null : type } : m
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setIsMenuOpen(false);
  };

  const handleSend = async () => {
    const currentInput = input;
    const currentImages = [...selectedImages];

    // 1. Clear input immediately for better UX
    setInput('');
    setSelectedImages([]);

    const modelMsgId = (Date.now() + 1).toString();
    const userMsgId = Date.now().toString();
    const currentUserName = userName || auth.currentUser?.displayName || 'User';

    setIsThinking(true);
    setIsGenerating(true);
    isAutoScrollEnabled.current = true;
    setIsMenuOpen(false);

    // 2. Optimistic Update (Show user message immediately)
    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: currentInput,
      senderName: currentUserName,
      senderUid: auth.currentUser?.uid,
      timestamp: Date.now(),
      images: currentImages.length > 0 ? currentImages : undefined
    };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const isEdu = type === 'waxbarasho';
      const mode = isEdu ? activeSubMode : 'group';

      // 3. Background Save to Firestore (Wrapped to prevent blocking)
      const saveToFirestore = async () => {
        try {
          const { id, ...msgData } = newUserMsg;
          if (msgData.images === undefined) delete msgData.images;

          if (isEdu && mode === 'group' && groupId) {
            await addDoc(collection(db, "group_chats", groupId, "messages"), msgData);
          } else if (isEdu && mode === 'private' && auth.currentUser) {
            await addDoc(collection(db, "users", auth.currentUser.uid, "chats", "waxbarasho_private", "messages"), msgData);
          }
        } catch (fsErr) {
          console.error("Firestore Background Save Error:", fsErr);
        }
      };
      saveToFirestore();

      // API Call
      let response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            type,
            history: messages.slice(-10), // Send last 10 messages for context
            chatMode: type === 'waxbarasho' ? activeSubMode : undefined,
            eduSchoolName: type === 'waxbarasho' ? eduSchoolName : undefined,
            eduClass: type === 'waxbarasho' ? eduClass : undefined,
            images: currentImages
          })
        });
      } catch (fetchErr) {
        throw fetchErr;
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const fullText = data.text;

      // 4. Optimistic update for AI Message
      const newModelMsg: Message = { id: modelMsgId, role: 'model', text: fullText, timestamp: Date.now() };
      setMessages(prev => [...prev, newModelMsg]);

      // 5. Background Save AI Response
      const saveAIResponse = async () => {
        try {
          const aiMsgData = { role: 'model', text: fullText, timestamp: Date.now() };
          if (isEdu && mode === 'group' && groupId) {
            await addDoc(collection(db, "group_chats", groupId, "messages"), aiMsgData);
          } else if (isEdu && mode === 'private' && auth.currentUser) {
            await addDoc(collection(db, "users", auth.currentUser.uid, "chats", "waxbarasho_private", "messages"), aiMsgData);
          }
        } catch (fsErr) {
          console.error("AI Save Error Background:", fsErr);
        }
      };
      saveAIResponse();

      setAdLoadingIds(prev => new Set(prev).add(modelMsgId));
      setTimeout(() => {
        setAdLoadingIds(prev => {
          const next = new Set(prev);
          next.delete(modelMsgId);
          return next;
        });
        setVisibleAdIds(prev => new Set(prev).add(modelMsgId));
      }, 1500);

    } catch (e) {
      console.error("HandleSend Error:", e);

      const isPermissionError = e instanceof Error && e.message.toLowerCase().includes("permission");
      const errorText = isPermissionError ? "[PERMISSION_ERROR]" : "[AI_OFFLINE_ERROR]";

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorText, timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
      setIsGenerating(false);
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;

    if (text === "[AI_OFFLINE_ERROR]" || text === "[PERMISSION_ERROR]") {
      const isPermission = text === "[PERMISSION_ERROR]";
      return (
        <div className="space-y-6 py-2">
          <div className="flex items-center space-x-3 text-red-500 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
              <Icons.Close />
            </div>
            <p className="font-black text-sm uppercase tracking-tight">
              {isPermission
                ? (language === 'so' ? "OGOLAANSHO LA'AAN" : 'PERMISSION DENIED')
                : (language === 'so' ? 'AI-GA WAA OFFLINE' : 'AI IS OFFLINE')}
            </p>
          </div>
          <p className="text-[14px] leading-relaxed font-bold opacity-80">
            {isPermission
              ? (language === 'so' ? 'Cilad xaga firestore-ka ah: Ma haysatid ogolaansho aad wax ugu dhigtid ama uga akhrisatid chat-ka. Fadlan la xiriir maamulka.' : 'Firestore permission error: You do not have permission to read/write to this chat. Please contact admin.')
              : (language === 'so' ? 'Cilad: AI-ga lama xiriiri karo. Tan waxay u badan tahay in API KEY-ga uusan sax ahayn ama uu maqan yahay.' : 'Error: Could not connect to the AI. This usually means the API KEY is missing or invalid on the server.')}
          </p>
        </div>
      );
    }

    const redirectMatch = text.match(/\[REDIRECT:(.*?)\]/);
    const cleanText = text.replace(/\[REDIRECT:.*?\]/, '');
    const redirectType = redirectMatch ? redirectMatch[1] : null;

    // Advanced Markdown Parsing Logic
    const lines = cleanText.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[][] = [];
    let inTable = false;

    const parseLineContent = (content: string) => {
      const parts = content.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-[#0285FF] font-black">{part.replace(/\*\*/g, '')}</strong>;
        }
        // Handle Arrows as seen in user image
        if (part.includes('$\rightarrow$')) {
          const subParts = part.split('$\rightarrow$');
          return <span key={index}>{subParts[0]} <span className="text-[#0285FF] font-black">➔</span> {subParts[1]}</span>;
        }
        return part;
      });
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      // Table handling
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const row = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        // Skip separator row |---|---|
        if (row.every(cell => cell.match(/^-+$/))) return;
        tableRows.push(row);
        return;
      } else if (inTable) {
        // Render collected table
        if (tableRows.length > 0) {
          const rows = [...tableRows];
          elements.push(
            <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
              <table className="w-full text-xs text-left">
                <thead className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                  <tr>
                    {rows[0].map((cell, idx) => (
                      <th key={idx} className="p-3 font-black uppercase tracking-widest text-[#0285FF] border-b border-slate-200 dark:border-white/5">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-0 border-slate-200 dark:border-white/5">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 font-medium opacity-80">{parseLineContent(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        tableRows = [];
        inTable = false;
      }

      if (!trimmed) {
        elements.push(<div key={i} className="h-3"></div>);
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg font-black mt-6 mb-2 tracking-tight text-[#0285FF] uppercase">{parseLineContent(trimmed.replace('### ', ''))}</h3>);
      } else if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={i} className="text-sm font-black mt-4 mb-2 tracking-wider text-[#0285FF] uppercase">{parseLineContent(trimmed.replace('#### ', ''))}</h4>);
      } else if (trimmed.match(/^\d+\.\s/)) {
        // Numbered list
        const content = trimmed.replace(/^\d+\.\s/, '');
        elements.push(<div key={i} className="flex items-start space-x-3 mb-2 ml-1"><span className="text-[#0285FF] font-black min-w-[1.2rem]">{trimmed.match(/^\d+/)?.[0]}.</span><div className="flex-1">{parseLineContent(content)}</div></div>);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        // Bullet list
        const content = trimmed.replace(/^[\*\-]\s/, '');
        elements.push(<div key={i} className="flex items-start space-x-3 mb-2 ml-4"><span className="text-[#0285FF] mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0285FF] shrink-0"></span><div className="flex-1">{parseLineContent(content)}</div></div>);
      } else {
        // Regular paragraph
        elements.push(<p key={i} className="mb-2 leading-relaxed font-medium opacity-90">{parseLineContent(trimmed)}</p>);
      }
    });

    if (redirectType) {
      const hubNames: Record<string, string> = { 'waxbarasho': 'Waxbarasho AI 🎓', 'ganacsi': 'Ganacsi AI 💼', 'shukaansi': 'Shukaansi AI ❤️' };
      const hubGradients: Record<string, string> = { 'waxbarasho': 'bg-blue-600 shadow-blue-500/20', 'ganacsi': 'bg-[#0285FF] shadow-[#0285FF]/20', 'shukaansi': 'bg-pink-600 shadow-pink-500/20' };
      elements.push(
        <div key="redirect" className="mt-6 animate-fade-in">
          <button onClick={() => onSwitchChat?.(redirectType as ChatType)} className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all ${hubGradients[redirectType] || 'bg-slate-700'}`}>
            <span>U gudub {hubNames[redirectType] || redirectType}</span>
            <Icons.Send />
          </button>
        </div>
      );
    }
    return elements;
  };

  const TelegramAdSection = ({ isLoading = false }: { isLoading?: boolean }) => (
    <div className={`mt-3 relative rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 shadow-xl ${isDark ? 'bg-[#1c1c1e]' : 'bg-white border-slate-100'} ${isLoading ? 'animate-pulse' : 'opacity-100'}`}>
      <div className="absolute top-0 left-0 bottom-0 w-[4px] gradient-bg"></div>
      <div className="p-5 pr-14">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-[#0285FF] text-[12px] font-black uppercase tracking-widest">Sponsored</span>
        </div>
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className={`h-3 w-3/4 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`h-2.5 w-full rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
          </div>
        ) : (
          <>
            <h4 className={`text-[15px] font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>DeepMind Official</h4>
            <p className={`text-[13px] leading-snug font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Ku soo dhowow nidaamka ugu casrisan ee DeepMind.
            </p>
          </>
        )}
        {!isLoading && (
          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
            <a href="https://www.facebook.com/H.zinson" target="_blank" className="text-[#0285FF] text-[12px] font-black uppercase tracking-[0.2em] block text-center py-1 active:scale-95 transition-transform">View</a>
          </div>
        )}
      </div>
    </div>
  );

  const renderOnboarding = () => {
    const ChoiceCard = ({ icon, title, desc, status, onClick, isActive = true, color = 'blue' }: any) => (
      <button
        disabled={!isActive}
        onClick={onClick}
        className={`w-full group relative overflow-hidden text-left p-6 rounded-[2.5rem] border transition-all duration-300 ${!isActive
          ? 'opacity-40 grayscale pointer-events-none'
          : 'active:scale-[0.97] hover:shadow-xl'
          } ${isDark
            ? 'bg-[#111622] border-white/5'
            : 'bg-white border-slate-200 shadow-sm'
          }`}
      >
        <div className="flex items-center space-x-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${color === 'pink' ? 'bg-pink-500/10 text-pink-500' :
            color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-[#0285FF]/10 text-[#0285FF]'
            }`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black tracking-tight">{title}</h3>
              {status && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${status === 'ACTIVE' ? 'bg-green-500 text-white' :
                  status === 'NEW' ? 'bg-[#0285FF] text-white' : 'bg-slate-400 text-white'
                  }`}>
                  {status}
                </span>
              )}
            </div>
            <p className="text-xs font-medium opacity-60 leading-relaxed line-clamp-1">{desc}</p>
          </div>
        </div>
      </button>
    );

    if (type === 'waxbarasho' && onboardingStep === 'edu_warning') {
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-4xl animate-bounce">📢</div>
          <div className="text-center space-y-4 max-w-xs">
            <h2 className="text-3xl font-black tracking-tight">Ogaysiis 🎓</h2>
            <p className="opacity-70 text-[15px] font-medium leading-relaxed">Ku soo dhowow nidaamka waxbarashada. Waxaan diyaar u nahay af-Soomaali, English iyo Arabic. Dooro dugsigaaga si aad u bilowdo.</p>
          </div>
          <button onClick={() => setOnboardingStep('edu_school')} className="w-full py-5 rounded-[2.2rem] bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Sii wad ✨</button>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_school') {
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-black tracking-tight">Heerkaaga? 🎓</h2>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Dooro Heerka Waxbarashada</p>
          </div>
          <div className="w-full space-y-4 max-w-sm">
            <ChoiceCard icon="🏢" title="Secondary School" desc="Heerka dugsiga sare ee Secondary." status="ACTIVE" color="blue" onClick={() => { setEduSchool('Secondary'); setOnboardingStep('edu_school_list'); }} />
            <ChoiceCard icon="🏰" title="Dugsiga Dhexe" desc="Level-ka u dhexeeya Primary & Secondary." status="ACTIVE" color="blue" onClick={() => { setEduSchool('Middle'); setOnboardingStep('edu_class'); }} />
            <ChoiceCard icon="🏫" title="Dugsiga Hoose" desc="Aasaaska waxbarashada ubadka." status="ACTIVE" color="blue" onClick={() => { setEduSchool('Primary'); setOnboardingStep('edu_class'); }} />
            <ChoiceCard icon="🏛️" title="Machad (Institute)" desc="Xarumaha barashada luqadaha & xirfada." status="ACTIVE" color="blue" onClick={() => { setEduSchool('Institute'); setOnboardingStep('edu_class'); }} />
          </div>
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white">Dib u noqo</button>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_school_list') {
      const schools = [
        "Al-Nuur secondary school",
        "Sh.ibraahim secondry school/hadraawi",
        "Dayaxa secondary school",
        "Mustaqbal secondary school",
        "Smart secondary school"
      ];
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-6 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-black tracking-tight">Dugsigaaga? 🏢</h2>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Dooro Iskuulkaaga</p>
          </div>
          <div className="w-full space-y-3 max-w-sm overflow-y-auto max-h-[60vh] no-scrollbar">
            {schools.map(s => (
              <button key={s} onClick={() => { setEduSchoolName(s); setOnboardingStep('edu_class'); }} className={`w-full p-5 rounded-2xl border text-left font-bold text-sm transition-all active:scale-[0.98] ${isDark ? 'bg-[#111622] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>{s}</button>
            ))}
          </div>
          <button onClick={() => setOnboardingStep('edu_school')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white">Dib u noqo</button>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_class') {
      let classes: string[] = [];
      if (eduSchool === 'Secondary') classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
      else if (eduSchool === 'Middle') classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4']; // Note: Local context usually calls 5-8 primary or middle, user said "Form1--Form3" and "Class 8", "Class 7--1"

      // Correcting based on user request:
      if (eduSchool === 'Secondary') {
        classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
      } else {
        classes = ['Class 8', 'Class 7', 'Class 6', 'Class 5', 'Class 4', 'Class 3', 'Class 2', 'Class 1'];
      }

      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-black tracking-tight">Fasalkaaga? 📖</h2>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Dooro Fasalka aad dhigato</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm overflow-y-auto max-h-[50vh] no-scrollbar">
            {classes.map(c => (
              <button key={c} onClick={() => { setEduClass(c); setOnboardingStep('edu_disclaimer'); }} className={`p-6 rounded-[1.8rem] border font-black text-lg transition-all active:scale-95 shadow-sm ${isDark ? 'bg-[#111622] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setOnboardingStep('edu_school')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white">Dib u noqo</button>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_disclaimer') {
      const title = eduSchoolName || eduSchool;
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="w-20 h-20 bg-[#0285FF]/10 rounded-full flex items-center justify-center text-4xl">⚠️</div>
          <div className="text-center space-y-4 max-w-xs">
            <h2 className="text-2xl font-black tracking-tight text-[#0285FF]">Ogow! 📢</h2>
            <p className="opacity-70 text-[14px] font-medium leading-relaxed">
              Aigani maaha mid aad si gaar ah ula sheekaysanayso. Waxaad gelaysaa **Group** ay ku jiraan ardayda kale ee doortay **{title}** iyo **{eduClass}**. Waxaad tihiin hal class oo AI-ga wada isticmaalaya.
            </p>
          </div>
          <button onClick={() => setOnboardingStep('edu_payment')} className="w-full max-w-xs py-5 rounded-[2.2rem] bg-[#0060BF] text-white font-black uppercase tracking-widest shadow-xl shadow-[#0285FF]/20 active:scale-95 transition-all">Waan fahmay, Sii wad ✅</button>
        </div>
      );
    }

    const getPrice = () => {
      if (eduClass === 'Form 4') return '50,000 SLSH';
      if (eduClass?.includes('Form')) return '10,000 SLSH';
      if (eduClass === 'Class 8') return '30,000 SLSH';
      return '10,000 SLSH';
    };

    if (type === 'waxbarasho' && onboardingStep === 'edu_payment') {
      const handlePaymentSubmit = async () => {
        if (paymentPhone.length < 9) {
          alert("Fadlan geli number sax ah (ugu yaraan 9 god).");
          return;
        }
        if (!paymentMethod) {
          alert("Fadlan dooro nidaamka aad lacagta ku soo dirtay (Zaad ama E-Dahab).");
          return;
        }
        setLoading(true);
        try {
          if (auth.currentUser) {
            await setDoc(doc(db, "subscriptions", auth.currentUser.uid), {
              uid: auth.currentUser.uid,
              userEmail: auth.currentUser.email,
              school: eduSchool,
              schoolName: eduSchoolName || eduSchool,
              className: eduClass,
              transactionPhone: paymentPhone,
              paymentMethod: paymentMethod,
              promoCode: promoCode.trim().toUpperCase(),
              amount: getPrice(),
              status: 'pending',
              timestamp: serverTimestamp()
            });
            setOnboardingStep('edu_pending');
          }
        } catch (e) {
          alert("Cilad ayaa dhacday markii lacagta la diiwaangelinayey.");
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className={`flex flex-col h-full p-6 items-center justify-center space-y-6 animate-fade-in ltr overflow-y-auto no-scrollbar ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-white">Lacag Bixinta 💸</h2>
            <div className="bg-[#0285FF]/10 px-6 py-2 rounded-full inline-block border border-[#0285FF]/20">
              <span className="text-[#0285FF] font-black text-2xl tracking-tight">{getPrice()}</span>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-5">
            {/* Step 1: Choose Method */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">1. Dooro Habka Lacag Bixinta</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('zaad')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${paymentMethod === 'zaad' ? 'border-[#0285FF] bg-[#0285FF]/10' : 'border-white/5 bg-[#111622]'}`}
                >
                  <span className="text-2xl">📱</span>
                  <span className="font-black text-[12px]">ZAAD (Telesom)</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('edahab')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${paymentMethod === 'edahab' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-[#111622]'}`}
                >
                  <span className="text-2xl">💰</span>
                  <span className="font-black text-[12px]">E-Dahab (Somtel)</span>
                </button>
              </div>
            </div>

            {/* Step 2: Payment Details */}
            {paymentMethod && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-[#111622] p-5 rounded-[2rem] border border-white/5 shadow-xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">LACAGTA KU SOO DIR NUMBERKAN:</p>
                  <h3 className="text-3xl font-black text-white tracking-[0.1em]">
                    {paymentMethod === 'zaad' ? '637930329' : '659119779'}
                  </h3>
                  <p className="text-[11px] font-bold text-[#0285FF] mt-2 uppercase tracking-tighter">Magaca: Xamze Maxamuud Cali</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">2. Geli Numberkaaga & Promo Code</p>
                  <div className="space-y-3">
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder={paymentMethod === 'zaad' ? "63XXXXXXX" : "65XXXXXXX"}
                      className="w-full bg-[#111622] border border-white/10 focus:border-[#0285FF]/50 rounded-2xl py-4 px-6 outline-none text-white font-black text-center text-xl shadow-inner"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promocode (Optional)"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-slate-400 font-bold text-sm text-center tracking-widest focus:border-blue-500/30 transition-all"
                      />
                      {promoCode && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">Verified</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={loading}
                  className="w-full py-5 rounded-[2.2rem] bg-[#0285FF] text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Diiwaangelin...' : 'Xaqiiji Lacagta 🚀'}
                </button>
              </div>
            )}

            <button onClick={() => setOnboardingStep('edu_disclaimer')} className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 text-center py-2 hover:text-white transition-colors">Dib u noqo</button>
          </div>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_pending') {
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-10 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="w-32 h-32 relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="relative w-full h-full bg-blue-500/10 rounded-full flex items-center justify-center text-6xl">⏳</div>
          </div>
          <div className="text-center space-y-4 max-w-sm">
            <h2 className="text-3xl font-black tracking-tight">Waa lagu helay! 📨</h2>
            <p className="opacity-70 text-[16px] font-bold leading-relaxed px-4">
              Waan helay codsigaaga. Fadlan wax yar sug inta Admin-ku uu xaqiijinayo lacagtaada. Gidaha 10-30 daqiiqo ayaa lagaa jawaabayaa.
            </p>
          </div>
          <button onClick={onBack} className="py-4 px-10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all">Ka bax</button>
        </div>
      );
    }

    if (type === 'waxbarasho' && onboardingStep === 'edu_rejected') {
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-10 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <div className="w-32 h-32 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
            <div className="relative w-full h-full bg-red-500/10 rounded-full flex items-center justify-center text-6xl">❌</div>
          </div>
          <div className="text-center space-y-4 max-w-sm">
            <h2 className="text-3xl font-black tracking-tight text-red-500">Waa lagaa diiday! 🛑</h2>
            <p className="opacity-70 text-[16px] font-bold leading-relaxed px-4 text-slate-400">
              Lacagtaada lama xaqiijin. Fadlan mar kale isku day oo numberka aad kasoo dirtay iska sax.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <button onClick={() => setOnboardingStep('edu_payment')} className="w-full py-5 rounded-[2.2rem] bg-[#0060BF] text-white font-black uppercase tracking-widest shadow-xl shadow-[#0285FF]/20 active:scale-95 transition-all">Isku day mar kale 🔄</button>
            <button onClick={onBack} className="w-full py-4 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all text-center">Ka bax</button>
          </div>
        </div>
      );
    }

    if (type === 'shukaansi' && onboardingStep === 'romance_mode') {
      return (
        <div className={`flex flex-col h-full p-8 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <Logo size="w-24 h-24" />
          <h2 className="text-3xl font-black tracking-tight mb-2 text-center">Shukaansi AI ❤️</h2>
          <div className="w-full space-y-4 max-w-sm">
            <ChoiceCard icon="🎓" title="Barasho (Coach)" desc="Baro qaabka loo shukaansado." status="ACTIVE" color="pink" onClick={() => { setRomanceMode('tutor'); setOnboardingStep('name'); }} />
            <ChoiceCard icon="💑" title="Matalaad (Simulation)" desc="Kula haasaw AI-ga." status="ACTIVE" color="pink" onClick={() => { setRomanceMode('simulation'); setOnboardingStep('name'); }} />
          </div>
        </div>
      );
    }

    if (onboardingStep === 'name') {
      return (
        <div className={`flex flex-col h-full p-10 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <h2 className="text-4xl font-black tracking-tight mb-2">Magacaaga? 😊</h2>
          <input autoFocus type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Qor magacaaga..." className={`w-full max-w-sm p-6 rounded-[2.2rem] border text-center font-black text-2xl outline-none transition-all ${isDark ? 'bg-[#111622] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
          <button disabled={!userName.trim()} onClick={() => setOnboardingStep(type === 'shukaansi' ? 'gender' : 'none')} className={`w-full max-w-sm py-5 rounded-[2.2rem] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${!userName.trim() ? 'bg-slate-300' : 'bg-[#0060BF] text-white shadow-[#0285FF]/20'}`}>Sii wad ✨</button>
        </div>
      );
    }

    if (onboardingStep === 'gender') {
      return (
        <div className={`flex flex-col h-full p-10 items-center justify-center space-y-8 animate-fade-in ${isDark ? 'bg-[#050810]' : 'bg-[#f7f9fc]'}`}>
          <h2 className="text-3xl font-black tracking-tight">Jinsigaaga? 👫</h2>
          <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
            <button onClick={() => { setUserGender('man'); setOnboardingStep('none'); }} className={`group p-10 rounded-[2.5rem] border flex flex-col items-center space-y-4 transition-all active:scale-95 ${isDark ? 'bg-[#111622] border-white/10' : 'bg-white border-slate-200'}`}><span className="text-5xl">👨</span><span className="font-black text-xs uppercase tracking-widest">NIN</span></button>
            <button onClick={() => { setUserGender('woman'); setOnboardingStep('none'); }} className={`group p-10 rounded-[2.5rem] border flex flex-col items-center space-y-4 transition-all active:scale-95 ${isDark ? 'bg-[#111622] border-white/10' : 'bg-white border-slate-200'}`}><span className="text-5xl">👩</span><span className="font-black text-xs uppercase tracking-widest">NAAG</span></button>
          </div>
        </div>
      );
    }
    return null;
  };

  const onboardingUI = renderOnboarding();
  if (onboardingUI) return onboardingUI;

  return (
    <div className="flex flex-col h-full relative bg-[#0a0a0a]">
      <header className="px-6 py-4 flex items-center justify-between border-b z-20 bg-[#0a0a0a]/95 border-white/5 backdrop-blur-md">
        <button onClick={onBack} className="p-1 text-slate-400 active:scale-90 transition-transform"><Icons.Close /></button>
        <div className="flex flex-col items-center">
          <Logo variant="main" size="w-9 h-9" />
          {(groupId || activeSubMode === 'private') && (
            <div className="flex flex-col items-center mt-1">
              <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${activeSubMode === 'private' ? 'bg-purple-500' : 'bg-green-500'} animate-pulse`}></span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeSubMode === 'private' ? 'text-purple-500' : 'text-blue-500'} truncate max-w-[150px]`}>
                  {activeSubMode === 'private' ? 'Private Tutor' : `${eduSchoolName} • ${eduClass}`}
                </span>
              </div>
              {activeSubMode !== 'private' && (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                  {memberCount} Arday ayaa ku jira
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => type === 'waxbarasho' && setIsInternalSideOpen(!isInternalSideOpen)}
          className={`p-2 rounded-xl transition-all ${isInternalSideOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
        >
          {type === 'waxbarasho' ? <Icons.Menu /> : <div className="w-6" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Messages Area */}
          <div ref={scrollRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar scroll-smooth relative ${activeSubMode === 'group' && type === 'waxbarasho' ? 'bg-[#0a0f1a]' : ''}`}>

            {/* Loading State for Mode Switch */}
            {loadingMessages && (
              <div className="absolute inset-x-0 top-20 flex justify-center">
                <Logo size="w-8 h-8" spinning />
              </div>
            )}

            {messages.filter(m => !searchQuery || m.text.toLowerCase().includes(searchQuery.toLowerCase())).map((m) => {
              const isMe = m.role === 'user' && (m.senderUid === auth.currentUser?.uid || activeSubMode === 'private');
              const isOtherUser = activeSubMode === 'group' && m.role === 'user' && m.senderUid !== auth.currentUser?.uid;
              const isAI = m.role === 'model';

              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {isAI && (
                    <div className="flex items-center space-x-2 mb-2 ml-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}><Logo size="w-4 h-4" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0285FF]">{activeSubMode === 'private' ? 'Personal Tutor' : 'Waxbarasho AI'}</span>
                    </div>
                  )}
                  {isOtherUser && m.senderName && (
                    <div className="flex items-center space-x-2 mb-2 ml-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500">
                        {m.senderName.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                        {m.senderName}
                      </span>
                    </div>
                  )}
                  {isMe && groupId && activeSubMode === 'group' && (
                    <div className="flex items-center space-x-2 mb-2 mr-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adiga (You)</span>
                    </div>
                  )}
                  <div className={`max-w-[92%] px-5 py-4 rounded-3xl text-[15px] shadow-sm ${isMe
                    ? (isDark ? (activeSubMode === 'private' ? 'bg-purple-600 text-white' : 'bg-[#0060BF] text-white') : 'bg-[#0285FF] text-white')
                    : (isDark ? 'bg-[#1c1c1e] text-white border border-white/5' : 'bg-white text-slate-800 border border-slate-200 shadow-md')
                    }`}>
                    {m.images && m.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${m.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {m.images.map((img, i) => (
                          <img key={i} src={img} className="w-full rounded-2xl aspect-square object-cover" alt="upload" />
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{renderFormattedText(m.text)}</div>
                    {isAI && m.text !== "[CREDIT_EXHAUSTED_ERROR]" && m.text.length > 0 && (
                      <div className={`mt-4 pt-3 flex items-center space-x-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <button onClick={() => navigator.clipboard.writeText(m.text)} className="p-1 text-slate-400 active:scale-90"><Icons.Copy /></button>
                        <button onClick={() => handleReaction(m.id, 'like')} className={`p-1 transition-all active:scale-90 ${m.reaction === 'like' ? 'text-[#0285FF]' : 'text-slate-400'}`}><Icons.Like filled={m.reaction === 'like'} /></button>
                        <button onClick={() => handleReaction(m.id, 'dislike')} className={`p-1 transition-all active:scale-90 ${m.reaction === 'dislike' ? 'text-red-500' : 'text-slate-400'}`}><Icons.Dislike filled={m.reaction === 'dislike'} /></button>
                      </div>
                    )}
                  </div>
                  {isAI && m.text !== "[CREDIT_EXHAUSTED_ERROR]" && (visibleAdIds.has(m.id) || adLoadingIds.has(m.id)) && (
                    <TelegramAdSection isLoading={adLoadingIds.has(m.id)} />
                  )}
                </div>
              );
            })}
            {isThinking && (
              <div className="flex flex-col items-start space-y-2 animate-fade-in pl-1">
                <Logo variant="thinking" />
              </div>
            )}
          </div>

          {/* Media Menu Overlay - Native Bottom Sheet Style */}
          {isMenuOpen && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end animate-fade-in">
              {/* Backdrop */}
              <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>

              {/* Bottom Sheet */}
              <div className={`relative w-full p-6 pb-12 rounded-t-[2.5rem] shadow-2xl animate-slide-up transform transition-transform ${isDark ? 'bg-[#1c1c1e] border-t border-white/10' : 'bg-white'}`}>
                {/* Grab Handle */}
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-8 opacity-50"></div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Camera Option */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className={`group flex flex-col items-center justify-center p-6 rounded-[2.2rem] border transition-all active:scale-95 duration-200 ${isDark ? 'bg-[#2c2c2e] border-white/5 active:bg-[#3a3a3c]' : 'bg-slate-50 border-slate-100 active:bg-slate-100'}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl shadow-lg transition-transform group-hover:scale-110 ${isDark ? 'bg-[#0a0f1e] text-[#0285FF]' : 'bg-white text-[#0285FF]'}`}>
                      {/* Camera SVG */}
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                    </div>
                    <span className="font-bold text-sm tracking-wide opacity-90">Camera</span>
                  </button>

                  {/* Photos Option */}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className={`group flex flex-col items-center justify-center p-6 rounded-[2.2rem] border transition-all active:scale-95 duration-200 ${isDark ? 'bg-[#2c2c2e] border-white/5 active:bg-[#3a3a3c]' : 'bg-slate-50 border-slate-100 active:bg-slate-100'}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl shadow-lg transition-transform group-hover:scale-110 ${isDark ? 'bg-[#0a0f1e] text-[#0285FF]' : 'bg-white text-blue-600'}`}>
                      {/* Gallery SVG */}
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                    <span className="font-bold text-sm tracking-wide opacity-90">Photos</span>
                  </button>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full mt-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={`p-4 pb-6 safe-area-bottom z-40 relative transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className={`flex flex-col rounded-[2.2rem] border shadow-2xl transition-all duration-300 ${isDark ? 'bg-[#1c1c1e]/95 border-white/5 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}`}>
              {selectedImages.length > 0 && (
                <div className="flex items-center space-x-3 p-4 overflow-x-auto border-b dark:border-white/5">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover rounded-2xl border-2 border-[#0285FF]/30" />
                      <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><Icons.Close /></button>
                    </div>
                  ))}
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="w-20 h-20 flex-shrink-0 border-2 border-dashed rounded-2xl flex items-center justify-center text-slate-400"
                  >
                    <Icons.Plus />
                  </button>
                </div>
              )}
              <div className="flex items-end space-x-2 px-4 py-2">

                {/* Main Toggle Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`p-3 mb-1 rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-[#0285FF] text-white rotate-45' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:text-[#0285FF]'}`}
                >
                  <Icons.Plus />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Qor fariintaada..."
                  className={`flex-1 bg-transparent border-none outline-none py-3 px-2 text-[15px] no-scrollbar resize-none font-medium max-h-[150px] ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                />

                <button onClick={handleSend} className={`mb-1 bg-[#0285FF] text-white p-3 rounded-full shadow-lg transition-all ${(!input.trim() && !selectedImages.length) ? 'opacity-50 grayscale' : 'active:scale-90'}`}>
                  {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.Send />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Native Inputs */}
        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" hidden onChange={handleFileSelect} />
        <input type="file" ref={galleryInputRef} accept="image/*" multiple hidden onChange={handleFileSelect} />

        {/* Education Internal Right Sidebar */}
        {type === 'waxbarasho' && (
          <div className={`fixed lg:static top-0 right-0 h-full w-80 z-[100] transition-all duration-500 ease-in-out transform ${isInternalSideOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:opacity-0'} flex`}>
            {/* Overlay for mobile */}
            {isInternalSideOpen && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden -z-10"
                onClick={() => setIsInternalSideOpen(false)}
              />
            )}

            <div className={`w-full h-full flex flex-col border-l transition-colors duration-500 ${isDark ? 'bg-[#0a0f1e] border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0285FF]">Edu Center</h3>
                <button onClick={() => setIsInternalSideOpen(false)} className="lg:hidden p-2 text-slate-500"><Icons.Close /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {/* Mode Switchers */}
                <div className="space-y-2">
                  <p className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 opacity-50">Modes</p>
                  <button
                    onClick={() => { setActiveSubMode('group'); setIsInternalSideOpen(false); }}
                    className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeSubMode === 'group' ? 'bg-[#0285FF] text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    <span className="text-xl">👥</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black uppercase tracking-wide">Group Chat</p>
                      <p className="text-[10px] opacity-60">Fasalkaaga oo dhan</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveSubMode('private'); setIsInternalSideOpen(false); }}
                    className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeSubMode === 'private' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    <span className="text-xl">🤖</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black uppercase tracking-wide">Private Tutor</p>
                      <p className="text-[10px] opacity-60">AI kuu gaar ah</p>
                    </div>
                  </button>
                </div>

                {/* New Chat Button */}
                <button
                  onClick={() => {
                    if (activeSubMode === 'private') {
                      setMessages([]);
                      setIsInternalSideOpen(false);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all active:scale-95 shadow-lg"
                >
                  <div className="p-1 rounded-lg bg-[#0285FF]/20 text-[#0285FF]"><Icons.Plus /></div>
                  <span className="text-xs font-black uppercase tracking-widest pt-0.5">New Session</span>
                </button>

                {/* Search Bar */}
                <div className="space-y-3">
                  <p className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-50">Search Fariimaha</p>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Raadi xog..."
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-10 outline-none text-xs text-white focus:border-blue-500/30 transition-all font-medium"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                  </div>
                </div>

                {/* History Placeholder */}
                <div className="space-y-4 pt-2">
                  <p className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-50 flex items-center">
                    <span>Recent History</span>
                    <span className="ml-3 h-[1px] flex-1 bg-white/5"></span>
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-40 cursor-not-allowed">
                      <p className="text-[11px] font-bold text-slate-400">Class Introduction 🎓</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">01 Feb • 10:30 AM</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 opacity-40 cursor-not-allowed">
                      <p className="text-[11px] font-bold text-slate-400">Math Problems (Private) 🤖</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">31 Jan • 04:15 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <p className="text-[9px] font-bold text-slate-500 uppercase text-center opacity-50 tracking-widest">Powered by DeepMind v3.5</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ChatView;
