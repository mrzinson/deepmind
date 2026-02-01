import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

interface OnboardingViewProps {
    onComplete: () => void;
}

const slides = [
    {
        id: 'welcome',
        title: 'Welcome to DeepMind',
        subtitle: 'Official Free App',
        desc: 'Experience the latest DeepMind models with cross-device history sync.',
        disclaimer: 'DeepMind can make mistakes. Content is AI-generated. For professional fields like medicine, law, and finance, it does not represent expert advice.',
        icon: <Logo size="w-24 h-24" />,
        isMain: true
    },
    {
        id: 'business',
        title: 'Business AI',
        subtitle: 'Strategy & Success',
        desc: 'DeepMind: Xeeladaha guusha ee mustaqbalka. Ganacsigaaga ku dhis maskax ka xariifsan tartanka.',
        icon: <span className="text-8xl">💼</span>
    },
    {
        id: 'romance',
        title: 'Romance AI',
        subtitle: 'Connection & Love',
        desc: 'DeepMind: Baro qofka qalbigaaga dega, ka hor intaadan la kulmin. Isfaham ka qoto dheer hadalka.',
        icon: <span className="text-8xl">❤️</span>
    },
    {
        id: 'education',
        title: 'Education AI',
        subtitle: 'Learning & Growth',
        desc: 'DeepMind: Macalinkaaga gaarka ah ee aan waligii daalin. Aqoonta adduunka, hal meel ku baro.',
        icon: <span className="text-8xl">🎓</span>
    },
    {
        id: 'voice',
        title: 'Voice & Calls',
        subtitle: 'Real-time Conversation',
        desc: 'Hadda waxaad cod ahaan ula hadli kartaa AI-da Shukaansiga iyo Waxbarashada si toos ah.',
        icon: <span className="text-8xl">🎙️</span>
    }
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-[#050810] flex flex-col items-center justify-between p-8 text-center text-white font-sans overflow-hidden">
            <div className="w-full flex justify-end">
                <button onClick={onComplete} className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Skip</button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center space-y-8"
                    >
                        <div className="relative mb-4">
                            {slides[step].id === 'welcome' && (
                                <div className="absolute -inset-10 bg-[#0285FF]/20 blur-[60px] rounded-full animate-pulse"></div>
                            )}
                            {slides[step].icon}
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-black tracking-tight">{slides[step].title}</h1>

                            {slides[step].subtitle && (
                                <p className="text-[#0285FF] font-bold text-sm uppercase tracking-[0.2em]">{slides[step].subtitle}</p>
                            )}

                            <p className="text-slate-300 font-medium leading-relaxed text-lg opacity-80 max-w-xs mx-auto">
                                {slides[step].desc}
                            </p>
                        </div>

                        {slides[step].disclaimer && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 max-w-xs">
                                <p className="text-[10px] text-slate-500 font-bold leading-normal text-left">
                                    <span className="text-white block mb-1 font-black">DeepMind can make mistakes</span>
                                    {slides[step].disclaimer.replace('DeepMind can make mistakes.', '')}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center space-x-2">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-[#0285FF]' : 'w-1.5 bg-slate-700'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full py-4 rounded-full bg-[#0285FF] hover:bg-[#0060BF] text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-[#0285FF]/20 active:scale-95 transition-all"
                >
                    {step === 0 ? 'Start Chat' : step === slides.length - 1 ? 'Get Started' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingView;
