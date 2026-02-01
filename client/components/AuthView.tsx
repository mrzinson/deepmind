
import React, { useState } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { Icons } from '../constants';
import emailjs from '@emailjs/browser';

interface AuthViewProps {
    onProfileComplete?: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onProfileComplete }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [whatsapp, setWhatsapp] = useState('+252');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showOtp, setShowOtp] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');

    const [showCompleteProfile, setShowCompleteProfile] = useState(false);
    const [tempUser, setTempUser] = useState<any>(null);

    // Auto-detect if parent sent us here for profile completion
    React.useEffect(() => {
        if (auth.currentUser && !showCompleteProfile && !showOtp) {
            setTempUser(auth.currentUser);
            const nameParts = (auth.currentUser.displayName || '').split(' ');
            setFirstName(nameParts[0] || '');
            setMiddleName(nameParts[1] || '');
            setLastName(nameParts.slice(2).join(' ') || '');
            setShowCompleteProfile(true);
        }
    }, [auth.currentUser]);

    const validateForm = () => {
        if (!isLogin || showCompleteProfile) {
            if (!firstName || !middleName || !lastName) {
                setError('Fadlan buuxi magacaaga oo saddexan.');
                return false;
            }

            // WhatsApp Validation: +252 followed by 9-10 digits
            const cleanWhatsapp = whatsapp.replace('+', '');
            const numberPart = cleanWhatsapp.startsWith('252') ? cleanWhatsapp.slice(3) : cleanWhatsapp;
            if (numberPart.length < 9 || numberPart.length > 10) {
                setError('WhatsApp number-ku waa inuu u dhexeeyaa 9 ilaa 10 god (marka laga reebo +252).');
                return false;
            }
        }

        // Password Validation: 8+ god, alphanumeric (Only for Signup or Google Profile Completion)
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!isLogin || showCompleteProfile) {
            if (!passRegex.test(password)) {
                setError('Password-ku waa inuu ka koobnaadaa ugu yaraan 8 god, oo ay ku jiraan xarfo iyo tiro (alphanumeric).');
                return false;
            }
        }

        return true;
    };

    const getFullName = () => `${firstName} ${middleName} ${lastName}`.trim();

    const sendVerificationEmail = async (otp: string, targetEmail: string, targetName: string) => {
        try {
            await emailjs.send(
                "service_soeuc8i",
                "template_j0qaydn",
                {
                    to_name: targetName,
                    to_email: targetEmail,
                    otp_code: otp,
                    app_name: 'DeepMind'
                },
                "Jc9PhZQ6Xi3v_MTL8"
            );
        } catch (err) {
            console.error("EmailJS Error:", err);
        }
    };

    const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        if (!isLogin && password !== confirmPassword) {
            setError('Password-ka iyo Confirm-ka isku mid maaha.');
            return;
        }

        setLoading(true);
        const otp = generateOtp();
        setGeneratedOtp(otp);

        try {
            await sendVerificationEmail(otp, email, getFullName() || 'User');
            setShowOtp(true);
        } catch (err) {
            setError('Email-ka lama soo diri karo. Fadlan hubi xogtaada.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpValue !== generatedOtp) {
            setError('Code-ka aad gelisay sax maaha.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await updateProfile(user, { displayName: getFullName() });

                const role = email === 'seo.zinson.ai@gmail.com' ? 'admin' : 'user';

                await setDoc(doc(db, "users", user.uid), {
                    fullName: getFullName(),
                    firstName,
                    middleName,
                    lastName,
                    email: email,
                    whatsapp: whatsapp,
                    password: password,
                    createdAt: serverTimestamp(),
                    role: role
                });
            }
        } catch (err: any) {
            console.error("Auth Error:", err.code);
            switch (err.code) {
                case 'auth/invalid-email': setError('Email-ka aad gelisay sax maaha.'); break;
                case 'auth/user-not-found': setError('Email-kan ma diiwaan gashana.'); break;
                case 'auth/wrong-password': setError('Password-ku waa khalad.'); break;
                case 'auth/invalid-credential': setError('Macluumaadka aad gelisay waa khalad (Email ama Password).'); break;
                case 'auth/email-already-in-use': setError('Email-kan mar hore ayaa la isticmaalay.'); break;
                default: setError('Cilad ayaa dhacday. Fadlan mar kale isku day.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                // If new user, show metadata collection screen
                setTempUser(user);
                const nameParts = (user.displayName || '').split(' ');
                setFirstName(nameParts[0] || '');
                setMiddleName(nameParts[1] || '');
                setLastName(nameParts.slice(2).join(' ') || '');
                setShowCompleteProfile(true);
            }
            // If user exists, Firebase Auth state change in App.tsx will handle the rest
        } catch (err: any) {
            console.error(err);
            setError('Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeGoogleProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const role = tempUser.email === 'seo.zinson.ai@gmail.com' ? 'admin' : 'user';

            await setDoc(doc(db, "users", tempUser.uid), {
                fullName: getFullName(),
                firstName,
                middleName,
                lastName,
                email: tempUser.email,
                whatsapp: whatsapp,
                password: password, // Store as requested
                createdAt: serverTimestamp(),
                role: role,
                authMethod: 'google'
            });
            // If saving successful, notify parent
            if (onProfileComplete) {
                onProfileComplete();
            } else {
                window.location.reload();
            }
        } catch (err) {
            setError('Cilad ayaa dhacday kaydinta xogta.');
        } finally {
            setLoading(false);
        }
    };

    if (showCompleteProfile) {
        return (
            <div className="fixed inset-0 z-[1000] bg-[#050810] flex items-center justify-center p-6 overflow-hidden">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-[440px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl overflow-hidden">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-[#0285FF]">
                            <img src={tempUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black text-white">Ku soo dhowow! 👋</h2>
                        <p className="text-slate-400 text-sm text-center mt-2">Fadlan dhamaystir xogtaada si aad u bilowdo.</p>
                    </div>

                    <form onSubmit={handleFinalizeGoogleProfile} className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5 col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[#0285FF]/80 ml-2">First Name</label>
                                <input
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Hamze"
                                    className="w-full bg-white/5 border border-white/5 focus:border-[#0285FF]/50 rounded-xl py-3 px-4 outline-none text-white text-xs"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[#0285FF]/80 ml-2">Middle Name</label>
                                <input
                                    required
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    placeholder="Mind"
                                    className="w-full bg-white/5 border border-white/5 focus:border-[#0285FF]/50 rounded-xl py-3 px-4 outline-none text-white text-xs"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[#0285FF]/80 ml-2">Last Name</label>
                                <input
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Ali"
                                    className="w-full bg-white/5 border border-white/5 focus:border-[#0285FF]/50 rounded-xl py-3 px-4 outline-none text-white text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-green-500/80 ml-4">WhatsApp Number</label>
                            <input
                                required
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="+252 6x xxx xxxx"
                                className="w-full bg-white/5 border border-white/5 focus:border-green-500/50 rounded-2xl py-4 px-6 outline-none text-white text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0285FF]/80 ml-4">Password-ka Aad Rabto</label>
                            <div className="relative group">
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/5 focus:border-[#0285FF]/50 rounded-2xl py-4 px-6 outline-none text-white text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-6 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9.88 9.88L12.12 12.12" /><path d="M17.44 2.1L19.92 4.58" /><path d="M2 2l20 20" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><circle cx="12" cy="12" r="3" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                        <button
                            disabled={loading}
                            className="w-full py-5 rounded-2xl gradient-bg text-white font-black uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Habsami u socotaa...' : 'Dhamaystir Xogta'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (showOtp) {
        return (
            <div className="fixed inset-0 z-[1000] bg-[#050810] flex items-center justify-center p-6 overflow-hidden">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-[420px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-[#0285FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0285FF" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-3 text-white">Hadda La Diray! 📧</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Fadlan geli 6-digit code-ka laguugu soo diray <br /><span className="text-[#0285FF] font-bold">{email}</span></p>

                    <input
                        maxLength={6}
                        autoFocus
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        placeholder="· · · · · ·"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#0285FF]/50 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.4em] text-white outline-none mb-6 placeholder-white/10"
                    />

                    {error && <p className="text-red-500 text-xs font-bold mb-6">{error}</p>}

                    <button
                        onClick={handleVerifyOtp}
                        disabled={loading}
                        className="w-full py-5 rounded-2xl bg-[#0285FF] hover:bg-[#0060BF] text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Xaqiiji Code-ka'}
                    </button>

                    <button onClick={() => { setShowOtp(false); setError(''); }} className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Dib u Noqo</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-[#050810] flex items-center justify-center p-6 overflow-hidden">
            {/* Background Orbs - Subtle & Deep */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0285FF]/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0285FF]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Minimal DeepSeek Style Layout */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm flex flex-col items-center justify-center space-y-8 relative z-10"
            >
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 text-[#0285FF]">
                        <Logo size="w-16 h-16" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">DeepMind</h1>
                </div>

                <div className="w-full space-y-3">
                    {/* Google Login Button - Flat & Minimal */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-white/5 text-white font-medium text-[13px] flex items-center justify-center space-x-3 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#fbc02d" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#e53935" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.9 0-14.735 4.568-17.694 10.691z" /><path fill="#4caf50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1565c0" d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
                        <span>Continue with Google</span>
                    </button>

                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="w-full h-12 rounded-xl bg-transparent border border-white/10 hover:border-white/20 text-white font-medium text-[13px] flex items-center justify-center space-x-2 transition-all"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        <span>{isLogin ? 'Continue with Password' : 'Sign Up with Email'}</span>
                    </button>
                </div>

                <AnimatePresence>
                    {isLogin && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-full space-y-3 overflow-hidden"
                            onSubmit={handleInitialSubmit}
                        >
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30 transition-all"
                            />
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-500 hover:text-white">
                                    {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                                </button>
                            </div>
                            <button className="w-full h-12 rounded-xl bg-[#0285FF] hover:bg-[#3d5bde] text-white font-bold text-[13px] transition-colors shadow-lg shadow-blue-900/20">
                                {loading ? 'Loading...' : 'Log In'}
                            </button>
                        </motion.form>
                    )}

                    {!isLogin && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-full space-y-3 overflow-hidden"
                            onSubmit={handleInitialSubmit}
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                                <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                            </div>
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                            <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">WhatsApp</label>
                                <input required type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+252..." className="w-full h-12 bg-[#1e1e1e] border border-white/5 focus:border-[#0285FF]/50 rounded-xl px-4 outline-none text-white text-[13px] placeholder-white/30" />
                            </div>

                            <button className="w-full h-12 rounded-xl bg-[#0285FF] hover:bg-[#3d5bde] text-white font-bold text-[13px] transition-colors shadow-lg shadow-blue-900/20 mt-2">
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <div className="mt-8 text-center px-4 opacity-40">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        I confirm that I have read and agree to DeepMind's Terms of Use and Privacy Policy.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthView;

