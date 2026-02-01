
import React from 'react';
import { Icons } from '../constants';

interface MonetizationGuideViewProps {
    onBack: () => void;
}

const MonetizationGuideView: React.FC<MonetizationGuideViewProps> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-900 ltr">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-500 active:scale-95 transition-transform"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="text-lg font-black tracking-tight uppercase">Sida Lacagta Loo Sameeyo 💸</h1>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                <div className="max-w-2xl mx-auto space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto text-green-600 mb-6 rotate-3">
                            <span className="text-4xl">💰</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ka mid noqo kuwa dakhliga ka sameeya DeepMind!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            DeepMind maahan oo kaliya AI, ee waa fursad aad dakhli joogto ah ka heli karto adigoo dadka ku dhiirigelinaya inay isticmaalaan caqliga macmalka ah.
                        </p>
                    </div>

                    {/* Step by Step */}
                    <div className="space-y-8">
                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">1</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Codsado Safiirnimo (Ambassador)</h3>
                                <p className="text-slate-600 font-medium leading-relaxed italic">Tag qaybta 'Monetization' ee menu-ka, ka dibna buuxi foomka safiirnimada.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">2</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hel Promo Code-kaaga</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Marka lagaa aqbalo, waxaad heli doontaa code gaar ah (tusaale: AMIN20). Code-kan wuxuu dadka siinayaa qiimo dhimis, adigana dakhli.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">3</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">La Wadaag Dadka Kale</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">U sheeg asxaabtaada, baraha bulshada (TikTok, FB) iyo qoyskaaga. Dadka isticmaala code-kaaga waxay helayaan adeegga Premium-ka.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">4</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Kasbo Lacag (Commissions)</h3>
                                <p className="text-slate-600 font-medium leading-relaxed font-bold">Qof kasta oo si guul leh ugu biira DeepMind adiga dartaa, waxaad helaysaa komishankaaga oo xaq ah!</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-green-500/20">5</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">La Bax Dakhligaaga</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Dakhligaaga waxaad si toos ah ugala bixi kartaa Zaad, Sahal ama E-Dahab wakhti kasta oo aad u baahato.</p>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="p-10 rounded-[3rem] bg-slate-900 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
                        <h3 className="text-xl font-black tracking-tight">Ma bilaabaynaa? 🚀</h3>
                        <p className="text-slate-400 text-sm font-medium">Ha dhumina fursadan dahabiga ah. DeepMind waa halka mustaqbalku ka bilowdo.</p>
                        <button
                            onClick={onBack}
                            className="w-full py-5 rounded-2xl bg-[#0285FF] text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                        >
                            Bilaw Hadda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonetizationGuideView;
