
import React from 'react';

interface LogoProps {
  size?: string;
  spinning?: boolean;
  variant?: 'main' | 'thinking' | 'icon';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "w-10 h-10",
  spinning = false,
  variant = 'icon',
  className = ""
}) => {

  // Permanent Black Optimization for Sleek Dark Theme
  const mixMode = 'screen';

  const logoIcon = (
    <div className={`${size} relative flex items-center justify-center ${className}`}>
      {/* Glow Effect */}
      {spinning && (
        <div className="absolute inset-0 bg-[#0285FF]/20 blur-xl rounded-full animate-pulse"></div>
      )}

      {/* New Image Logo */}
      <img
        src="/logo.jpg"
        alt="DeepMind Logo"
        className={`w-full h-full object-contain ${spinning ? 'animate-logo-spin' : ''}`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(2, 133, 255, 0.4))' }}
      />

      {/* Online Status Dot - Only for main variant */}
      {variant === 'main' && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center z-20">
          <div className="absolute inset-0 bg-green-500/40 rounded-full animate-ping"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#000000] shadow-sm relative z-10"></div>
        </div>
      )}
    </div>
  );

  if (variant === 'main') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {logoIcon}
        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-white">DeepMind</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'thinking') {
    return (
      <div className={`flex items-center space-x-3 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#0285FF]/10 ${className} shadow-lg`}>
        <div className="w-7 h-7 relative flex items-center justify-center scale-90">
          <Logo spinning size="w-full h-full" />
        </div>
        <span className={`text-[11px] font-black uppercase tracking-[0.4em] text-[#0285FF]`}>Thinking...</span>
      </div>
    );
  }

  return <div className={className}>{logoIcon}</div>;
};

export default Logo;
