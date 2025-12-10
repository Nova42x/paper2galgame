import React, { useState, useEffect, useRef } from 'react';
import { DialogueLine } from '../types';

interface GameScreenProps {
  script: DialogueLine[];
  title: string;
  onExit: () => void;
}

// ==========================================
// CONFIG: CHARACTER IMAGES
// Modify these URLs to change the character sprites.
// You can use local paths (e.g. "/assets/murasame_happy.png") or remote URLs.
// ==========================================
const CHARACTER_IMAGES: Record<string, string> = {
  // Using placehold.co for clear demonstration. Replace with real assets!
  normal: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
  happy: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
  angry: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
  surprised: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
  shy: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
  proud: 'https://pic1.imgdb.cn/item/6938f3e507135a7c195e123c.png',
};

export const GameScreen: React.FC<GameScreenProps> = ({ script, title, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [hideUI, setHideUI] = useState(false);
  const [jumpKey, setJumpKey] = useState(0); // Used to trigger jump animation
  
  const currentLine = script[currentIndex];
  const typingSpeed = 30; // ms per char
  const autoDelay = 2000; // ms to wait before next line in auto mode
  
  const timerRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);

  // Trigger jump animation on new line
  useEffect(() => {
    setJumpKey(prev => prev + 1);
  }, [currentIndex]);

  // Character sprite handling based on emotion
  const getSpriteUrl = (emotion: string) => {
    const key = emotion.toLowerCase();
    return CHARACTER_IMAGES[key] || CHARACTER_IMAGES['normal'];
  };

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText("");
    setIsTyping(true);
    let charIndex = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      charIndex++;
      setDisplayedText(currentLine.text.slice(0, charIndex));

      if (charIndex >= currentLine.text.length) {
        setIsTyping(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, typingSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentLine]);

  // Auto mode logic
  useEffect(() => {
    if (isAuto && !isTyping && currentIndex < script.length - 1) {
      autoTimerRef.current = window.setTimeout(() => {
        handleNext();
      }, autoDelay);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [isAuto, isTyping, currentIndex, script.length]);

  const handleNext = () => {
    if (isTyping) {
      // Instant finish
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Next line
      if (currentIndex < script.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // End of script
        setIsAuto(false);
      }
    }
  };

  if (!currentLine) return <div className="text-white">End of Chapter</div>;

  return (
    <div className="w-full h-full relative" onClick={handleNext}>
      
      {/* Character Layer */}
      {!hideUI && (
        <div 
           key={jumpKey} // Re-trigger animation on key change
           className={`absolute bottom-0 right-0 md:right-32 h-[90%] z-10 animate-jump-once`}
        >
          <img 
            src={getSpriteUrl(currentLine.emotion)} 
            alt="Murasame" 
            className="h-full w-auto object-contain drop-shadow-2xl transition-opacity duration-300"
          />
        </div>
      )}

      {/* UI Overlay */}
      {!hideUI && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-8 px-4 md:px-32 pointer-events-none">
          
          {/* Important Note Popup */}
          {currentLine.note && (
             <div className="self-end mb-4 mr-10 max-w-md bg-yellow-50 border-2 border-yellow-200 text-yellow-800 p-3 rounded-lg shadow-lg animate-bounce-slow">
                <div className="text-xs font-bold uppercase text-yellow-500 mb-1"><i className="fas fa-lightbulb"></i> Important Note</div>
                <div className="text-sm">{currentLine.note}</div>
             </div>
          )}

          {/* Control Bar */}
          <div className="flex justify-end gap-2 mb-2 pointer-events-auto">
             <ControlButton active={isAuto} onClick={(e) => { e.stopPropagation(); setIsAuto(!isAuto); }} icon="fa-forward" label="Auto" />
             <ControlButton onClick={(e) => { e.stopPropagation(); setShowLog(true); }} icon="fa-history" label="Log" />
             <ControlButton onClick={(e) => { e.stopPropagation(); setHideUI(true); }} icon="fa-eye-slash" label="Hide" />
             <ControlButton onClick={(e) => { e.stopPropagation(); onExit(); }} icon="fa-door-open" label="Exit" />
          </div>

          {/* Dialogue Box */}
          <div className="bg-white/90 backdrop-blur-md border-4 border-gal-pink/50 rounded-2xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] pointer-events-auto relative min-h-[200px]">
            
            {/* Name Tag */}
            <div className="absolute -top-6 left-10 bg-gradient-to-r from-gal-blue to-blue-400 text-white px-8 py-2 rounded-full shadow-md transform -skew-x-12 border-2 border-white">
              <span className="font-bold text-lg skew-x-12 inline-block">
                {currentLine.speaker} <i className="fas fa-sparkles ml-1 text-yellow-300"></i>
              </span>
            </div>

            {/* Text Content */}
            <div className="mt-4 text-xl md:text-2xl font-bold text-gray-800 leading-relaxed font-serif tracking-wide">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-6 bg-gal-pink ml-1 animate-pulse"></span>}
            </div>

            {/* Next Indicator */}
            {!isTyping && (
              <div className="absolute bottom-4 right-6 text-gal-pink-dark animate-bounce cursor-pointer">
                <i className="fas fa-chevron-down text-2xl"></i>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hide UI Click Handler (Invisible overlay when hidden) */}
      {hideUI && (
        <div 
          className="absolute inset-0 z-50 cursor-pointer" 
          onClick={(e) => { e.stopPropagation(); setHideUI(false); }}
        />
      )}

      {/* Backlog Modal */}
      {showLog && (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-10" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-4xl h-[80%] rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-gal-pink-dark p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-xl"><i className="fas fa-history mr-2"></i> Dialogue History</h3>
              <button onClick={() => setShowLog(false)} className="hover:text-gray-200"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-pink-50">
              {script.slice(0, currentIndex + 1).map((line, idx) => (
                <div key={idx} className="border-b border-pink-200 pb-2">
                  <div className="text-gal-pink-dark font-bold text-sm mb-1">{line.speaker}</div>
                  <div className="text-gray-700">{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ControlButton: React.FC<{ onClick: (e: any) => void; icon: string; label: string; active?: boolean }> = ({ onClick, icon, label, active }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold transition-all
      ${active 
        ? 'bg-gal-pink text-white shadow-inner' 
        : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gal-pink-dark'
      }
    `}
  >
    <i className={`fas ${icon}`}></i> {label}
  </button>
);