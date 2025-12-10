import React, { useState } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { UploadScreen } from './components/UploadScreen';
import { GameScreen } from './components/GameScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { DialogueLine, GameSettings } from './types';

export enum AppState {
  TITLE,
  UPLOAD,
  GAME,
  SETTINGS,
}

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.TITLE);
  const [script, setScript] = useState<DialogueLine[]>([]);
  const [paperTitle, setPaperTitle] = useState<string>("");
  const [settings, setSettings] = useState<GameSettings>({
    detailLevel: 'detailed',
    personality: 'tsundere'
  });

  const handleStartGame = (generatedScript: DialogueLine[], title: string) => {
    setScript(generatedScript);
    setPaperTitle(title);
    setCurrentState(AppState.GAME);
  };

  const handleBackToTitle = () => {
    setCurrentState(AppState.TITLE);
    setScript([]);
    setPaperTitle("");
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden font-serif select-none">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0">
        {currentState === AppState.GAME ? (
          <img 
            src="https://picsum.photos/1920/1080?blur=2" 
            alt="Game Background" 
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-pink-50 relative overflow-hidden">
             {/* Striped Background Effect */}
             <div className="absolute inset-0 opacity-10" 
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ff9eb5 25%, transparent 25%, transparent 50%, #ff9eb5 50%, #ff9eb5 75%, transparent 75%, transparent)',
                    backgroundSize: '40px 40px'
                  }}>
             </div>
             {/* Floating Decor */}
             <div className="absolute top-10 left-10 text-gal-pink-dark opacity-30 text-6xl animate-float">✿</div>
             <div className="absolute bottom-20 right-20 text-gal-pink-dark opacity-30 text-8xl animate-float" style={{animationDelay: '1s'}}>✿</div>
             <div className="absolute top-1/2 left-1/3 text-gal-blue opacity-20 text-4xl animate-float" style={{animationDelay: '2s'}}>✦</div>
          </div>
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {currentState === AppState.TITLE && (
          <TitleScreen 
            onStart={() => setCurrentState(AppState.UPLOAD)} 
            onSettings={() => setCurrentState(AppState.SETTINGS)}
          />
        )}
        
        {currentState === AppState.SETTINGS && (
          <SettingsScreen
            currentSettings={settings}
            onSave={(newSettings) => {
              setSettings(newSettings);
              setCurrentState(AppState.TITLE);
            }}
            onBack={() => setCurrentState(AppState.TITLE)}
          />
        )}

        {currentState === AppState.UPLOAD && (
          <UploadScreen 
            onScriptGenerated={handleStartGame} 
            onBack={handleBackToTitle}
            settings={settings}
          />
        )}
        
        {currentState === AppState.GAME && (
          <GameScreen 
            script={script} 
            title={paperTitle}
            onExit={handleBackToTitle} 
          />
        )}
      </div>
    </div>
  );
};

export default App;