
import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import {
    collection,
    query,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    setDoc,
    serverTimestamp,
    orderBy,
    getDocs,
    where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

interface AdminDashboardProps {
    onBack: () => void;
}

type AdminTab = 'dashboard' | 'payments' | 'users' | 'groups' | 'posts' | 'sub-admins' | 'promocodes' | 'monetization' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
    const [isVerified, setIsVerified] = useState(false);
    const [pin, setPin] = useState('');
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [stats, setStats] = useState({ users: 0, payments: 0, posts: 0 });
    const [lastVisitTime, setLastVisitTime] = useState<number>(() => {
        const saved = localStorage.getItem('admin_last_users_visit');
        return saved ? parseInt(saved) : Date.now();
    });

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [monetizationApps, setMonetizationApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Group Management States
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [withdrawals, setWithdrawals] = useState<any[]>([]);

    // Form States
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('ANNOUNCEMENT');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentSearchTerm, setPaymentSearchTerm] = useState('');

    // User Management States
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [viewingUser, setViewingUser] = useState<any | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Promo Code States
    const [newPromoCode, setNewPromoCode] = useState('');
    const [promoOwnerEmail, setPromoOwnerEmail] = useState('');
    const [promoFilter, setPromoFilter] = useState('');
    const [viewingPromo, setViewingPromo] = useState<any | null>(null);

    // Create User Form
    const [createForm, setCreateForm] = useState({
        email: '',
        fullName: '',
        whatsapp: '',
        password: '',
        role: 'user'
    });

    // Sub-Admin States
    const [subAdminEmail, setSubAdminEmail] = useState('');
    const [subAdminName, setSubAdminName] = useState('');
    const [expandedMonetizationSection, setExpandedMonetizationSection] = useState<string | null>(null);

    useEffect(() => {
        if (!isVerified) return;

        setLoading(true);
        // Real-time Subscriptions
        const unsubSubs = onSnapshot(query(collection(db, "subscriptions"), orderBy("timestamp", "desc")),
            (snap) => {
                setSubscriptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => console.error("Subscriptions listener error:", err)
        );

        // Real-time Users (Sorted by latest first)
        const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")),
            (snap) => {
                const fetchedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(fetchedUsers);
            },
            (err) => {
                console.error("Users snapshot error:", err);
            }
        );

        // Real-time Posts
        const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")),
            (snap) => {
                setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            },
            (err) => {
                console.error("Posts listener error:", err);
                setLoading(false);
            }
        );

        // Real-time Promo Codes
        const unsubPromo = onSnapshot(query(collection(db, "promocodes"), orderBy("createdAt", "desc")),
            (snap) => {
                setPromoCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => console.error("Promo codes listener error (Check Firestore Rules):", err)
        );

        // Real-time Monetization Apps
        const unsubMonetization = onSnapshot(query(collection(db, "monetization"), orderBy("timestamp", "desc")),
            (snap) => {
                setMonetizationApps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => console.error("Monetization listener error:", err)
        );

        // Real-time Withdrawals
        const unsubWithdrawals = onSnapshot(query(collection(db, "withdrawals"), orderBy("timestamp", "desc")),
            (snap) => {
                setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => console.error("Withdrawals listener error:", err)
        );

        return () => {
            unsubSubs();
            unsubUsers();
            unsubPosts();
            unsubPromo();
            unsubMonetization();
            unsubWithdrawals();
        };
    }, [isVerified]);

    useEffect(() => {
        if (activeTab === 'users' && isVerified) {
            const now = Date.now();
            // We set a small delay before updating localStorage so the user can see the highlights
            const timer = setTimeout(() => {
                localStorage.setItem('admin_last_users_visit', now.toString());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [activeTab, isVerified]);

    const handleApprove = async (id: string) => {
        try {
            const subSnap = await getDoc(doc(db, "subscriptions", id));
            if (!subSnap.exists()) return;
            const subData = subSnap.data();

            await updateDoc(doc(db, "subscriptions", id), { status: 'approved' });

            // COMMISSION LOGIC: Mark as Pending for Manual Approval
            if (subData.promoCode && subData.status !== 'approved') {
                const cleanCode = subData.promoCode.trim().toUpperCase();
                const promoDocs = await getDocs(query(collection(db, "promocodes"), where("code", "==", cleanCode)));

                if (!promoDocs.empty) {
                    const promoData = promoDocs.docs[0].data();
                    const amountStr = String(subData.amount || "0");
                    const amount = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0;
                    const commission = Math.floor(amount * 0.10);

                    if (commission > 0) {
                        const ownerUid = promoData.ownerUid || promoData.ownerId;
                        if (ownerUid) {
                            await updateDoc(doc(db, "subscriptions", id), {
                                commissionStatus: 'pending',
                                commissionAmount: commission,
                                promoOwnerUid: ownerUid,
                                promoOwnerName: promoData.ownerName || 'Unknown'
                            });
                            console.log(`Commission of ${commission} SLSH marked as PENDING for ${ownerUid}`);
                        } else {
                            console.error("Promo owner UID not found for code:", cleanCode);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            alert("Cilad ayaa dhacday!");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateDoc(doc(db, "subscriptions", id), { status: 'rejected' });
        } catch (e) { alert("Cilad ayaa dhacday!"); }
    };

    const handleUpdatePassword = async () => {
        if (!editingUser || !newPassword) return;
        try {
            await updateDoc(doc(db, "users", editingUser.id), { password: newPassword });
            setEditingUser(null);
            setNewPassword('');
            alert("Password-ka waa la beddelay! ✅");
        } catch (e) { alert("Cilad ayaa dhacday!"); }
    };

    const handleCreateSubAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Check if user exists
            const userQuery = query(collection(db, "users"));
            const userDocs = await getDocs(userQuery);
            const targetUser = userDocs.docs.find(d => d.data().email === subAdminEmail);

            if (targetUser) {
                await updateDoc(doc(db, "users", targetUser.id), { role: 'sub_admin' });
                alert(`${subAdminEmail} hadda waa Sub-Admin! 👮`);
            } else {
                alert("Email-kan ma diiwaan gashana. Marka hore ha is diiwaan galiyo.");
            }
            setSubAdminEmail('');
        } catch (e) { alert("Cilad ayaa dhacday!"); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Waa la koobiyeeyey: ${text} 📋`);
    };

    const handleCreateNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Starting user creation...", createForm);
        try {
            const docRef = await addDoc(collection(db, "users"), {
                ...createForm,
                createdAt: serverTimestamp(),
                authMethod: 'manual'
            });
            console.log("User created successfully! ID:", docRef.id);
            alert("User-ka cusub waa la abuuray! ✅ ID: " + docRef.id);
            setIsCreateModalOpen(false);
            setCreateForm({ email: '', fullName: '', whatsapp: '', password: '', role: 'user' });
        } catch (err: any) {
            console.error("Create user error (DETAILED):", err);
            alert("Cilad ayaa dhacday: " + err.message);
        }
    };

    const filteredUsers = users.filter(u => {
        const search = searchTerm.toLowerCase();
        const fullName = (u.fullName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const whatsapp = (u.whatsapp || '');

        return fullName.includes(search) || email.includes(search) || whatsapp.includes(search);
    });

    const filteredSubscriptions = subscriptions.filter(s => {
        const search = paymentSearchTerm.toLowerCase();
        const email = (s.userEmail || '').toLowerCase();
        const phone = (s.transactionPhone || '');
        const school = (s.schoolName || '').toLowerCase();
        const className = (s.className || '').toLowerCase();

        return email.includes(search) || phone.includes(search) || school.includes(search) || className.includes(search);
    });

    const handleAddGroupMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;
        try {
            const userQuery = query(collection(db, "users"));
            const userDocs = await getDocs(userQuery);
            const targetUser = userDocs.docs.find(d => d.data().email === newMemberEmail);

            if (targetUser) {
                const userData = targetUser.data();
                const [school, className] = selectedGroup.split('|||');
                await setDoc(doc(db, "subscriptions", targetUser.id), {
                    uid: targetUser.id,
                    userEmail: userData.email,
                    school: school,
                    schoolName: school,
                    className: className,
                    status: 'approved',
                    amount: 'MANUAL_ADD',
                    timestamp: serverTimestamp()
                });
                alert(`${newMemberEmail} waa lagu daray group-ka! ✅`);
                setNewMemberEmail('');
            } else {
                alert("User-ka lama hayo.");
            }
        } catch (e) { alert("Cilad ayaa dhacday!"); }
    };

    const calculateEarnings = () => {
        const gross = subscriptions
            .filter(s => s.status === 'approved' && s.amount !== 'MANUAL_ADD')
            .reduce((acc, curr) => {
                const val = parseInt(curr.amount?.replace(/[^0-9]/g, '') || '0');
                return acc + val;
            }, 0);

        const deductions = subscriptions
            .filter(s => s.status === 'approved' && (s.commissionStatus === 'deducted' || s.commissionStatus === 'released'))
            .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);

        return gross - deductions;
    };


    const getGroups = () => {
        const groupsMap = new Map();
        subscriptions.filter(s => s.status === 'approved').forEach(s => {
            const key = `${s.schoolName}|||${s.className}`;
            if (!groupsMap.has(key)) groupsMap.set(key, []);
            groupsMap.get(key).push(s);
        });
        return Array.from(groupsMap.entries());
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "posts"), {
                title: postTitle,
                content: postContent,
                category: postCategory,
                timestamp: serverTimestamp(),
                author: 'Admin'
            });
            setPostTitle('');
            setPostContent('');
            alert("Post-igii waa la dhigay! 🎉");
        } catch (e) { alert("Cilad ayaa dhacday!"); }
    };

    const handleCreatePromoCode = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Find owner
            const owner = users.find(u => u.email === promoOwnerEmail);
            if (!owner) {
                alert("User-ka lama hayo.");
                return;
            }

            // Check if owner is approved (paid)
            const sub = subscriptions.find(s => s.uid === owner.id && s.status === 'approved');
            if (!sub) {
                alert("User-kan weli uma muuqdo mid lacag bixiyey (Approved). Kaliya dadka lacagta bixiyey ayaa promo code yeelan kara.");
                return;
            }

            const code = newPromoCode.trim().toUpperCase();
            if (promoCodes.find(p => p.code === code)) {
                alert("Promo code-kan horay ayaa loo abuuray.");
                return;
            }

            await addDoc(collection(db, "promocodes"), {
                code: code,
                ownerEmail: owner.email,
                ownerUid: owner.id,
                ownerName: owner.fullName,
                createdAt: serverTimestamp(),
                usageCount: 0
            });

            alert(`Promo Code ${code} waa la abuuray! ✅`);
            setNewPromoCode('');
            setPromoOwnerEmail('');
        } catch (error: any) {
            console.error("Error creating promo code:", error);
            if (error.code === 'permission-denied') {
                alert("Cilad: Ma haysatid ogolaansho (Permission Denied). Fadlan hubi Firestore Rules-ka.");
            } else {
                alert("Cilad ayaa dhacday markii promo code-ka la abuurayey. Fadlan console-ka fiiri.");
            }
        }
    };

    const getSocialIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('tiktok')) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.29 2.8-.95 4.04-.66 1.25-1.74 2.3-3.07 2.85-1.33.55-2.83.67-4.24.47-1.4-.19-2.73-.8-3.79-1.76-1.06-.96-1.81-2.25-2.12-3.63-.31-1.38-.17-2.86.41-4.13.58-1.27 1.62-2.35 2.89-2.95 1.27-.6 2.76-.79 4.13-.57.17.03.35.07.51.12v4.19c-.46-.17-.96-.26-1.46-.26-.49 0-.99.1-1.44.29-.45.2-.84.49-1.16.86-.31.37-.53.81-.63 1.28-.1.47-.1.95 0 1.42.1.47.31.91.63 1.29.31.37.71.67 1.16.86.45.19.95.29 1.44.29.49 0 .99-.1 1.43-.29.45-.19.84-.49 1.16-.86.31-.38.53-.82.63-1.29.1-.47.1-.95 0-1.42.01-4.66.01-9.33.01-13.99z" /></svg>;
        if (p.includes('facebook')) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
        if (p.includes('youtube')) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
        if (p.includes('instagram')) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>;
        if (p.includes('twitter') || p.includes('x')) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.25 2.25h6.634l4.717 6.237L18.244 2.25zM16.083 19.777h1.833L7.084 4.126H5.117l10.966 15.651z" /></svg>;
        return <div className="w-4 h-4 border border-current rounded flex items-center justify-center text-[10px]">{platform[0]}</div>;
    };

    const handleIndividualSocialApprove = async (appId: string, platform: string) => {
        try {
            const appSnap = await getDoc(doc(db, "monetization", appId));
            if (!appSnap.exists()) return;
            const data = appSnap.data();
            const verifiedSocials = data.verifiedSocials || {};

            await updateDoc(doc(db, "monetization", appId), {
                verifiedSocials: { ...verifiedSocials, [platform]: true }
            });
            alert(`${platform} verified! ✅`);
        } catch (e) { console.error(e); }
    };

    const handleIndividualSocialReject = async (app: any, platform: string) => {
        if (!confirm(`Tallaabadani waxay qofka siinaysaa Strike sidoo kalena waa laga tirtirayaa platform-kan (${platform}). Ma huba?`)) return;

        try {
            const strikes = (app.socialStrikes || 0) + 1;
            const newUsernames = { ...app.socialUsernames };
            delete newUsernames[platform];

            const newVerified = { ...app.verifiedSocials };
            delete newVerified[platform];

            await updateDoc(doc(db, "monetization", app.id), {
                socialStatus: 'rejected', // Mark status as rejected so they know something failed
                socialStrikes: strikes,
                socialUsernames: newUsernames,
                verifiedSocials: newVerified
            });

            if (strikes >= 3) {
                await updateDoc(doc(db, "monetization", app.id), { status: 'rejected' });
                alert("User rejected due to 3 strikes!");
            } else {
                alert(`Strike added! Platform ${platform} removed.`);
            }
        } catch (e) { console.error(e); }
    };

    const handleApprovePayment = async (app: any) => {
        try {
            // 1. Update monetization document
            await updateDoc(doc(db, "monetization", app.id), { paymentStatus: 'approved' });

            // 2. Grant Blue Tick immediately to users profile
            await updateDoc(doc(db, "users", app.userId), {
                verificationBadge: true
            });

            alert("Payment Verified & Blue Tick Granted! ✅");
        } catch (e) {
            console.error(e);
            alert("Error verifying payment.");
        }
    };

    const handleApproveIdentity = async (appId: string) => {
        try {
            await updateDoc(doc(db, "monetization", appId), { identityStatus: 'approved' });
            alert("Identity Profile Approved! ✅");
        } catch (e) { console.error(e); }
    };

    const handleApproveMonetization = async (app: any) => {
        if (!confirm(`Tallaabadani waa tan ugu dambaysa. Ma huba inay ${app.userName} ambassador u aqoonsanayso?`)) return;

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            // 1. Create Promo Code
            await addDoc(collection(db, "promocodes"), {
                code,
                ownerUid: app.userId, // Unified to ownerUid
                ownerEmail: app.phone,
                ownerName: app.userName,
                createdAt: serverTimestamp(),
                usageCount: 0
            });

            // 2. Update Monetization Status
            await updateDoc(doc(db, "monetization", app.id), {
                status: 'approved',
                promoCode: code,
                balance: 0,
                totalEarned: 0,
                totalInvites: 0,
                history: []
            });

            // 3. Mark user as verified/ambassador in users collection
            await updateDoc(doc(db, "users", app.userId), {
                isAmbassador: true,
                verificationBadge: true
            });

            alert(`Ambassador Approved! Code: ${code}`);
        } catch (e) {
            console.error(e);
            alert("Error approving monetization.");
        }
    };

    const handleDeductCommission = async (id: string) => {
        try {
            await updateDoc(doc(db, "subscriptions", id), { commissionStatus: 'deducted' });
            alert("Lacagta waa laga jaray Earnings-ka guud! ✅");
        } catch (e) {
            console.error("Deduct error:", e);
            alert("Cilad ayaa dhacday!");
        }
    };

    const handleReleaseCommission = async (id: string) => {
        try {
            const subSnap = await getDoc(doc(db, "subscriptions", id));
            if (!subSnap.exists()) return;
            const subData = subSnap.data();

            if (subData.commissionStatus === 'released') return;

            const ownerUid = subData.promoOwnerUid;
            const commission = subData.commissionAmount || 0;

            if (ownerUid) {
                const monApp = monetizationApps.find(a => a.userId === ownerUid);
                if (monApp) {
                    const monDocRef = doc(db, "monetization", monApp.id);
                    const monSnap = await getDoc(monDocRef);
                    const monData = monSnap.exists() ? monSnap.data() : {};

                    // Fetch invited user's name
                    let invitedName = subData.userEmail || 'Anonymous User';
                    try {
                        const userSnap = await getDoc(doc(db, "users", subData.uid));
                        if (userSnap.exists()) {
                            invitedName = userSnap.data().fullName || invitedName;
                        }
                    } catch (e) { console.error(e); }

                    const newEntry = {
                        name: invitedName,
                        email: subData.userEmail || '',
                        joinedDate: new Date(),
                        commission: commission,
                        paymentAmount: parseInt(String(subData.amount).replace(/[^0-9]/g, '')) || 0
                    };

                    await updateDoc(monDocRef, {
                        balance: (monData.balance || 0) + commission,
                        totalEarned: (monData.totalEarned || 0) + commission,
                        invitedUsers: [...(monData.invitedUsers || []), newEntry],
                        history: [{
                            type: 'commission',
                            amount: commission,
                            fromUser: subData.userEmail || 'Unknown',
                            timestamp: new Date()
                        }, ...(monData.history || [])]
                    });

                    await updateDoc(doc(db, "subscriptions", id), { commissionStatus: 'released' });
                    alert("Lacagta waxaa loo fasaxay Ambassador-ka! 🚀");
                }
            }
        } catch (e) {
            console.error("Release error:", e);
            alert("Cilad ayaa dhacday!");
        }
    };

    const SidebarItem = ({ id, label, icon }: { id: AdminTab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                if (isMobile) setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${activeTab === id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white active:bg-white/10'
                }`}
        >
            <span className={`shrink-0 transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
            <span className={`font-black text-[12px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {label}
            </span>
            {activeTab === id && (
                <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-8 bg-white rounded-r-full" />
            )}
        </button>
    );

    if (!isVerified) {
        return (
            <div className="fixed inset-0 z-[1000] bg-[#050810] flex items-center justify-center p-6 font-sans overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent opacity-60 animate-pulse" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-sm bg-[#111622]/80 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center shadow-2xl shadow-blue-600/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>

                    <h2 className="text-3xl font-black mb-3 tracking-tighter text-white">Xaqiiji! 🔐</h2>
                    <p className="text-slate-500 text-[13px] mb-12 font-bold uppercase tracking-widest opacity-60">Admin Only Access</p>

                    <div className="flex justify-center space-x-4 mb-12">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${pin.length > i ? 'bg-blue-500 border-blue-500 scale-125 shadow-lg shadow-blue-500/50' : 'border-white/10'}`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-10">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((val) => (
                            <button
                                key={val.toString()}
                                onClick={() => {
                                    if (val === 'C') setPin('');
                                    else if (val === '✓') {
                                        if (pin === '4268') setIsVerified(true);
                                        else { alert("PIN-ku waa khalad!"); setPin(''); }
                                    }
                                    else if (pin.length < 4) {
                                        const newPin = pin + val;
                                        setPin(newPin);
                                        if (newPin === '4268') {
                                            setTimeout(() => setIsVerified(true), 300);
                                        }
                                    }
                                }}
                                className={`h-16 lg:h-20 rounded-[1.5rem] lg:rounded-2xl flex items-center justify-center font-black text-xl lg:text-2xl transition-all active:scale-90 border border-transparent ${val === '✓' ? 'bg-green-600 text-white col-span-1 shadow-lg shadow-green-600/20' :
                                    val === 'C' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white hover:border-white/10 shadow-xl'
                                    }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onBack}
                        className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all underline underline-offset-8 decoration-white/10 hover:decoration-white/30"
                    >
                        Ku Noqo App-ka
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-[#050810] text-white overflow-hidden font-sans relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
            </div>
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? (isSidebarOpen ? '85%' : 0) : (isSidebarOpen ? 300 : 100),
                    x: isMobile ? (isSidebarOpen ? 0 : -20) : 0
                }}
                className={`fixed lg:relative h-screen bg-[#111622]/95 backdrop-blur-xl border-r border-white/5 flex flex-col pt-12 pb-8 z-[110] overflow-hidden shadow-[30px_0_60px_-15px_rgba(0,0,0,0.5)] lg:shadow-none`}
            >
                <div className="px-8 mb-12 flex items-center space-x-4 overflow-hidden">
                    <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl shadow-lg shadow-blue-600/20">
                        <Logo size="w-8 h-8" />
                    </div>
                    {isSidebarOpen && (
                        <div className="overflow-hidden">
                            <h2 className="text-xl font-black tracking-tighter italic">AdminPanel</h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-60 leading-tight">Master Dashboard</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2.5 overflow-y-auto no-scrollbar">
                    <SidebarItem id="dashboard" label="Overview" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>} />
                    <SidebarItem id="payments" label="Money / Subs" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>} />
                    <SidebarItem id="users" label="User Data" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
                    <SidebarItem id="groups" label="Education" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M19 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>} />
                    <SidebarItem id="posts" label="Content Hub" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>} />
                    <SidebarItem id="promocodes" label="Referrals" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>} />
                    <SidebarItem id="monetization" label="Monetization" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>} />
                </nav>

                <div className="px-5 pt-8 border-t border-white/5">
                    <button onClick={onBack} className="w-full flex items-center space-x-4 px-6 py-5 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 active:scale-95">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-[0.2em]">Exit Console</span>}
                    </button>
                    {!isMobile && (
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-[#050810] hover:scale-110 shadow-2xl transition-all">
                            {isSidebarOpen ? '<' : '>'}
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="px-6 lg:px-10 py-6 lg:py-10 flex items-center justify-between border-b border-white/5 bg-[#050810]/50 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center space-x-4">
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-400 active:bg-white/10 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl lg:text-4xl font-black tracking-tighter uppercase leading-none">
                                {activeTab === 'dashboard' ? 'Overview' :
                                    activeTab === 'promocodes' ? 'Referrals' :
                                        activeTab === 'sub-admins' ? 'Security' :
                                            activeTab}
                            </h1>
                            <p className="text-slate-500 text-[9px] lg:text-sm font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">Admin Management</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 no-scrollbar">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10 animate-fade-in">
                            {loading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5 shadow-2xl animate-pulse">
                                            <div className="h-3 w-16 bg-white/5 rounded mb-4"></div>
                                            <div className="h-8 w-24 bg-white/10 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="tab-dashboard-content">
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 pb-6">
                                        {/* Total Earnings */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Net Earnings</p>
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-green-500 truncate">{calculateEarnings().toLocaleString()} <span className="text-[8px]">SLSH</span></h2>
                                            <div className="mt-4 h-6 w-full opacity-30">
                                                <svg viewBox="0 0 100 20" className="w-full h-full"><path d="M0 15 Q 10 5, 20 15 T 40 10 T 60 18 T 80 8 T 100 12" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                            </div>
                                        </div>

                                        {/* Ambassador Revenue */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Fees</p>
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-[#0285FF] truncate">{(monetizationApps.filter(a => a.status === 'approved').length * 10000).toLocaleString()} <span className="text-[8px]">SLSH</span></h2>
                                            <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">{monetizationApps.filter(a => a.status === 'approved').length} Members</p>
                                        </div>

                                        {/* Total Users Card */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="19" cy="7" r="4" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Total Users</p>
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-blue-400 truncate">{users.length.toLocaleString()}</h2>
                                            <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">Platform</p>
                                        </div>

                                        {/* Promo Success */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Promos</p>
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-purple-500 truncate">{subscriptions.filter(s => s.promoCode && s.status === 'approved').length}</h2>
                                            <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">Conversions</p>
                                        </div>

                                        {/* Total Broadcasts Card */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Alerts</p>
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-yellow-500 truncate">{posts.length.toLocaleString()}</h2>
                                            <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">Active News</p>
                                        </div>

                                        {/* Daily Withdrawals */}
                                        <div className="bg-[#111622] rounded-[1.5rem] lg:rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:scale-125 transition-transform"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg></div>
                                            <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Today</p>
                                            {(() => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const count = withdrawals.filter(w => {
                                                    const d = w.createdAt?.toDate ? w.createdAt.toDate() : (w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000) : new Date(w.createdAt));
                                                    return d >= today;
                                                }).length;
                                                return <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-red-500 truncate">{count} <span className="text-[8px]">URGENT</span></h2>;
                                            })()}
                                            <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">Requests</p>
                                        </div>
                                    </div>

                                    {/* PLATFORM GROWTH TRENDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mt-10">
                                        <div className="bg-[#111622] rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                                            <div>
                                                <h3 className="text-xl font-black mb-2 flex items-center">
                                                    User Growth
                                                    <span className="ml-3 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] rounded-full font-black uppercase tracking-tighter">Live</span>
                                                </h3>
                                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Growth rate matching platform vitality</p>
                                            </div>
                                            <div className="flex-1 flex items-end -mx-10 mt-4 h-24">
                                                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                                    <defs>
                                                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#0285FF" stopOpacity="0.3" />
                                                            <stop offset="100%" stopColor="#0285FF" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 0 40 L 0 32 Q 15 30, 25 25 T 45 20 T 65 10 T 85 12 T 100 2 L 100 40 Z" fill="url(#userGrad)" stroke="none" />
                                                    <path d="M 0 32 Q 15 30, 25 25 T 45 20 T 65 10 T 85 12 T 100 2" fill="none" stroke="#0285FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="flex justify-between items-center relative mt-2 pt-4 border-t border-white/5">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">7 Day Trend</span>
                                                <span className="text-blue-500 font-black text-sm drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">+28.4% ↑</span>
                                            </div>
                                        </div>

                                        <div className="bg-[#111622] rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all"></div>
                                            <div>
                                                <h3 className="text-xl font-black mb-2 flex items-center">
                                                    Revenue Pulse
                                                    <span className="ml-3 px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] rounded-full font-black uppercase tracking-tighter">Healthy</span>
                                                </h3>
                                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Earning momentum overview</p>
                                            </div>
                                            <div className="flex-1 flex items-end -mx-10 mt-4 h-24">
                                                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                                    <defs>
                                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M 0 40 L 0 38 Q 10 37, 20 32 T 40 28 T 60 15 T 80 18 T 100 5 L 100 40 Z" fill="url(#revGrad)" stroke="none" />
                                                    <path d="M 0 38 Q 10 37, 20 32 T 40 28 T 60 15 T 80 18 T 100 5" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="flex justify-between items-center relative mt-2 pt-4 border-t border-white/5">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Realtime Pulse</span>
                                                <span className="text-green-500 font-black text-sm drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">Bullish 🔥</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mt-10 pb-10">
                                        <div className="bg-[#111622] rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0285FF]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                            <h3 className="text-lg lg:text-xl font-black mb-8 flex items-center relative"><span className="w-2 h-2 bg-[#0285FF] rounded-full mr-3 animate-pulse"></span> Latest News</h3>
                                            <div className="space-y-4 lg:space-y-6 relative">
                                                {posts.slice(0, 3).map(p => (
                                                    <div key={p.id} className="p-4 lg:p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-[#0285FF]/30 transition-all group">
                                                        <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-500 mb-1 tracking-[0.2em]">{p.category}</p>
                                                        <h4 className="font-bold text-sm lg:text-[15px] mb-2 group-hover:text-[#0285FF] transition-colors">{p.title}</h4>
                                                        <p className="text-[11px] lg:text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#111622] rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                            <h3 className="text-lg lg:text-xl font-black mb-8 flex items-center relative"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span> Community Summary</h3>
                                            <div className="space-y-3 lg:space-y-4 relative">
                                                {getGroups().slice(0, 5).map(([key, members]: any) => (
                                                    <div key={key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                                        <span className="text-xs font-bold text-white/80 uppercase tracking-tight">{key}</span>
                                                        <span className="text-[9px] font-black bg-blue-600/10 text-blue-500 px-3 py-1.5 rounded-xl border border-blue-500/10 shrink-0">{members.length} Arday</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-8 animate-fade-in text-white/90">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-blue-500">Subscription Requests</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{filteredSubscriptions.length} total found</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <input
                                        type="text"
                                        placeholder="Search by email, phone, code or class..."
                                        value={paymentSearchTerm}
                                        onChange={e => setPaymentSearchTerm(e.target.value)}
                                        className="w-full bg-[#111622] border border-white/5 rounded-2xl py-3.5 px-12 outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </div>
                                </div>
                                <select
                                    value={promoFilter}
                                    onChange={e => setPromoFilter(e.target.value)}
                                    className="bg-[#111622] border border-white/5 rounded-2xl py-3 px-6 outline-none focus:border-blue-500/50 text-sm font-bold text-slate-400"
                                >
                                    <option value="">All Payments</option>
                                    <option value="PROMO">With Promo Code</option>
                                    {promoCodes.map(p => (
                                        <option key={p.id} value={p.code}>{p.code}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-[#111622] shadow-2xl">
                                {isMobile ? (
                                    <div className="divide-y divide-white/5">
                                        {subscriptions.filter(s => {
                                            const matchesSearch = (s.userEmail || '').toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
                                                (s.transactionPhone || '').includes(paymentSearchTerm) ||
                                                (s.promoCode || '').toLowerCase().includes(paymentSearchTerm.toLowerCase());
                                            const matchesPromo = !promoFilter ? true :
                                                promoFilter === 'PROMO' ? !!s.promoCode : s.promoCode === promoFilter;
                                            return matchesSearch && matchesPromo;
                                        }).length === 0 ? (
                                            <div className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No requests found</div>
                                        ) : (
                                            subscriptions.filter(s => {
                                                const matchesSearch = (s.userEmail || '').toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
                                                    (s.transactionPhone || '').includes(paymentSearchTerm) ||
                                                    (s.promoCode || '').toLowerCase().includes(paymentSearchTerm.toLowerCase());
                                                const matchesPromo = !promoFilter ? true :
                                                    promoFilter === 'PROMO' ? !!s.promoCode : s.promoCode === promoFilter;
                                                return matchesSearch && matchesPromo;
                                            }).map(sub => (
                                                <div key={sub.id} className="p-6 space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-black text-[15px] truncate">{sub.userEmail}</span>
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{sub.schoolName} • {sub.className}</span>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${sub.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                            sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-[#0285FF]/10 text-[#0285FF] animate-pulse'
                                                            }`}>
                                                            {sub.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Amount</p>
                                                            <p className="text-sm font-black text-white">{sub.amount}</p>
                                                        </div>
                                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Method</p>
                                                            <p className="text-[10px] font-black text-[#0285FF] uppercase">{sub.paymentMethod || 'UNKNOWN'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Phone Number</p>
                                                            <span className="font-black text-white text-sm tracking-widest">{sub.transactionPhone}</span>
                                                        </div>
                                                        {sub.promoCode && (
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Promo</p>
                                                                <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded text-[10px] font-black">{sub.promoCode}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {sub.status === 'pending' && (
                                                        <div className="flex items-center space-x-3 pt-3">
                                                            <button
                                                                onClick={() => handleApprove(sub.id)}
                                                                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                                                            >
                                                                Approve ✓
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(sub.id)}
                                                                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                                            >
                                                                Reject ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left min-w-[700px]">
                                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                <tr>
                                                    <th className="px-8 py-5">User / Class</th>
                                                    <th className="px-6 py-5">Amount</th>
                                                    <th className="px-6 py-5">Phone / Method</th>
                                                    <th className="px-6 py-5">Promo Code</th>
                                                    <th className="px-6 py-5">Status</th>
                                                    <th className="px-8 py-5 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {subscriptions.filter(s => {
                                                    const matchesSearch = (s.userEmail || '').toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
                                                        (s.transactionPhone || '').includes(paymentSearchTerm) ||
                                                        (s.promoCode || '').toLowerCase().includes(paymentSearchTerm.toLowerCase());
                                                    const matchesPromo = !promoFilter ? true :
                                                        promoFilter === 'PROMO' ? !!s.promoCode : s.promoCode === promoFilter;
                                                    return matchesSearch && matchesPromo;
                                                }).length === 0 ? (
                                                    <tr><td colSpan={6} className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No requests found</td></tr>
                                                ) : subscriptions.filter(s => {
                                                    const matchesSearch = (s.userEmail || '').toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
                                                        (s.transactionPhone || '').includes(paymentSearchTerm) ||
                                                        (s.promoCode || '').toLowerCase().includes(paymentSearchTerm.toLowerCase());
                                                    const matchesPromo = !promoFilter ? true :
                                                        promoFilter === 'PROMO' ? !!s.promoCode : s.promoCode === promoFilter;
                                                    return matchesSearch && matchesPromo;
                                                }).map(sub => (
                                                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-[15px]">{sub.userEmail}</span>
                                                                <span className="text-[11px] font-bold text-blue-500 uppercase">{sub.schoolName} • {sub.className}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 font-black text-white/80">{sub.amount}</td>
                                                        <td className="px-6 py-6">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center space-x-2 group/copy">
                                                                    <span className="font-black text-[#0285FF]">{sub.transactionPhone}</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(sub.transactionPhone); }}
                                                                        className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1.5 rounded-lg bg-[#0285FF]/10 hover:bg-[#0285FF]/20 text-[#0285FF]"
                                                                        title="Copy Phone"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                                                                    </button>
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase text-slate-500">{sub.paymentMethod || 'UNKNOWN'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 font-black text-purple-500">
                                                            {sub.promoCode ? (
                                                                <span className="bg-purple-500/10 px-2 py-1 rounded">{sub.promoCode}</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sub.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                                sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-[#0285FF]/10 text-[#0285FF] animate-pulse'
                                                                }`}>
                                                                {sub.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            {sub.status === 'pending' && (
                                                                <div className="flex items-center justify-end space-x-3">
                                                                    <button onClick={() => handleApprove(sub.id)} className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all">✓</button>
                                                                    <button onClick={() => handleReject(sub.id)} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all">✕</button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-[#0285FF]">Registered Users</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{filteredUsers.length} total found</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="h-12 px-6 rounded-2xl bg-[#0285FF] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#0285FF]/20 active:scale-95 transition-all"
                                    >
                                        + Create New User
                                    </button>
                                    <div className="relative w-full md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by name, email or phone..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full bg-[#111622] border border-white/5 rounded-2xl py-3 px-12 outline-none focus:border-[#0285FF]/50 transition-all font-bold text-sm"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-[#111622] shadow-2xl">
                                {isMobile ? (
                                    <div className="divide-y divide-white/5">
                                        {filteredUsers.length === 0 ? (
                                            <div className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No users found</div>
                                        ) : (
                                            filteredUsers.map(u => {
                                                const createdTime = u.createdAt?.seconds ? u.createdAt.seconds * 1000 :
                                                    u.createdAt?.toMillis ? u.createdAt.toMillis() : 0;
                                                const isNew = createdTime > lastVisitTime;

                                                return (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => setViewingUser(u)}
                                                        className={`p-6 flex items-center justify-between hover:bg-white/[0.02] active:bg-white/[0.05] transition-all cursor-pointer ${isNew ? 'bg-[#0285FF]/[0.03]' : ''}`}
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-[#0285FF]/10 flex items-center justify-center text-[#0285FF] font-black text-xl shrink-0">
                                                                {u.fullName?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="font-black text-[15px] truncate">{u.fullName}</span>
                                                                    {isNew && (
                                                                        <span className="px-1.5 py-0.5 bg-[#0285FF] text-white text-[8px] font-black rounded uppercase shrink-0">NEW</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-green-500 font-bold text-xs">{u.whatsapp}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}
                                                                className="p-3 rounded-xl bg-blue-500/10 text-blue-500"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                            </button>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700"><path d="m9 18 6-6-6-6" /></svg>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            <tr>
                                                <th className="px-8 py-5">Full Name / Role</th>
                                                <th className="px-6 py-5">WhatsApp</th>
                                                <th className="px-6 py-5">Email</th>
                                                <th className="px-6 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.length === 0 ? (
                                                <tr><td colSpan={4} className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No users found</td></tr>
                                            ) : (
                                                filteredUsers.map(u => {
                                                    const createdTime = u.createdAt?.seconds ? u.createdAt.seconds * 1000 :
                                                        u.createdAt?.toMillis ? u.createdAt.toMillis() : 0;
                                                    const isNew = createdTime > lastVisitTime;

                                                    return (
                                                        <tr
                                                            key={u.id}
                                                            onClick={() => setViewingUser(u)}
                                                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${isNew ? 'bg-[#0285FF]/[0.03] relative' : ''}`}
                                                        >
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center space-x-4 text-left">
                                                                    <div className="w-10 h-10 rounded-full bg-[#0285FF]/10 flex items-center justify-center text-[#0285FF] font-black">
                                                                        {u.fullName?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="font-black text-[15px]">{u.fullName}</span>
                                                                            {isNew && (
                                                                                <span className="px-1.5 py-0.5 bg-[#0285FF] text-white text-[8px] font-black rounded uppercase animate-pulse">NEW</span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{u.role || 'user'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-6 font-bold text-green-500">
                                                                <div className="flex items-center space-x-2 group/copy">
                                                                    <span>{u.whatsapp}</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(u.whatsapp); }}
                                                                        className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-6 text-slate-300 font-medium">{u.email}</td>
                                                            <td className="px-8 py-6 text-right">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    <button
                                                                        title="Details"
                                                                        onClick={(e) => { e.stopPropagation(); setViewingUser(u); }}
                                                                        className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-all"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                                                    </button>
                                                                    <button
                                                                        title="Edit Password"
                                                                        onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}
                                                                        className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-all"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                                    </button>
                                                                    <button
                                                                        title="Delete User"
                                                                        onClick={async (e) => { e.stopPropagation(); if (confirm('Tirtir user-kan?')) await deleteDoc(doc(db, "users", u.id)); }}
                                                                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="space-y-10 animate-fade-in relative">
                            {/* Group List */}
                            {!selectedGroup ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {getGroups().map(([key, members]: any) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedGroup(key)}
                                            className="bg-[#111622] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl text-left hover:scale-[1.02] active:scale-95 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M19 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                                            </div>
                                            <h4 className="text-xl font-black mb-2">{key.split('|||')[0]}</h4>
                                            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">{key.split('|||')[1]}</p>
                                            <div className="mt-8 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{members.length} Members</span>
                                                <span className="text-blue-500 text-xs font-black">Maamul ➔</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center space-x-6">
                                        <button onClick={() => setSelectedGroup(null)} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
                                        </button>
                                        <div>
                                            <h3 className="text-3xl font-black">{selectedGroup.replace('|||', ' • ')}</h3>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Group Management</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 overflow-x-auto rounded-[3rem] border border-white/5 bg-[#111622] p-2 shadow-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                    <tr>
                                                        <th className="px-8 py-5">Member</th>
                                                        <th className="px-6 py-5 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {(getGroups().find(([k]) => k === selectedGroup)?.[1] as any[] || []).map((m: any) => (
                                                        <tr key={m.id} className="hover:bg-white/[0.02]">
                                                            <td className="px-8 py-5">
                                                                <span className="font-black text-sm">{m.userEmail}</span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button
                                                                    onClick={async () => { if (confirm('Ma ka saartaa qofka group-ka?')) await deleteDoc(doc(db, "subscriptions", m.id)); }}
                                                                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                                                >
                                                                    Kasaar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="bg-[#111622] rounded-[3rem] p-10 border border-white/5 shadow-2xl h-fit">
                                            <h4 className="text-lg font-black mb-6">Ku dar Member</h4>
                                            <form onSubmit={handleAddGroupMember} className="space-y-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">User Email</label>
                                                    <input
                                                        required
                                                        type="email"
                                                        value={newMemberEmail}
                                                        onChange={e => setNewMemberEmail(e.target.value)}
                                                        placeholder="email@example.com"
                                                        className="w-full bg-white/5 border border-white/5 focus:border-blue-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                                    />
                                                </div>
                                                <button className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Add to Group ✅</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sub-admins' && (
                        <div className="max-w-2xl animate-fade-in">
                            <h3 className="text-xl font-black tracking-tight text-green-500 mb-8">Manage Staff</h3>
                            <form onSubmit={handleCreateSubAdmin} className="space-y-6 bg-[#111622] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                <p className="text-sm text-slate-400 font-medium">Geli email-ka qofka aad rabto inaad ka dhigto Sub-Admin. Waa inuu horay ugu diiwaan gashan yahay app-ka.</p>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">User Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={subAdminEmail}
                                        onChange={e => setSubAdminEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        className="w-full bg-white/5 border border-white/5 focus:border-green-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                    />
                                </div>
                                <button className="w-full py-5 rounded-2xl bg-green-600 text-white font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl shadow-green-600/20">Grant Sub-Admin Access 👨‍✈️</button>
                            </form>

                            <div className="mt-12 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Current Sub-Admins</h4>
                                {users.filter(u => u.role === 'sub_admin').map(admin => (
                                    <div key={admin.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                        <div>
                                            <p className="font-black text-sm">{admin.fullName}</p>
                                            <p className="text-xs text-slate-500 font-bold">{admin.email}</p>
                                        </div>
                                        <button onClick={async () => await updateDoc(doc(db, "users", admin.id), { role: 'user' })} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Revoke Access</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="max-w-2xl animate-fade-in">
                            <h3 className="text-xl font-black tracking-tight text-purple-500 mb-8">Broadcast System</h3>
                            <form onSubmit={handleCreatePost} className="space-y-6 bg-[#111622] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Category</label>
                                    <select
                                        value={postCategory}
                                        onChange={e => setPostCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl py-4 px-6 outline-none text-white font-bold"
                                    >
                                        <option value="ANNOUNCEMENT">Announcement</option>
                                        <option value="UPDATE">App Update</option>
                                        <option value="NEW_AI">New AI Agent</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Post Title</label>
                                    <input
                                        required
                                        value={postTitle}
                                        onChange={e => setPostTitle(e.target.value)}
                                        placeholder="Title of this news..."
                                        className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Content</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={postContent}
                                        onChange={e => setPostContent(e.target.value)}
                                        placeholder="Detailed content for Home and Channel..."
                                        className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-[2.5rem] py-6 px-10 outline-none text-white font-medium"
                                    />
                                </div>
                                <button className="w-full py-5 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl shadow-purple-600/20">Publish Now 🚀</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'promocodes' && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Create Form */}
                                <div className="bg-[#111622] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl h-fit">
                                    <h3 className="text-xl font-black mb-6 text-purple-500">Abuur Promo Code</h3>
                                    <form onSubmit={handleCreatePromoCode} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Promo Code</label>
                                            <input
                                                required
                                                value={newPromoCode}
                                                onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                                                placeholder="TUSAALE: ZINSON20"
                                                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email-ka Iska leh (Owner)</label>
                                            <input
                                                required
                                                type="email"
                                                value={promoOwnerEmail}
                                                onChange={e => setPromoOwnerEmail(e.target.value)}
                                                placeholder="user@example.com"
                                                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                            />
                                        </div>
                                        <button className="w-full py-5 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-purple-600/20">Grant Promo Code 🎁</button>
                                    </form>
                                </div>

                                {/* List */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                        <div>
                                            <h3 className="text-xl font-black text-white">Active Promo Codes</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage and track your referral system</p>
                                        </div>
                                        <div className="bg-purple-600/20 px-4 py-2 rounded-2xl border border-purple-500/20">
                                            <span className="text-purple-500 font-black text-lg">{promoCodes.length}</span>
                                            <span className="text-[10px] text-purple-500/60 font-black ml-2 uppercase">Codes</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {promoCodes.length === 0 ? (
                                            <div className="col-span-2 py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-20"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                                                <p className="font-black uppercase tracking-widest text-[10px]">No active promo codes</p>
                                            </div>
                                        ) : promoCodes.map(p => {
                                            const usage = subscriptions.filter(s => s.promoCode === p.code && s.status === 'approved').length;
                                            return (
                                                <div key={p.id} className="bg-[#111622] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-2xl">
                                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition-all"></div>

                                                    <div className="flex items-center justify-between mb-6 relative">
                                                        <div className="flex flex-col">
                                                            <span className="bg-purple-600 text-white px-4 py-1.5 rounded-xl font-black text-sm tracking-wider shadow-lg shadow-purple-600/20">{p.code}</span>
                                                        </div>
                                                        <button
                                                            onClick={async () => { if (confirm('Ma huba inay tirtirayso Promo Code-kan?')) await deleteDoc(doc(db, "promocodes", p.id)); }}
                                                            className="p-3 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                        </button>
                                                    </div>

                                                    <div className="space-y-1 mb-8 relative">
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Code Owner</p>
                                                        <h4 className="text-lg font-black text-white">{p.ownerName || 'Unknown User'}</h4>
                                                        <p className="text-xs text-slate-500 font-bold truncate">{p.ownerEmail}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl mb-6 border border-white/5">
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Usages</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-2xl font-black text-blue-500">
                                                                {subscriptions.filter(s => s.promoCode === p.code && s.status === 'approved').length}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">Users</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setViewingPromo(p)}
                                                        className="w-full py-4 rounded-[1.5rem] bg-white/5 text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all border border-white/5 group-hover:border-purple-500/30 flex items-center justify-center space-x-2"
                                                    >
                                                        <span>Eeg Faahfaahinta</span>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'monetization' && (
                        <div className="animate-fade-in space-y-10">
                            {/* Summary Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                                <div>
                                    <h3 className="text-3xl font-black text-[#0285FF]">Monetization Hub</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage global ambassador ecosystem</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Payouts</p>
                                        <p className="text-sm font-black text-green-500">
                                            {withdrawals.filter(w => w.status === 'paid').reduce((acc, w) => acc + (w.amount || 0), 0).toLocaleString()} <span className="text-[8px]">SLSH</span>
                                        </p>
                                    </div>
                                    <div className="px-5 py-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center">
                                        <p className="text-[8px] font-black text-blue-500/60 uppercase mb-1">Active Ambassadors</p>
                                        <p className="text-sm font-black text-blue-500">{monetizationApps.filter(a => a.status === 'approved').length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    label="NEW APPS"
                                    value={monetizationApps.filter(a => a.status === 'pending').length}
                                    color="text-blue-500"
                                    onClick={() => setExpandedMonetizationSection(expandedMonetizationSection === 'apps' ? null : 'apps')}
                                />
                                <SummaryCard
                                    label="AMBASSADORS"
                                    value={monetizationApps.filter(a => a.status === 'approved').length}
                                    color="text-purple-500"
                                    onClick={() => setExpandedMonetizationSection(expandedMonetizationSection === 'ambassadors' ? null : 'ambassadors')}
                                />
                                <SummaryCard
                                    label="PENDING WITHDRAW"
                                    value={withdrawals.filter(w => w.status === 'pending').length}
                                    color="text-red-500"
                                    onClick={() => setExpandedMonetizationSection(expandedMonetizationSection === 'withdrawals' ? null : 'withdrawals')}
                                />
                                <SummaryCard
                                    label="PENDING RELEASES"
                                    value={subscriptions.filter(s => (s.status === 'approved' || s.status === 'active') && s.commissionStatus === 'deducted').length}
                                    color="text-yellow-500"
                                />
                            </div>

                            <div className="space-y-6 pb-20">
                                {/* SECTION: APPLICATIONS */}
                                <HubSection
                                    title="Ambassador Applications"
                                    count={monetizationApps.filter(a => a.status === 'pending').length}
                                    isOpen={expandedMonetizationSection === 'apps'}
                                    toggle={() => setExpandedMonetizationSection(expandedMonetizationSection === 'apps' ? null : 'apps')}
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {monetizationApps.filter(a => a.status === 'pending').length === 0 ? (
                                            <EmptyState message="No new applications" />
                                        ) : monetizationApps.filter(a => a.status === 'pending').map(app => (
                                            <div key={app.id} className="bg-[#111622] p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-600/20">
                                                        {app.userName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xl font-black">{app.userName}</h5>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{app.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Method</p>
                                                        <p className="text-sm font-black uppercase text-[#0285FF]">{app.method}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-green-500/50 mb-1">Fee Result</p>
                                                        <p className="text-sm font-black text-green-500">10,000 SLSH</p>
                                                    </div>
                                                </div>

                                                {(app.identity || app.socialUsernames) && (
                                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                                        {app.identity && <p className="text-[10px] text-slate-400">Expertise: <span className="text-white font-bold">{app.identity.expertise}</span></p>}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex -space-x-2">
                                                                {Object.keys(app.socialUsernames || {}).map(p => (
                                                                    <div key={p} className="w-8 h-8 rounded-lg bg-blue-600 border-2 border-[#111622] flex items-center justify-center text-[10px]">{p[0].toUpperCase()}</div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={() => { /* View Details implementation would go here */ }}
                                                                className="text-[9px] font-black text-blue-500 uppercase"
                                                            >
                                                                View Full Proof →
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-3 pt-2">
                                                    <button
                                                        onClick={() => handleApproveMonetization(app)}
                                                        disabled={app.paymentStatus !== 'approved' || app.socialStatus !== 'approved' || app.identityStatus !== 'approved'}
                                                        className={`flex-1 py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest transition-all ${(app.paymentStatus === 'approved' && app.socialStatus === 'approved' && app.identityStatus === 'approved') ? 'bg-blue-600' : 'bg-slate-800 opacity-50'}`}
                                                    >
                                                        Activate 🚀
                                                    </button>
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            onClick={() => handleApprovePayment(app)}
                                                            className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${app.paymentStatus === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'}`}
                                                        >
                                                            {app.paymentStatus === 'approved' ? 'Pay ✓' : 'Verify Pay'}
                                                        </button>
                                                        <button
                                                            onClick={async () => await updateDoc(doc(db, "monetization", app.id), { socialStatus: 'approved', identityStatus: 'approved' })}
                                                            className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${(app.socialStatus === 'approved' && app.identityStatus === 'approved') ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                                                        >
                                                            {(app.socialStatus === 'approved' && app.identityStatus === 'approved') ? 'Proof ✓' : 'Approve Proof'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </HubSection>

                                {/* SECTION: WITHDRAWAL REQUESTS */}
                                <HubSection
                                    title="Withdrawal Requests"
                                    count={withdrawals.filter(w => w.status === 'pending').length}
                                    isOpen={expandedMonetizationSection === 'withdrawals'}
                                    toggle={() => setExpandedMonetizationSection(expandedMonetizationSection === 'withdrawals' ? null : 'withdrawals')}
                                    variant="red"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                                            <EmptyState message="No pending withdrawals" />
                                        ) : withdrawals.filter(w => w.status === 'pending').map(w => (
                                            <div key={w.id} className="p-8 bg-[#151b29] rounded-[3rem] border border-red-500/20 space-y-6 shadow-xl relative overflow-hidden group">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h5 className="font-black text-lg text-white">{w.userName}</h5>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <p className="text-xs font-black text-blue-500">{w.phone}</p>
                                                            <button
                                                                onClick={() => copyToClipboard(w.phone)}
                                                                className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                                                                title="Copy Number"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Payout</p>
                                                        <p className="text-xl font-black text-green-500">{w.amount?.toLocaleString()} <span className="text-[10px]">SLSH</span></p>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tax ({w.tax?.toLocaleString()})</span>
                                                        <span className="text-[10px] font-black text-slate-400">Total: {w.totalDeducted?.toLocaleString()}</span>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Mark as PAID?`)) {
                                                                await updateDoc(doc(db, "withdrawals", w.id), { status: 'paid', paidAt: serverTimestamp() });
                                                            }
                                                        }}
                                                        className="px-6 py-3 rounded-xl bg-green-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-600/20 hover:scale-[1.05] transition-all"
                                                    >
                                                        Mark as Paid ✅
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </HubSection>

                                {/* SECTION: ACTIVE AMBASSADORS */}
                                <HubSection
                                    title="Active Ambassadors"
                                    count={monetizationApps.filter(a => a.status === 'approved').length}
                                    isOpen={expandedMonetizationSection === 'ambassadors'}
                                    toggle={() => setExpandedMonetizationSection(expandedMonetizationSection === 'ambassadors' ? null : 'ambassadors')}
                                    variant="blue"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {monetizationApps.filter(a => a.status === 'approved').length === 0 ? (
                                            <EmptyState message="No active ambassadors" />
                                        ) : monetizationApps.filter(a => a.status === 'approved').map(app => {
                                            const pendingForDeduct = subscriptions.filter(s => s.promoOwnerUid === app.userId && s.commissionStatus === 'pending');
                                            const pendingForRelease = subscriptions.filter(s => s.promoOwnerUid === app.userId && s.commissionStatus === 'deducted');
                                            const totalDeduct = pendingForDeduct.reduce((acc, s) => acc + (s.commissionAmount || 0), 0);
                                            const totalRelease = pendingForRelease.reduce((acc, s) => acc + (s.commissionAmount || 0), 0);

                                            return (
                                                <div key={app.id} className="p-8 bg-[#111622] rounded-[3rem] border border-white/10 space-y-6 group hover:border-[#0285FF]/30 transition-all shadow-xl">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-[#0285FF] font-black text-xl border border-blue-500/20">
                                                                {app.promoCode}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-lg">{app.userName}</p>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                                    Earnings: <span className="text-green-500">{app.totalEarned?.toLocaleString() || 0}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Invites</p>
                                                            <p className="text-lg font-black text-blue-500">{app.invitedUsers?.length || 0}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                        <ActionCard
                                                            label="To Deduct"
                                                            amount={totalDeduct}
                                                            count={pendingForDeduct.length}
                                                            color="yellow"
                                                            onClick={async () => {
                                                                if (confirm(`Deduct ${totalDeduct} from global profit?`)) {
                                                                    for (const s of pendingForDeduct) await handleDeductCommission(s.id);
                                                                }
                                                            }}
                                                        />
                                                        <ActionCard
                                                            label="To Release"
                                                            amount={totalRelease}
                                                            count={pendingForRelease.length}
                                                            color="green"
                                                            onClick={async () => {
                                                                if (confirm(`Release ${totalRelease} to ambassador?`)) {
                                                                    for (const s of pendingForRelease) await handleReleaseCommission(s.id);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </HubSection>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create User Modal */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 ltr text-white">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsCreateModalOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full max-w-lg bg-[#111622] border border-white/10 rounded-[3rem] p-10 shadow-2xl"
                            >
                                <h3 className="text-2xl font-black mb-6 text-center">Create New User</h3>
                                <form onSubmit={handleCreateNewUser} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                                            <input required value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-white font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Role</label>
                                            <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-white font-bold">
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="sub_admin">Sub Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                                        <input required type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-white font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">WhatsApp</label>
                                            <input required value={createForm.whatsapp} onChange={e => setCreateForm({ ...createForm, whatsapp: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-white font-bold text-green-500" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Password</label>
                                            <input required type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 outline-none text-white font-bold" />
                                        </div>
                                    </div>
                                    <button className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20">Abaur User-ka ✅</button>
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="w-full mt-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors text-center">Cancel</button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* View Details Modal */}
                <AnimatePresence>
                    {viewingUser && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 ltr text-white">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setViewingUser(null)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full max-w-4xl bg-[#111622] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
                            >
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                    <div>
                                        <h3 className="text-2xl font-black">{viewingUser.fullName}</h3>
                                        <p className="text-blue-500 font-bold uppercase tracking-widest text-[10px] mt-1">{viewingUser.email}</p>
                                    </div>
                                    <button onClick={() => setViewingUser(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <SectionDetail label="UID" value={viewingUser.id} canCopy />
                                        <SectionDetail label="Role" value={viewingUser.role.toUpperCase()} color="text-purple-500" />
                                        <SectionDetail label="Points/Balance" value={viewingUser.points?.toLocaleString() || 0} color="text-green-500" />
                                        <SectionDetail label="WhatsApp" value={viewingUser.whatsapp || 'N/A'} canCopy />
                                    </div>
                                    <div className="space-y-10">
                                        <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-600/10">
                                            <h4 className="text-lg font-black mb-6">User Management</h4>
                                            <div className="space-y-4">
                                                <button onClick={() => setEditingUser(viewingUser)} className="w-full py-4 rounded-2xl bg-[#0285FF] text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all">
                                                    <span>Edit Password 🔐</span>
                                                </button>
                                                <button
                                                    onClick={async () => { if (confirm('Are you sure you want to delete this user?')) { await deleteDoc(doc(db, "users", viewingUser.id)); setViewingUser(null); } }}
                                                    className="w-full py-4 rounded-2xl bg-red-600/10 text-red-500 font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]"
                                                >
                                                    Delete Account 🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Editing Modal */}
                <AnimatePresence>
                    {editingUser && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 ltr text-white">
                            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setEditingUser(null)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full max-w-sm bg-[#111622] border border-white/10 rounded-[3rem] p-10 shadow-2xl"
                            >
                                <h3 className="text-xl font-black mb-8 text-center text-[#0285FF]">Kordhi Amniga 🔐</h3>
                                <div className="space-y-6">
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">New Password</label>
                                        <input
                                            autoFocus
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/5 focus:border-blue-500/50 rounded-2xl py-4 px-6 outline-none text-white font-black"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdatePassword}
                                        className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
                                    >
                                        Update Password 🔐
                                    </button>
                                    <button onClick={() => setEditingUser(null)} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 w-full">Cancel</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* View Promo Usages Modal */}
                <AnimatePresence>
                    {viewingPromo && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 ltr text-white">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setViewingPromo(null)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full max-w-lg bg-[#111622] border border-white/10 rounded-[3rem] p-10 shadow-2xl"
                            >
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 text-2xl font-black mx-auto mb-4 border border-purple-500/20 shadow-lg shadow-purple-600/10">
                                        {viewingPromo.code}
                                    </div>
                                    <h3 className="text-xl font-black">{viewingPromo.ownerName}</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{viewingPromo.ownerEmail}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Usages</span>
                                        <span className="text-2xl font-black text-blue-500">{subscriptions.filter(s => s.promoCode === viewingPromo.code && s.status === 'approved').length}</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Delete promo code ${viewingPromo.code}?`)) {
                                                await deleteDoc(doc(db, "promocodes", viewingPromo.id));
                                                setViewingPromo(null);
                                            }
                                        }}
                                        className="w-full py-4 rounded-2xl bg-red-600/10 text-red-500 font-black uppercase text-[10px] tracking-widest border border-red-500/10 hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        Delete Promo Code 🗑️
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style>{`.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </main>
        </div>
    );
};

const SectionDetail = ({ label, value, canCopy, color }: any) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Waa la koobiyeeyey! 📋`);
    };

    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">{label}</label>
            <div className="flex items-center space-x-2">
                <p className={`font-black text-sm ${color || 'text-white'}`}>{value}</p>
                {canCopy && (
                    <button onClick={() => copyToClipboard(value)} className="hover:text-blue-500 transition-colors opacity-50 hover:opacity-100">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- NEW COMPONENTS FOR MONETIZATION HUB ---

const SummaryCard = ({ label, value, color, onClick }: any) => (
    <div
        onClick={onClick}
        className={`p-6 bg-[#111622] rounded-[2.5rem] border border-white/5 shadow-xl cursor-pointer hover:border-white/20 transition-all group`}
    >
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-300">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
);

const HubSection = ({ title, count, isOpen, toggle, children, icon, variant = 'blue' }: any) => (
    <div className="space-y-4">
        <button
            onClick={toggle}
            className={`w-full flex items-center justify-between p-7 bg-[#111622] rounded-[2.5rem] border ${isOpen ? (variant === 'red' ? 'border-red-500/30' : 'border-[#0285FF]/30') : 'border-white/5'} transition-all`}
        >
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl ${variant === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#0285FF]/10 text-[#0285FF] border-blue-500/20'} flex items-center justify-center border shadow-lg shadow-black/20`}>
                    {icon}
                </div>
                <div className="text-left">
                    <h4 className="text-lg font-black text-white">{title}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{count} Items Total</p>
                </div>
            </div>
            <div className={`p-2 rounded-xl bg-white/5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="pt-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const ActionCard = ({ label, amount, count, color, onClick }: any) => (
    <div className={`p-5 rounded-3xl bg-${color}-500/5 border border-${color}-500/10 space-y-3`}>
        <div className="flex items-center justify-between">
            <div>
                <p className={`text-[9px] font-black text-${color}-500/60 uppercase`}>{label}</p>
                <p className={`text-xl font-black text-${color}-500`}>{amount.toLocaleString()} <span className="text-[10px]">SLSH</span></p>
            </div>
            <div className={`bg-${color}-500/20 px-2 py-1 rounded-lg text-${color}-500 text-[10px] font-black`}>{count}</div>
        </div>
        <button
            onClick={onClick}
            disabled={count === 0}
            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${count > 0 ? `bg-${color === 'yellow' ? 'yellow-500 text-black' : 'green-600 text-white'} shadow-lg shadow-${color}-500/20 hover:scale-[1.02]` : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
        >
            {color === 'yellow' ? 'Deduct 💸' : 'Release 🚀'}
        </button>
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="col-span-full p-16 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-slate-600">
        <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
);

export default AdminDashboard;
