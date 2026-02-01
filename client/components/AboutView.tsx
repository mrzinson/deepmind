
import React from 'react';
import { Icons } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import Logo from './Logo';

interface AboutViewProps {
    onBack: () => void;
}

const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
    const { language, setLanguage } = useLanguage();

    const content = {
        en: {
            title: 'About DeepMind',
            introTitle: 'What is DeepMind?',
            introDesc: 'DeepMind (DeepMind) is the most advanced Somali AI platform designed to empower individuals and businesses through intelligent chat and voice interactions.',
            sections: [
                {
                    title: 'How DeepMind Works',
                    icon: <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Icons.Chat /></div>,
                    items: [
                        'Instant Chat: Talk to our specialized DM agents for Business, Romance, or Education.',
                        'Voice Interaction: Experience natural Somali voice calls with Cali and Layla.',
                        '24/7 Availability: Your AI partner is always ready to assist you anywhere in the world.'
                    ]
                },
                {
                    title: 'How to Pay (Step-by-Step)',
                    icon: <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">S</div>,
                    items: [
                        '1. Select your desired service (e.g., Education DM).',
                        '2. Choose your payment method (ZAAD or e-Dahab).',
                        '3. Enter your mobile number and confirm the payment.',
                        '4. Your subscription will be activated after our team verifies the transaction.'
                    ]
                }
            ],
            earnMoney: {
                title: 'Earn Money with DeepMind! 💰',
                desc: 'Did you know you can make money by sharing DeepMind? Join our Promo Code Program and start earning today!',
                steps: [
                    'Create a unique Promo Code through our admin team.',
                    'Share your code with friends, family, and on social media.',
                    'Earn a commission for every person who subscribes using your code!',
                    'Withdraw your earnings directly to your mobile money account.'
                ],
                cta: 'The more people you invite, the more you earn. There is no limit!'
            }
        },
        so: {
            title: 'Ku saabsan DeepMind',
            introTitle: 'Waa maxay DeepMind?',
            introDesc: 'DeepMind (DeepMind) waa madal AI oo Soomaaliyeed oo loogu talagalay in lagu hormariyo dadka iyo ganacsiyada iyada oo loo marayo sheeko iyo cod caqliyeysan.',
            sections: [
                {
                    title: 'Sida uu u shaqeeyo App-ku',
                    icon: <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Icons.Chat /></div>,
                    items: [
                        'Sheeko Degdeg ah: La hadal wakiilladayada DM ee gaarka u ah Ganacsiga, Shukaansiga, ama Waxbarashada.',
                        'Isgaarsiinta Codka: Khibrad u yeelo wicitaanada codka Soomaaliga ee dabiiciga ah oo ay ku hadlayaan Cali iyo Layla.',
                        'Had iyo jeer diyaar: Saaxiibkaaga AI wuxuu markasta diyaar u yahay inuu ku caawiyo meel kasta oo aad dunida ka joogto.'
                    ]
                },
                {
                    title: 'Sida loo bixiyo Lacagta (Talaabo-talaabo)',
                    icon: <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">S</div>,
                    items: [
                        '1. Dooro adeegga aad rabto (tusaale, Waxbarashada DM).',
                        '2. Dooro habka lacag bixinta (ZAAD ama e-Dahab).',
                        '3. Geli lambarkaaga gacanta oo xaqiiji lacag bixinta.',
                        '4. Adeeggaaga waa la hawlgelin doonaa ka dib marka kooxdayadu xaqiijiyaan lacagta.'
                    ]
                }
            ],
            earnMoney: {
                title: 'Lacag ka samee DeepMind! 💰',
                desc: 'Ma ogtahay inaad lacag samayn karto adoo la wadaagaya DeepMind asxaabtaada? Ku biir barnaamijka Promo Code-ka oo bilaw inaad lacag hesho maanta!',
                steps: [
                    'Codso Promo Code adiga kuu gaar ah oo ay kooxdayadu kuu soo saaraan.',
                    'La wadaag koodkaaga asxaabta, qoyska, iyo baraha bulshada.',
                    'Lacag ka hel qof kasta oo isku diiwaangeliya adoo isticmaalaya koodkaaga!',
                    'Kala bax lacagtaada si toos ah lambarkaaga ZAAD ama e-Dahab.'
                ],
                cta: 'In ka badan inta qof ee aad soo marto, in ka badan ayaad helaysaa. Xad ma leh!'
            }
        }
    };

    const currentContent = language === 'so' ? content.so : content.en;

    return (
        <div className="flex flex-col h-full bg-white text-slate-900 ltr">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-500 active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-lg font-black tracking-tight">{currentContent.title}</h1>
                <div className="w-10"></div>
            </header>

            {/* Language Toggle */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 sticky top-[97px] z-20">
                <div className="max-w-md mx-auto flex p-1 bg-slate-200 rounded-xl relative">
                    <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-lg shadow-sm transition-transform duration-300 ${language === 'so' ? 'translate-x-0' : 'translate-x-full'}`} />
                    <button onClick={() => setLanguage('so')} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${language === 'so' ? 'text-blue-600' : 'text-slate-500'}`}>Somali</button>
                    <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${language === 'en' ? 'text-blue-600' : 'text-slate-500'}`}>English</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-20">
                <div className="max-w-2xl mx-auto space-y-12">
                    {/* Logo & Intro */}
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-[2rem] flex items-center justify-center p-4 shadow-xl shadow-blue-600/20">
                            <Logo size="w-16 h-16" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">{currentContent.introTitle}</h2>
                        <p className="text-[15px] font-medium leading-relaxed text-slate-500">{currentContent.introDesc}</p>
                    </div>

                    {/* Core Sections */}
                    <div className="grid grid-cols-1 gap-8">
                        {currentContent.sections.map((section, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <div className="flex items-center space-x-4 mb-6">
                                    {section.icon}
                                    <h3 className="text-lg font-black tracking-tight text-slate-900">{section.title}</h3>
                                </div>
                                <div className="space-y-4">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex space-x-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                                            <p className="text-[14px] font-medium text-slate-600 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Earn Money Section - Highlighted */}
                    <div className="relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-5 group-hover:opacity-10 transition-opacity rounded-[2.5rem]" />
                        <div className="relative border-2 border-blue-600/20 rounded-[2.5rem] p-8 md:p-10 bg-white shadow-2xl shadow-blue-600/5">
                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-600/30">💰</div>
                                <h2 className="text-2xl font-black text-blue-600 leading-tight">{currentContent.earnMoney.title}</h2>
                                <p className="text-[15px] font-bold text-slate-600">{currentContent.earnMoney.desc}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {currentContent.earnMoney.steps.map((step, i) => (
                                    <div key={i} className="flex items-center space-x-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                                        <p className="text-[14px] font-bold text-slate-700">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center p-4 bg-blue-600 rounded-2xl">
                                <p className="text-white text-[12px] font-black uppercase tracking-widest">{currentContent.earnMoney.cta}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 text-center space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-slate-300">
                            <div className="w-12 h-[1px] bg-current" />
                            <Logo size="w-4 h-4" />
                            <div className="w-12 h-[1px] bg-current" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Developed by Team DeepMind</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutView;
