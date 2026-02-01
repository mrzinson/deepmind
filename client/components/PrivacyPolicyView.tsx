
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPolicyViewProps {
    onBack: () => void;
}

const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
    const { language, setLanguage } = useLanguage();

    const content = {
        en: {
            title: 'Privacy Policy',
            lastUpdated: 'Last Updated: February 1, 2026',
            sections: [
                {
                    heading: '1. Information We Collect',
                    body: 'We collect information you provide directly to us when you create an account, such as your email, name, and any profile information. We also collect the content of your messages to provide the AI services.'
                },
                {
                    heading: '2. How We Use Information',
                    body: 'We use the information we collect to provide, maintain, and improve our services, including training our AI models (anonymized) and ensuring security.'
                },
                {
                    heading: '3. Data Storage and Security',
                    body: 'We implement industry-standard security measures, including encryption, to protect your data. Your chat history is stored securely on our servers.'
                },
                {
                    heading: '4. Sharing of Information',
                    body: 'We do not sell your personal information to third parties. We may share data with service providers who assist in our operations, under strict confidentiality agreements.'
                },
                {
                    heading: '5. Your Choices',
                    body: 'You can update your account information at any time. You may also request the deletion of your account and associated data by contacting our support team.'
                },
                {
                    heading: '6. Cookies and Tracking',
                    body: 'We use cookies and similar technologies to enhance your experience and analyze app performance. You can manage cookie settings through your device.'
                },
                {
                    heading: '7. Changes to This Policy',
                    body: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.'
                },
                {
                    heading: '8. Monetization Data',
                    body: 'When you participate in our monetization programs, we collect additional information such as your mobile payment numbers (Zaad, Sahal, E-Dahab), social media handles, and identity verification details. This data is used solely for managing commissions, verifying authenticity, and processing payouts. We do not share this sensitive information with any third-party marketing entities.'
                }
            ]
        },
        so: {
            title: 'Shuruucda Amniga',
            lastUpdated: 'Markii ugu dambaysay ee la cusboonaysiiyay: Febraayo 1, 2026',
            sections: [
                {
                    heading: '1. Macluumaadka aan Ururinno',
                    body: 'Waxaan ururinnaa macluumaadka aad si toos ah noo siiso markaad samaysato akoon, sida iimaylkaaga, magacaaga, iyo xogta kale ee profile-ka. Sidoo kale waxaan ururinnaa fariimaha aad qorto si aan kuugu siino adeegyada AI.'
                },
                {
                    heading: '2. Sida loo Isticmaalo Macluumaadka',
                    body: 'Waxaan u isticmaalnaa macluumaadka aan ururinno si aan u bixinno, u ilaalino, uuna u hagaajino adeegyadeena, oo ay ku jirto tijaabinta moodalooyinka AI (iyadoo xogta la qarinayo) iyo sugidda amniga.'
                },
                {
                    heading: '3. Kaydinta iyo Amniga Xogta',
                    body: 'Waxaan isticmaalnaa tallaabooyinka amniga ee heerka caalami ah, oo ay ku jirto encryption, si aan u ilaalino xogtaada. Wada-hadalladaadu waxay si ammaan ah ugu kaydsan yihiin server-yadayada.'
                },
                {
                    heading: '4. Wadaajinta Macluumaadka',
                    body: 'Ma ka iibino macluumaadkaaga dad kale. Waxaan xogta la wadaagi karnaa oo kaliya adeeg bixiyayaasha naga caawiya hawlaha, iyadoo ay jiraan heshiisyo adag oo ku saabsan ilaalinta sirta.'
                },
                {
                    heading: '5. Doorashooyinkaada',
                    body: 'Waad cusboonaysiin kartaa macluumaadka akoonkaaga wakhti kasta. Sidoo kale waxaad codsan kartaa in la tirtiro akoonkaaga iyo xogta ku xiran adiga oo la xiriiraya kooxdayada caawimada.'
                },
                {
                    heading: '6. Cookies iyo Dabagalka',
                    body: 'Waxaan isticmaalnaa cookies si aan u hagaajino khibradaada uuna u falanqayno sida app-ku u shaqaynayo. Waad ka xiri kartaa cookies-ka settings-ka qalabkaaga.'
                },
                {
                    heading: '7. Isbeddelka Sharcigan',
                    body: 'Waa laga yaabaa inaan cusboonaysiino Shuruucda Amniga mararka qaarkood. Waxaan kugu ogeysiin doonaa isbeddel kasta oo muhiim ah adiga oo halkan ku daabacayna sharciga cusub.'
                },
                {
                    heading: '8. Xogta Lacag-abuurka',
                    body: 'Markaad ka qayb-qaadato barnaamijyadayada dakhli-abuurka, waxaan ururinnaa macluumaad dheeraad ah oo ay ka mid yihiin lambaradaada lacag-bixinta (Zaad, Sahal, E-Dahab), magacyadaada baraha bulshada, iyo xogta xaqiijinta aqoonsiga. Xogtan waxaa loo isticmaalaa oo keliya maareynta dakhliga, xaqiijinta daacadnimada, iyo bixinta lacagaha. Ma la wadaagno macluumaadkan xasaasiga ah hay\'ado kale oo suuq-geyn ah.'
                }
            ]
        }
    };

    const currentContent = language === 'so' ? content.so : content.en;

    return (
        <div className="flex flex-col h-full bg-white text-slate-900 ltr">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-500 active:scale-95 transition-transform"
                    aria-label="Back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="text-lg font-black tracking-tight">{currentContent.title}</h1>
                <div className="w-10"></div>
            </header>

            {/* Language Toggle */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 sticky top-[97px] z-20">
                <div className="max-w-md mx-auto flex p-1 bg-slate-200 rounded-xl relative">
                    <div
                        className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-lg shadow-sm transition-transform duration-300 ${language === 'so' ? 'translate-x-0' : 'translate-x-full'}`}
                    />
                    <button
                        onClick={() => setLanguage('so')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${language === 'so' ? 'text-blue-600' : 'text-slate-500'}`}
                    >
                        Somali
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${language === 'en' ? 'text-blue-600' : 'text-slate-500'}`}
                    >
                        English
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">{currentContent.lastUpdated}</p>
                    </div>

                    <div className="space-y-10">
                        {currentContent.sections.map((section, idx) => (
                            <section key={idx} className="space-y-3">
                                <h2 className="text-lg font-black tracking-tight text-slate-900 border-l-4 border-blue-600 pl-4">{section.heading}</h2>
                                <p className="text-[15px] leading-relaxed text-slate-600 font-medium pl-5">
                                    {section.body}
                                </p>
                            </section>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-slate-100 text-center">
                        <p className="text-xs font-bold text-slate-400">© 2026 Team DeepMind. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyView;
