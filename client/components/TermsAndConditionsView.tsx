
import React from 'react';
import { Icons } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface TermsAndConditionsViewProps {
    onBack: () => void;
}

const TermsAndConditionsView: React.FC<TermsAndConditionsViewProps> = ({ onBack }) => {
    const { language, setLanguage } = useLanguage();

    const content = {
        en: {
            title: 'Terms & Conditions',
            lastUpdated: 'Last Updated: February 1, 2026',
            sections: [
                {
                    heading: '1. Acceptance of Terms',
                    body: 'By accessing and using DeepMind (DeepMind), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.'
                },
                {
                    heading: '2. Use of AI Services',
                    body: 'DeepMind provides AI-powered chat and voice services for educational, business, and entertainment purposes. While we strive for accuracy, AI responses may sometimes be incorrect or inappropriate. User discretion is advised.'
                },
                {
                    heading: '3. User Accounts',
                    body: 'Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.'
                },
                {
                    heading: '4. Subscription and Payments',
                    body: 'Certain services within DeepMind may require a paid subscription. All payments are final and non-refundable unless otherwise specified.'
                },
                {
                    heading: '5. Privacy and Security',
                    body: 'Your privacy is important to us. Please refer to our Privacy Policy for information on how we collect and use your data. We use encryption to protect your conversations.'
                },
                {
                    heading: '6. Prohibited Activities',
                    body: 'Users may not use DeepMind for any illegal purposes, including but not limited to harassment, spreading hate speech, or attempting to hack our systems.'
                },
                {
                    heading: '7. Limitation of Liability',
                    body: 'Team DeepMind shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use the service.'
                },
                {
                    heading: '8. Monetization & Ambassador Program',
                    body: 'Users may participate in the Ambassador Program to earn commissions by referring new subscribers. Participation requires approval and identity verification. Fraudulent activities, including creating multiple accounts or providing false information, will lead to account termination and forfeiture of all earnings.'
                }
            ]
        },
        so: {
            title: 'Shuruudaha & Qawaaniinta',
            lastUpdated: 'Markii ugu dambaysay ee la cusboonaysiiyay: Febraayo 1, 2026',
            sections: [
                {
                    heading: '1. Aqbalidda Shuruudaha',
                    body: 'Markaad isticmaalayso DeepMind (DeepMind), waxaad ogolaatay inaad u hoggaansanto shuruudahan iyo qawaaniintan. Haddii aadan ku raacsanayn, fadlan hayska isticmaalin app-ka.'
                },
                {
                    heading: '2. Isticmaalka Adeegyada AI',
                    body: 'DeepMind waxay bixisaa adeegyo sheeko (chat) iyo cod (voice) oo ay ku shaqaynayso AI, kuwaas oo loogu talagalay waxbarasho, ganacsi, iyo maaweelo. In kasta oo aan ku dadaalayno saxnaanshaha, jawaabaha AI mararka qaarkood way khaldami karaan.'
                },
                {
                    heading: '3. Akoonada Isticmaalaha',
                    body: 'Isticmaalayaashu waxay mas\'uul ka yihiin ilaalinta sirta macluumaadka akoonadooda iyo dhammaan waxqabadyada ka dhaca akoonkooda hoostiisa.'
                },
                {
                    heading: '4. Isdiiwaangelinta iyo Lacag-bixinta',
                    body: 'Adeegyada qaarkood ee ku jira DeepMind waxay u baahan karaan lacag-bixin. Dhammaan lacagaha la bixiyo waa kuwa rasmiga ah lamana celinayo ilaa si kale loo cayimo mooyee.'
                },
                {
                    heading: '5. Arrimaha Gaarka ah iyo Amniga',
                    body: 'Amnigaaga iyo sirtu waa noo muhiim. Fadlan eeg Shuruucda Amniga si aad u ogaato sida aan u ururinno uuna u isticmaalno xogtaada. Waxaan isticmaalnaa encryption si aan u ilaalino wada-hadalladaada.'
                },
                {
                    heading: '6. Falalka Reebban',
                    body: 'Isticmaalayaashu uma isticmaali karaan DeepMind ujeeddooyin sharci darro ah, oo ay ku jiraan hanjabaadaha, fidinta hadallada nacaybka, ama isku dayga in la jabsado nidaamkayaga.'
                },
                {
                    heading: '7. Xaddididda Mas\'uuliyadda',
                    body: 'Team DeepMind mas\'uul kama noqon doonaan waxyeello kasta oo ka dhalata isticmaalka ama awood la\'aanta isticmaalka adeegga.'
                },
                {
                    heading: '8. Nidaamka Lacag-abuurka & Safiirnimada',
                    body: 'Isticmaalayaashu waxay ka qayb qaadan karaan barnaamijka Safiirnimada si ay lacag u kasbadaan iyagoo keenaya macaamiil cusub. Ka qaybgalku wuxuu u baahan yahay ogolaansho iyo xaqiijinta aqoonsiga. Falalka khiyaanada ah, sida abuurista akoonno badan ama bixinta xog been ah, waxay keenaysaa in akoonka la tirtiro, lacagta la kasbadayna la xayiro.'
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
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
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

export default TermsAndConditionsView;
