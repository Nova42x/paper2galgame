import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onSettings }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* Decorative Character (Static Image) */}
      <div className="absolute right-0 bottom-0 h-[90%] w-auto z-0 opacity-0 animate-fade-in transition-opacity duration-1000 delay-500 hidden md:block">
         <img 
            src="https://placehold.co/600x1000/ff9eb5/white?text=Murasame+Fullbody" 
            alt="Murasame"
            className="h-full w-auto object-contain mask-image-gradient" 
            style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
         />
      </div>

      <div className="z-10 flex flex-col items-center">
        <h1 className="text-7xl md:text-9xl font-black text-white drop-shadow-[0_5px_5px_rgba(255,105,180,0.8)] tracking-wider -rotate-2 mb-4 font-sans italic">
          <span className="text-gal-pink-dark">Paper</span>
          <span className="text-gal-blue mx-2">2</span>
          <span className="text-gal-pink-dark">Galgame</span>
        </h1>
        
        <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border-2 border-gal-pink mb-12 shadow-lg animate-bounce-slow">
           <span className="text-gal-pink-dark font-bold tracking-widest uppercase">
             <i className="fas fa-heart mr-2"></i> Murasame's Academic Shrine
           </span>
        </div>

        <div className="flex flex-row space-x-8">
            <MenuButton onClick={onStart} icon="fa-play" label="开始" subLabel="START GAME" primary />
            <MenuButton onClick={onSettings} icon="fa-cog" label="设置" subLabel="CONFIG" />
        </div>
      </div>
      
      <div className="absolute bottom-4 text-gal-pink-dark/60 text-xs">
         Powered by Gemini 2.5 • Designed for Research & Fun
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ onClick: () => void; icon: string; label: string; subLabel: string; primary?: boolean }> = ({ onClick, icon, label, subLabel, primary }) => (
  <button 
    onClick={onClick}
    className={`
      group relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1
      w-48 h-24 skew-x-[-10deg] rounded-lg shadow-lg flex items-center justify-center
      ${primary 
        ? 'bg-gradient-to-r from-gal-blue to-purple-500 text-white' 
        : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-gal-pink'
      }
    `}
  >
    <div className="skew-x-[10deg] flex flex-col items-center">
      <div className="text-2xl font-bold mb-1">{label}</div>
      <div className={`text-xs tracking-widest font-sans ${primary ? 'text-blue-100' : 'text-gray-400'}`}>{subLabel}</div>
    </div>
    
    {/* Shine effect */}
    <div className="absolute top-0 -left-full w-1/2 h-full bg-white/20 skew-x-[20deg] group-hover:animate-[shine_1s_infinite]"></div>
  </button>
);