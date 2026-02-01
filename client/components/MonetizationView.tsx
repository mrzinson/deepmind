
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

interface MonetizationViewProps {
    onBack: () => void;
}

const MonetizationView: React.FC<MonetizationViewProps> = ({ onBack }) => {
    const { language, t } = useLanguage();
    const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [appData, setAppData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'zaad' | 'edahab' | 'ebir'>('zaad');

    // Requirements checks
    const [daysJoined, setDaysJoined] = useState(0);
    const [followedSocial, setFollowedSocial] = useState(false);
    const [activeDetail, setActiveDetail] = useState<string | null>(null);
    const [socialUsernames, setSocialUsernames] = useState({
        tiktok: '',
        facebook: '',
        instagram: '',
        telegram: ''
    });
    const [isSearching, setIsSearching] = useState<string | null>(null);
    const [searchProgress, setSearchProgress] = useState(0);

    // Identity State
    const [identityData, setIdentityData] = useState({
        legalName: '',
        age: '',
        city: '',
        country: '',
        expertise: '',
        bio: ''
    });
    const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);

    // Terms & Conditions State
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Withdrawal State
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPhone, setWithdrawPhone] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsub = onSnapshot(doc(db, "monetization", auth.currentUser.uid),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setStatus(data.status || 'none');
                    setAppData(data);
                    if (data.socialUsernames) {
                        setSocialUsernames({
                            tiktok: data.socialUsernames.tiktok || '',
                            facebook: data.socialUsernames.facebook || '',
                            instagram: data.socialUsernames.instagram || '',
                            telegram: data.socialUsernames.telegram || ''
                        });
                    }
                }
                setLoading(false);
            },
            (err) => {
                console.error("Monetization listener error:", err);
                setLoading(false); // Stop loading even on error
            }
        );

        // Check account age
        const checkAccountAge = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
                if (userDoc.exists()) {
                    const createdAt = userDoc.data().createdAt?.toDate() || new Date();
                    const diffTime = Math.abs(new Date().getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysJoined(diffDays);
                }
            } catch (e) {
                console.error("Account age check error:", e);
            }
        };
        checkAccountAge();

        return () => unsub();
    }, []);

    const handleSocialSubmit = async (platform: string) => {
        const username = (socialUsernames as any)[platform];
        if (!username) {
            alert(language === 'so' ? "Fadlan geli username-kaaga." : "Please enter your username.");
            return;
        }

        setIsSearching(platform);
        setSearchProgress(0);

        // Mock animation progress
        const interval = setInterval(() => {
            setSearchProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 150);

        setTimeout(async () => {
            clearInterval(interval);

            try {
                // Real backend verification with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const verifyRes = await fetch('/api/verify-social', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform, username }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                let verifyData = { exists: true }; // Default fallback
                try {
                    if (verifyRes.ok) {
                        verifyData = await verifyRes.json();
                    }
                } catch (jsonErr) {
                    console.error("Failed to parse verification JSON", jsonErr);
                }

                setIsSearching(null);
                const docRef = doc(db, "monetization", auth.currentUser!.uid);
                const currentStrikes = appData?.socialStrikes || 0;

                if (verifyData.exists === false) {
                    const newStrikes = currentStrikes + 1;
                    await updateDoc(docRef, { socialStrikes: newStrikes });

                    if (newStrikes >= 3) {
                        await updateDoc(docRef, { status: 'rejected', rejectionReason: 'Too many incorrect social entries.' });
                        alert(language === 'so' ? "Akoonkaaga waa la xiray waayo waxaad isku dayday username aan jirin 3 jeer." : "Account locked due to 3 invalid username attempts.");
                    } else {
                        alert(language === 'so' ? `Username-kan laguma soo helin ${platform.toUpperCase()}. Waxaad haysataa ${3 - newStrikes} fursadood oo kaliya.` : `Username not found on ${platform.toUpperCase()}. You have ${3 - newStrikes} attempts left.`);
                    }
                    return;
                }

                // If exists or if verification failed/timed out (fallback to true), proceed
                const currentSocial = appData?.socialUsernames || {};
                const updatedSocial = { ...currentSocial, [platform]: username };

                await updateDoc(docRef, {
                    socialUsernames: updatedSocial,
                    socialStatus: 'submitted'
                });

                // Success - no alert needed, UI will update automatically
            } catch (e) {
                setIsSearching(null);
                console.error("Verification system error:", e);

                // FINAL FALLBACK: If the verification system itself crashes, 
                // we let the user submit anyway to avoid blocking valid users.
                // We trust the Admin to do the final manual check.
                try {
                    const docRef = doc(db, "monetization", auth.currentUser!.uid);
                    const currentSocial = appData?.socialUsernames || {};
                    const updatedSocial = { ...currentSocial, [platform]: username };
                    await updateDoc(docRef, {
                        socialUsernames: updatedSocial,
                        socialStatus: 'submitted'
                    });
                    // Fallback success - no alert needed
                } catch (dbErr) {
                    alert("Error reaching server. Please check your internet connection.");
                }
            }
        }, 4000);
    };

    const handleApply = async () => {
        if (daysJoined < 10) {
            alert(language === 'so' ? "Waa inaad appka isticmaashay ugu yaraan 10 maalmood." : "You must have used the app for at least 10 days.");
            return;
        }
        setShowPayment(true);
    };

    const submitPayment = async () => {
        if (!paymentPhone) return;
        if (!auth.currentUser) return;

        await setDoc(doc(db, "monetization", auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'User',
            phone: paymentPhone,
            method: paymentMethod,
            amount: 10000,
            status: 'pending',
            paymentStatus: 'pending',
            socialStatus: 'none',
            socialUsernames: {},
            socialStrikes: 0,
            timestamp: serverTimestamp(),
            followedSocial: false
        });
        setShowPayment(false);
    };

    const handleWithdraw = async () => {
        if (!auth.currentUser || !appData) return;
        const amount = parseInt(withdrawAmount);
        const phone = withdrawPhone.trim();

        if (isNaN(amount) || amount < 10000) {
            alert(language === 'so' ? "Lacagta ugu yar ee aad la bixi karto waa 10,000 SLSH" : "Minimum withdrawal is 10,000 SLSH");
            return;
        }

        if (!phone) {
            alert(language === 'so' ? "Fadlan geli number-kaaga" : "Please enter your phone number");
            return;
        }

        const tax = (amount / 1000) * 20;
        const totalToDeduct = amount + tax;
        const balance = (appData.totalEarned || 0) - (appData.totalWithdrawn || 0);

        if (totalToDeduct > balance) {
            alert(language === 'so' ? `Lacag kugu filan kuma jirto. Wixii aad la baxayso (${amount}) + Cashuurta (${tax}) = ${totalToDeduct} SLSH. Hadhaagaagu waa ${balance} SLSH.` : `Insufficient funds. Withdrawal (${amount}) + Tax (${tax}) = ${totalToDeduct} SLSH. Your balance is ${balance} SLSH.`);
            return;
        }

        setIsWithdrawing(true);
        try {
            // 1. Create Withdrawal Request for Admin
            await addDoc(collection(db, "withdrawals"), {
                userId: auth.currentUser.uid,
                userName: appData.userName || 'Unknown',
                phone: phone,
                amount: amount,
                tax: tax,
                totalDeducted: totalToDeduct,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            // 2. Update Monetization Doc (Deduct Immediately)
            const docRef = doc(db, "monetization", auth.currentUser.uid);
            await updateDoc(docRef, {
                totalWithdrawn: (appData.totalWithdrawn || 0) + totalToDeduct,
                history: [{
                    type: 'withdrawal',
                    amount: amount,
                    tax: tax,
                    total: totalToDeduct,
                    status: 'pending',
                    phone: phone,
                    timestamp: new Date()
                }, ...(appData.history || [])]
            });

            alert(language === 'so' ? "Codsigaaga waa la diray! Waxaad heli doontaa lacagta dhawaan InshaAllah." : "Request sent! You will receive your money soon.");
            setShowWithdraw(false);
            setWithdrawAmount('');
            setWithdrawPhone('');
        } catch (e) {
            console.error(e);
            alert("Error: " + e);
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-[#050810]"><Logo size="w-12 h-12" spinning /></div>;

    // --- DASHBOARD FOR FULLY ACTIVE AMBASSADORS ---
    if (status === 'approved') {
        return (
            <div className="flex flex-col h-full bg-[#050810] text-white">
                <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 active:scale-90"><Icons.Close /></button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black uppercase tracking-widest text-[#0285FF]">Earnings Dashboard</h1>
                        <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-bold opacity-50 text-green-500 uppercase tracking-tighter">Monetization Active</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                    </div>
                    <div className="w-10"></div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Earnings Card */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0285FF] to-[#0052a3] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-black">{((appData.totalEarned || 0) - (appData.totalWithdrawn || 0)).toLocaleString()}</span>
                                <span className="text-xs font-bold opacity-60 uppercase">SLSH</span>
                            </div>
                            <button
                                onClick={() => setShowWithdraw(true)}
                                className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all"
                            >
                                Withdraw 💸
                            </button>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-3">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Earned</p>
                                <p className="text-lg font-black">{(appData.totalEarned || 0).toLocaleString()} SLSH</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Withdrawn</p>
                                <p className="text-lg font-black">{(appData.totalWithdrawn || 0).toLocaleString()} SLSH</p>
                            </div>
                            <div
                                className="p-4 bg-white/10 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all"
                                onClick={() => setActiveDetail('invites')}
                            >
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Users Invited</p>
                                <p className="text-lg font-black">{appData.invitedUsers?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Promo Code Card */}
                    <div className="p-7 rounded-[2.5rem] bg-[#111622] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#0285FF]">Your Promo Code</h3>
                                <p className="text-[11px] font-bold text-slate-500">Share this code to earn 10% commission</p>
                            </div>
                            <div className="p-3 bg-[#0285FF]/10 rounded-2xl text-[#0285FF] font-black text-xl border border-[#0285FF]/20">
                                {appData.promoCode || 'PENDING'}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(appData.promoCode);
                                alert("Code copied!");
                            }}
                            className="w-full py-4 rounded-2xl bg-white/5 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors"
                        >
                            Copy My Code
                        </button>
                    </div>

                    {/* Stats/History */}
                    <div className="space-y-4 pb-20">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Earning History</h3>
                        {(!appData.history || appData.history.length === 0) ? (
                            <div className="p-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <p className="text-xs font-bold text-slate-500 italic">No earnings recorded yet. Start sharing!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {appData.history.map((h: any, i: number) => {
                                    const date = h.timestamp?.toDate ? h.timestamp.toDate() : (h.timestamp ? new Date(h.timestamp) : new Date());
                                    const isWithdrawal = h.type === 'withdrawal';
                                    return (
                                        <div key={i} className="p-5 bg-white/5 rounded-3xl flex items-center justify-between border border-white/5">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                                                    {isWithdrawal ? 'Withdrawal Request' : `Invite: ${h.fromUser || 'User'}`}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold mt-0.5">{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black tracking-tight ${isWithdrawal ? 'text-red-400' : 'text-green-500'}`}>
                                                    {isWithdrawal ? '-' : '+'}{h.amount?.toLocaleString()} <span className="text-[10px]">SLSH</span>
                                                </p>
                                                {isWithdrawal && h.tax > 0 && (
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">incl. {h.tax.toLocaleString()} tax</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Spacer for bottom */}
                <div className="h-10" />
                {/* Withdrawal Modal */}
                <AnimatePresence>
                    {showWithdraw && (
                        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 sm:p-6">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowWithdraw(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="relative w-full max-w-lg bg-[#111622] rounded-[3rem] border border-white/10 p-8 pt-10 shadow-3xl flex flex-col space-y-8"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div>
                                        <h2 className="text-xl font-black text-white">Withdraw Funds</h2>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Min: 10,000 SLSH • Tax: 20 SLSH/1k</p>
                                    </div>
                                    <button onClick={() => setShowWithdraw(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400">
                                        <Icons.Close />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0285FF] ml-2">Amount to Withdraw</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                placeholder="e.g. 10000"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-8 text-lg font-black focus:border-[#0285FF] transition-all outline-none"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs uppercase">SLSH</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0285FF] ml-2">Payment Number (ZAAD/EDAHAB/EBIR)</label>
                                        <input
                                            type="text"
                                            value={withdrawPhone}
                                            onChange={(e) => setWithdrawPhone(e.target.value)}
                                            placeholder="63XXXXXXX"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-8 text-lg font-black focus:border-[#0285FF] transition-all outline-none"
                                        />
                                    </div>

                                    {/* Summary Card */}
                                    {withdrawAmount && parseInt(withdrawAmount) >= 10000 && (
                                        <div className="p-6 bg-blue-600/5 rounded-[2rem] border border-blue-500/10 space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>Subtotal</span>
                                                <span className="text-white">{parseInt(withdrawAmount).toLocaleString()} SLSH</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>Tax (20/1k)</span>
                                                <span className="text-red-400">+ {((parseInt(withdrawAmount) / 1000) * 20).toLocaleString()} SLSH</span>
                                            </div>
                                            <div className="h-px bg-white/5 my-2" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-black uppercase text-blue-500">Total Deducted</span>
                                                <span className="text-xl font-black text-white">
                                                    {(parseInt(withdrawAmount) + (parseInt(withdrawAmount) / 1000) * 20).toLocaleString()} SLSH
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isWithdrawing || !withdrawAmount || !withdrawPhone}
                                        className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${isWithdrawing ? 'bg-slate-800' : 'bg-[#0285FF] hover:bg-blue-500 shadow-blue-600/20'}`}
                                    >
                                        {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal 💸'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- APPLICATION FLOW (PENDING/REJECTED/NONE) ---
    return (
        <div className="flex flex-col h-full bg-[#050810] text-white overflow-hidden">
            <header className="px-6 pt-12 pb-6 flex items-center border-b border-white/5">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400"><Icons.Close /></button>
                <h1 className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#0285FF]">Account Monetization</h1>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Header Section */}
                <div className="p-8 space-y-10">
                    {/* Payment Approval Notification */}
                    {appData?.paymentStatus === 'approved' && appData?.socialStatus === 'none' && (
                        <div className="p-5 rounded-3xl bg-green-500/10 border border-green-500/20 text-center animate-bounce-slow">
                            <span className="text-xl mb-2 block">🎉</span>
                            <h4 className="text-sm font-black text-green-500 uppercase tracking-widest">Lacagta waa la xaqiijiyey!</h4>
                            <p className="text-[10px] font-bold text-green-500/60 mt-1">Fadlan hadda dhameystir Social Media Proof.</p>
                        </div>
                    )}

                    {/* Waiting Message if ALL steps are submitted */}
                    {(appData?.paymentStatus === 'approved' && appData?.socialStatus === 'submitted' && status === 'pending') && (
                        <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-500 animate-pulse">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <h4 className="text-xs font-black text-[#0285FF] uppercase tracking-widest">Final Step: Admin Review</h4>
                            <p className="text-[10px] font-bold text-slate-400">Dhammaan shuruudihii waa naloo soo gudbiyey. Sug ilaa inta si toos ah loogu shaqaysiinayo akoonkaaga.</p>
                        </div>
                    )}
                    {/* Promo Header */}
                    <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-[#121826] to-[#0a0f1a] border border-white/5 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0285FF]/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10 space-y-3">
                            <div className="w-14 h-14 bg-[#0285FF] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0285FF]/20">
                                <Icons.Premium />
                            </div>
                            <h2 className="text-3xl font-black leading-tight">Become a DM Ambassador</h2>
                            <p className="text-sm font-bold text-slate-400">Apply for monetization and earn 10% commission on every user you bring to DeepMind.</p>
                        </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0285FF] border-b border-[#0285FF]/20 pb-2">Requirements Checklist</h3>

                        <RequirementItem
                            title={language === 'so' ? "Bixi 10,000 Shilling" : "Pay 10,000 Shilling"}
                            desc={appData?.paymentStatus === 'approved' ? (language === 'so' ? 'Lacagta waa la helay ✅' : 'Payment received ✅') : (language === 'so' ? "Lacagta diiwaangelinta iyo aqoonsiga" : "Verification & Registration fee")}
                            detail={language === 'so' ? "Si aad u bilawdo lacag ka samaynta app-ka, waa inaad bixisaa lacagta diiwaangelinta oo dhan 10,000 SLSH. Lacagtan waxaa loo isticmaalaa in lagu hubiyo akoonkaaga laguna siiyo Blue Tick." : "To start earning from the app, you must pay a registration fee of 10,000 SLSH. This fee is used to verify your account and provide you with a Blue Tick."}
                            actionLabel={appData?.paymentStatus === 'approved' ? (language === 'so' ? 'Waa laguu aqbalay ✅' : 'Payment Approved ✅') : (language === 'so' ? "Baro Faahfaahinta & Bixi 💸" : "Learn Details & Pay 💸")}
                            onAction={() => appData?.paymentStatus === 'approved' ? null : setActiveDetail('verification')}
                            active={appData?.paymentStatus === 'approved'}
                        />

                        <div className={appData?.paymentStatus !== 'approved' ? 'opacity-40 grayscale pointer-events-none' : ''}>
                            <RequirementItem
                                title={language === 'so' ? "Social Media Follow" : "Social Media Follow"}
                                desc={appData?.socialStatus === 'submitted' ? (language === 'so' ? 'Waa lala sugayaa Admin...' : 'Awaiting Admin...') : (appData?.socialStatus === 'approved' ? (language === 'so' ? 'Social Verified ✅' : 'Social Verified ✅') : (language === 'so' ? "Soco DeepMind Pages" : "Must follow DM accounts"))}
                                detail={language === 'so' ? "Si aad u noqoto ambassador, waa inaad raacdaa boggayaga Facebook iyo TikTok si aad ula socoto wararkii ugu dambeeyey iyo talooyinka." : "To be an ambassador, you must follow our Facebook and TikTok pages to stay updated with the latest news and tips."}
                                actionLabel={appData?.socialStatus === 'submitted' ? (language === 'so' ? "Dib u eegis ayaa socota" : "Review in progress") : (appData?.socialStatus === 'approved' ? (language === 'so' ? "Tallaabadan waa la dhammaystiray" : "Step completed") : (language === 'so' ? "Follow dheh & Gudbi Username 🚀" : "Follow & Submit Username 🚀"))}
                                onAction={() => appData?.socialStatus === 'approved' ? null : setActiveDetail('social')}
                                active={appData?.socialStatus === 'approved' || appData?.socialStatus === 'submitted'}
                            />
                        </div>

                        <div className={(appData?.paymentStatus !== 'approved' || appData?.socialStatus !== 'approved') ? 'opacity-40 grayscale pointer-events-none' : ''}>
                            <RequirementItem
                                title={language === 'so' ? "Aqoonsiga Professional-ka" : "Professional Identity"}
                                desc={appData?.identityStatus === 'submitted' ? (language === 'so' ? 'Waa lala sugayaa Admin...' : 'Awaiting Admin...') : (appData?.identityStatus === 'approved' ? (language === 'so' ? 'Identity Verified ✅' : 'Identity Verified ✅') : (language === 'so' ? "Gudbi Profile-kaaga" : "Submit your profile"))}
                                detail={language === 'so' ? "Si aan u hubino tayada ambassador-adayada, fadlan nala wadaag magacaaga saxda ah, meesha aad deggan tahay, iyo khibraddaada professional-ka ah." : "To ensure the quality of our ambassadors, please share your legal name, location, and professional expertise."}
                                actionLabel={appData?.identityStatus === 'submitted' ? (language === 'so' ? "Dib u eegis ayaa socota" : "Review in progress") : (appData?.identityStatus === 'approved' ? (language === 'so' ? "Tallaabadan waa la dhammaystiray" : "Step completed") : (language === 'so' ? "Buuxi Profile-ka 📋" : "Fill Profile 📋"))}
                                onAction={() => appData?.identityStatus === 'approved' ? null : setActiveDetail('identity')}
                                active={appData?.identityStatus === 'approved' || appData?.identityStatus === 'submitted'}
                            />
                        </div>

                    </div>

                    <div className={(appData?.paymentStatus !== 'approved' || appData?.socialStatus !== 'approved' || appData?.identityStatus !== 'approved') ? 'opacity-40 grayscale pointer-events-none' : ''}>
                        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-green-600/5 to-emerald-600/5 border border-green-600/10 space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${termsAccepted ? 'bg-green-600' : 'bg-white/5'} transition-all`}>
                                    {termsAccepted ? (
                                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white mb-2">
                                        {language === 'so' ? 'Ogolaanshaha Shuruucda' : 'Accept Terms & Conditions'}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                        {language === 'so'
                                            ? 'Waa inaad akhridaa oo aad ogolaataa shuruucda iyo nidaamka DeepMind. Ambassador-ku waa inuu u shaqeeyaa si hufan oo asluub leh.'
                                            : 'You must read and agree to DeepMind\'s terms and policies. Ambassadors must work transparently and professionally.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowTermsModal(true)}
                                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-[#0285FF] hover:bg-white/10 transition-all"
                                >
                                    📄 {language === 'so' ? 'Akhri Terms & Conditions' : 'Read Terms & Conditions'}
                                </button>

                                <label className="flex items-center space-x-3 p-4 bg-black/20 rounded-2xl cursor-pointer hover:bg-black/30 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-green-600 checked:border-green-600 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-white">
                                        {language === 'so'
                                            ? 'Waxaan akhriday oo waan aqbalay shuruudaha iyo qaanuunada'
                                            : 'I have read and agree to the terms and conditions'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={async () => {
                            const isPaymentDone = appData?.paymentStatus === 'approved';
                            const isSocialDone = appData?.socialStatus === 'submitted' || appData?.socialStatus === 'approved';
                            const isIdentityDone = appData?.identityStatus === 'approved';

                            if (!termsAccepted) {
                                alert(language === 'so' ? "Fadlan aqbal shuruudaha iyo qaanuunada." : "Please accept the terms and conditions.");
                                return;
                            }

                            if (isPaymentDone && isSocialDone && isIdentityDone && termsAccepted) {
                                await updateDoc(doc(db, "monetization", auth.currentUser!.uid), { status: 'pending' });
                                alert(language === 'so'
                                    ? "🎉 Hambalyo! Waad dhamaysay dhammaan shuruudaha. Yara sug inta Admin-ku ka aqbalayo (pending approval)..."
                                    : "🎉 Congratulations! You've completed all requirements. Please wait while the Admin reviews your application...");
                            } else {
                                alert(language === 'so' ? "Fadlan dhameey dhammaan shuruudaha." : "Please complete all requirements first.");
                            }
                        }}
                        className={`w-full py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${(appData?.paymentStatus === 'approved' && (appData?.socialStatus === 'submitted' || appData?.socialStatus === 'approved') && appData?.identityStatus === 'approved' && termsAccepted)
                            ? 'gradient-bg text-white shadow-[#0285FF]/20'
                            : 'bg-white/5 text-slate-500 border border-white/5'}`}
                    >
                        {language === 'so' ? 'Hadda Fur Dashboard-ka 🚀' : 'Unlock Dashboard Now 🚀'}
                    </button>
                </div>
            </div>

            {/* Terms & Conditions Modal */}
            <TermsModal show={showTermsModal} onClose={() => setShowTermsModal(false)} language={language} />

            {/* DETAILED REQUIREMENT VIEW (FULLSCREEN) */}
            {activeDetail === 'verification' && (
                <div className="fixed inset-0 z-[200] bg-[#050810] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
                    <header className="px-6 pt-12 pb-6 flex items-center border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl sticky top-0 z-10">
                        <button onClick={() => setActiveDetail(null)} className="p-2 -ml-2 text-slate-400 active:scale-90"><Icons.Close /></button>
                        <h2 className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#0285FF]">Verification Details</h2>
                        <div className="w-10"></div>
                    </header>

                    <div className="p-8 space-y-10 pb-32">
                        {/* Visual Header */}
                        <div className="relative aspect-square max-w-[280px] mx-auto group">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[80px] animate-pulse"></div>
                            <div className="relative w-full h-full rounded-[4rem] border border-white/10 bg-gradient-to-br from-[#121826] to-black p-10 flex items-center justify-center overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                <div className="relative z-10 animate-spring-up">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#0285FF" />
                                        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0285FF] animate-pulse">DeepMind Verified</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black tracking-tight">{language === 'so' ? "Aqoonsiga Xisaabta" : "Account Verification"}</h2>
                            <p className="text-slate-400 font-bold leading-relaxed">
                                {language === 'so'
                                    ? "Markaad bixiso lacagta diiwaangelinta, xisaabtaada waxa lagu darayaa Blue Tick taasoo kor u qaadaysa kalsoonida macaamiishaada."
                                    : "By paying the registration fee, your account will receive a Blue Tick, increasing your credibility with customers."}
                            </p>
                        </div>

                        {/* Benefits Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <BenefitCard icon="💰" title="10% Commision" desc="Earn from every sub" />
                            <BenefitCard icon="✅" title="Blue Tick" desc="Verified status" />
                            <BenefitCard icon="🚀" title="Priority Support" desc="24/7 Admin help" />
                            <BenefitCard icon="📊" title="Dashboard" desc="Track your growth" />
                        </div>

                        <div className="space-y-4 pt-6">
                            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Registration Fee</p>
                                <p className="text-3xl font-black text-white">10,000 <span className="text-sm">SLSH</span></p>
                            </div>

                            <button
                                onClick={() => { setShowPayment(true); setActiveDetail(null); }}
                                className="w-full py-6 rounded-[2.5rem] gradient-bg text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#0285FF]/40 active:scale-95 transition-all"
                            >
                                {language === 'so' ? "Hadda ka bilow halkan 🚀" : "Start Registration Now 🚀"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Social Media Follow Detail */}
            {activeDetail === 'social' && (
                <div className="fixed inset-0 z-[100] bg-[#050810] flex flex-col animate-fade-in ltr">
                    <header className="px-6 pt-12 pb-6 flex items-center border-b border-white/5 bg-[#050810]/50 backdrop-blur-xl sticky top-0 z-10">
                        <button onClick={() => setActiveDetail(null)} className="p-2 -ml-2 text-slate-400 bg-white/5 rounded-full"><Icons.Close /></button>
                        <h1 className="flex-1 text-center text-sm font-black uppercase tracking-[0.2em] text-[#0285FF]">Social Media Proof</h1>
                        <div className="w-10"></div>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar">
                        <div className="space-y-4 text-center">
                            <div className="w-20 h-20 bg-[#0285FF] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-[#0285FF]/20 animate-bounce">
                                <Icons.Premium />
                            </div>
                            <h2 className="text-2xl font-black">Raac Boggayaga</h2>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed">Fadlan raac talaabooyinkan si aad u xaqiijiso follow-gaaga. Admin-ka ayaa hubin doona.</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { id: 'tiktok', name: 'TikTok', link: 'https://www.tiktok.com/@hamze.zinson', color: 'from-[#ff0050] to-[#00f2ea]' },
                                { id: 'facebook', name: 'Facebook', link: 'https://www.facebook.com/H.zinson', color: 'from-[#1877F2] to-[#0D62D1]' },
                                { id: 'instagram', name: 'Instagram', link: 'https://www.instagram.com/mr.zinson', color: 'from-[#f09433] via-[#e6683c] to-[#bc1888]' },
                                { id: 'telegram', name: 'Telegram', link: 'https://t.me/DeepMind_news', color: 'from-[#0088cc] to-[#33aadd]' }
                            ].map((p) => {
                                const isPlatformSubmitted = appData?.socialUsernames?.[p.id];
                                return (
                                    <div key={p.id} className="p-6 bg-[#111622] rounded-[3rem] border border-white/10 space-y-5 relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${p.color} opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-[0.07] transition-opacity`}></div>

                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg`}>
                                                    <span className="font-black text-xs uppercase">{p.name[0]}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black">{p.name}</h4>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">DM Official Page</p>
                                                </div>
                                            </div>
                                            {appData?.verifiedSocials?.[p.id] ? (
                                                <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-2xl border border-green-500/20 text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
                                                    <span>Verified</span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                </div>
                                            ) : (
                                                <button onClick={() => window.open(p.link, '_blank')} className="px-5 py-2.5 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Follow ↗</button>
                                            )}
                                        </div>


                                        <button
                                            onClick={() => window.open(p.link, '_blank')}
                                            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            Open {p.name} 🚀
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={language === 'so' ? "Gali Username-kaaga" : "Enter your username"}
                                                value={(socialUsernames as any)[p.id]}
                                                onChange={(e) => setSocialUsernames(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                disabled={!!isPlatformSubmitted || isSearching === p.id}
                                                className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-center font-bold text-sm focus:border-[#0285FF] outline-none transition-all disabled:opacity-50"
                                            />
                                            {isSearching === p.id && (
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#0285FF] transition-all duration-150" style={{ width: `${searchProgress}%` }}></div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleSocialSubmit(p.id)}
                                            disabled={!!isPlatformSubmitted || isSearching === p.id}
                                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${isPlatformSubmitted ? 'bg-green-500/10 text-green-500' : 'bg-[#0285FF] text-white shadow-lg shadow-[#0285FF]/20'}`}
                                        >
                                            {isSearching === p.id ? (language === 'so' ? "Searching..." : "Verifying...") : (isPlatformSubmitted ? (language === 'so' ? "Waa la Gudbiyey" : "Submitted") : (language === 'so' ? "Gudbi Magaca" : "Submit Username"))}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 space-y-4">
                            <div className="p-5 rounded-[2rem] bg-red-500/5 border border-red-500/10 space-y-2">
                                <h5 className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center">
                                    <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                    Digniin Muhiim Ah
                                </h5>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                    U soo dir username sax ah. Haddii aad soo dirto magac aadan follow kaga soo saarin, akoonkaaga **waa la xirayaa (Permanent Ban)**. Sharcigu waa 3-jeer oo kaliya.
                                </p>
                            </div>

                            <button
                                onClick={() => setActiveDetail(null)}
                                className="w-full py-5 rounded-[2.5rem] bg-white/5 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]"
                            >
                                {language === 'so' ? 'Hadda dib u laabo' : 'Go Back Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Identity & Professional Profile Detail */}
            {activeDetail === 'identity' && (
                <div className="fixed inset-0 z-[200] bg-[#050810] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
                    <header className="px-6 pt-12 pb-6 flex items-center border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl sticky top-0 z-10">
                        <button onClick={() => setActiveDetail(null)} className="p-2 -ml-2 text-slate-400 active:scale-90"><Icons.Close /></button>
                        <h2 className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#0285FF]">Identity & Profile</h2>
                        <div className="w-10"></div>
                    </header>

                    <div className="p-8 space-y-10 pb-32">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center text-[#0285FF] border border-blue-500/20 shadow-xl shadow-blue-500/5">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <h2 className="text-3xl font-black">{language === 'so' ? "Xogtaada Saxda Ah" : "Professional Identity"}</h2>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed">
                                {language === 'so'
                                    ? "Fadlan buuxi xogtaan si aad u noqoto ambassador la xaqiijiyey. Admin-ka ayaa hubin doona."
                                    : "Please fill this information to become a verified ambassador. Admin will review your profile."}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#0285FF] ml-4">Legal Full Name</label>
                                <input
                                    value={identityData.legalName}
                                    onChange={e => setIdentityData({ ...identityData, legalName: e.target.value })}
                                    placeholder="Tusaale: Hamze Mohamud"
                                    className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Age (Da'da)</label>
                                    <input
                                        type="number"
                                        value={identityData.age}
                                        onChange={e => setIdentityData({ ...identityData, age: e.target.value })}
                                        placeholder="24"
                                        className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Expertise</label>
                                    <select
                                        value={identityData.expertise}
                                        onChange={e => setIdentityData({ ...identityData, expertise: e.target.value })}
                                        className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Content Creator">Content Creator</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Student">Student</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">City (Magaalada)</label>
                                    <input
                                        value={identityData.city}
                                        onChange={e => setIdentityData({ ...identityData, city: e.target.value })}
                                        placeholder="Hargeisa"
                                        className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Country (Dalka)</label>
                                    <select
                                        value={identityData.country}
                                        onChange={e => setIdentityData({ ...identityData, country: e.target.value })}
                                        className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Somaliland">Somaliland</option>
                                        <option value="Somalia">Somalia</option>
                                        <option value="Kenya">Kenya</option>
                                        <option value="Djibouti">Djibouti</option>
                                        <option value="Ethiopia">Ethiopia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Short Bio (One line about you)</label>
                                <textarea
                                    value={identityData.bio}
                                    onChange={e => setIdentityData({ ...identityData, bio: e.target.value })}
                                    placeholder="Tell us why you want to be an ambassador..."
                                    className="w-full bg-[#111622] border border-white/5 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-[#0285FF] transition-all h-24 resize-none"
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    if (!identityData.legalName || !identityData.city || !identityData.expertise) {
                                        alert("Fadlan dhameystir xogta muhiimka ah.");
                                        return;
                                    }
                                    setIsSubmittingIdentity(true);
                                    try {
                                        await updateDoc(doc(db, "monetization", auth.currentUser!.uid), {
                                            identity: identityData,
                                            identityStatus: 'submitted'
                                        });
                                        setActiveDetail(null);
                                        alert("Xogtadii waa nala soo gaartay! Admin-ka ayaa dib u eegi doona.");
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setIsSubmittingIdentity(false);
                                    }
                                }}
                                disabled={isSubmittingIdentity}
                                className="w-full py-6 rounded-3xl gradient-bg text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                {isSubmittingIdentity ? "Gudbinaysaa..." : "Gudbi Profile-ka 🚀"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INVITED USERS MODAL */}
            {activeDetail === 'invites' && (
                <div className="fixed inset-0 z-[200] bg-[#050810] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
                    <header className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050810]/95 backdrop-blur-xl z-10">
                        <button onClick={() => setActiveDetail(null)} className="p-2 bg-white/5 rounded-full">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-black uppercase tracking-widest">Users Invited</h1>
                        <div className="w-10"></div>
                    </header>

                    <div className="flex-1 p-6 space-y-4">
                        {(!appData?.invitedUsers || appData.invitedUsers.length === 0) ? (
                            <div className="p-20 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">No Invites Yet</h3>
                                <p className="text-sm text-slate-500 font-medium">Start sharing your promo code to earn commissions!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {appData.invitedUsers.map((user: any, index: number) => (
                                    <div key={index} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0285FF] to-[#0052a3] flex items-center justify-center text-white font-black text-lg">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">{user.name || 'Anonymous User'}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold">
                                                    Joined: {user.joinedDate ? new Date(user.joinedDate.toDate()).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-500">+{user.commission?.toLocaleString() || 0} SLSH</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Commission</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showPayment && (
                <div className="fixed inset-0 z-[100] bg-[#050810]/95 backdrop-blur-xl flex items-end">
                    <div className="w-full bg-[#111622] rounded-t-[3rem] p-8 space-y-8 animate-slide-up border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black">Final Step: Payment</h3>
                            <button onClick={() => setShowPayment(false)} className="p-2 bg-white/5 rounded-full"><Icons.Close /></button>
                        </div>

                        <p className="text-sm font-bold text-slate-400">
                            {language === 'so' ? "Si aad u bilawdo xisaabta lacag ka samaynta (Monetization), bixi 10,000 Shilling si loo xaqiijiyo (Verify) akoonkaaga."
                                : "To activate your monetization account, pay 10,000 Shilling for account verification."}
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                            {['zaad', 'edahab', 'ebir'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m as any)}
                                    className={`py-6 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest ${paymentMethod === m ? 'border-[#0285FF] bg-[#0285FF]/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <input
                                type="tel"
                                placeholder="063 / 065 / 061..."
                                value={paymentPhone}
                                onChange={(e) => setPaymentPhone(e.target.value)}
                                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] text-center font-black text-xl outline-none focus:border-[#0285FF]"
                            />
                            <button
                                onClick={submitPayment}
                                className="w-full py-5 rounded-[2.5rem] gradient-bg text-white font-black uppercase tracking-widest text-sm shadow-xl"
                            >
                                Pay 10,000 Shilling
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RequirementItem = ({ title, desc, detail, actionLabel, onAction, active }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`rounded-[2rem] border transition-all overflow-hidden ${isOpen ? 'bg-[#1a2133] border-[#0285FF]/30 shadow-lg' : 'bg-[#111622] border-white/5 shadow-sm'}`}>
            <div onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${active ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'border-white/10 text-slate-700'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className={`text-[15px] font-black ${active ? 'text-white' : 'text-slate-400'}`}>{title}</h4>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">{desc}</p>
                </div>
                <div className={`transition-transform duration-300 text-slate-600 ${isOpen ? 'rotate-180 text-[#0285FF]' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
            </div>

            {isOpen && (
                <div className="px-6 pb-6 space-y-5 animate-fade-in">
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                            {detail}
                        </p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(); }}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center space-x-2 ${active
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-[#0285FF] text-white shadow-lg shadow-[#0285FF]/20'
                            }`}
                    >
                        <span>{active ? "Shuruuddan waa dhamaystiran tahay ✅" : actionLabel}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const BenefitCard = ({ icon, title, desc }: any) => (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
        <span className="text-xl mb-2 block">{icon}</span>
        <h4 className="text-[12px] font-black">{title}</h4>
        <p className="text-[10px] font-bold text-slate-500">{desc}</p>
    </div>
);

// Terms & Conditions Modal Component
const TermsModal = ({ show, onClose, language }: { show: boolean; onClose: () => void; language: string }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[85vh] bg-[#0A0F1E] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white">
                            {language === 'so' ? 'Shuruudaha iyo Qaanuunada' : 'Terms & Conditions'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {language === 'so' ? (
                        <>
                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">1. Aqoonsiga Ambassador-ka</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Ambassador-ka DeepMind waa qof u shaqeeya si hufan oo asluub leh. Waa inaad u shaqaysaa si daacad ah oo aad dadka u talisaa sida saxda ah.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">2. Mas'uuliyadaha</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    - Waa inaad u shaqaysaa si professional ah<br />
                                    - Waa inaadan khiyaanayn ama been sheegin<br />
                                    - Waa inaad raacdo nidaamka DeepMind<br />
                                    - Waa inaad ka dhigtaa dadka inay DeepMind isticmaalaan
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">3. Lacagta iyo Promo Code-ka</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Marka aad noqoto ambassador, waxaad heli doontaa promo code gaar ah. Qof kasta oo isticmaala code-kaaga, waxaad ka heli doontaa lacag.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">4. Xeerarka</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Haddii aad jabto shuruudahan, DeepMind waxay xaq u leedahay inay kaa saarto barnaamijka ambassador-ka oo ay xirto akoonkaaga.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">6. Xaqiijinta & Lacag-bixinta</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    - Lacag bixintu waxay ku xiran tahay xaqiijinta maamulka ee isdiiwaangelinta dhabta ah.<br />
                                    - Codsiyada lacag bixinta (Withdrawal) waxaa la socon kara khidmad adeeg (Service Fee).
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">1. Ambassador Recognition</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    A DeepMind Ambassador is someone who works transparently and professionally. You must work honestly and advise people correctly.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">2. Responsibilities</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    - You must work professionally<br />
                                    - You must not cheat or lie<br />
                                    - You must follow DeepMind's policies<br />
                                    - You must encourage people to use DeepMind
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">3. Payment & Promo Code</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Once you become an ambassador, you will receive a unique promo code. For every person who uses your code, you will earn money.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">4. Rules</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    If you violate these terms, DeepMind has the right to remove you from the ambassador program and close your account.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-[#0285FF] mb-3">6. Verification & Payouts</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    - Payouts are subject to administrative verification of genuine subscriptions.<br />
                                    - Withdrawal requests may be subject to a nominal service fee.
                                </p>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-[#0285FF] text-white font-black uppercase tracking-widest text-sm hover:scale-105 transition-all"
                    >
                        {language === 'so' ? 'Xir' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonetizationView;
