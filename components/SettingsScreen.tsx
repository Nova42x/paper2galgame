import React, { useState } from 'react';
import { GameSettings } from '../types';

interface SettingsScreenProps {
  currentSettings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentSettings, onSave, onBack }) => {
  const [settings, setSettings] = useState<GameSettings>(currentSettings);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white/60 backdrop-blur-md p-8 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gal-pink/10 -z-10"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-2 border-gal-pink">
        <h2 className="text-3xl font-bold text-center text-gal-pink-dark mb-8 flex items-center justify-center gap-3">
          <i className="fas fa-cog animate-spin-slow"></i> 
          System Configuration
        </h2>

        <div className="space-y-8">
          
          {/* Detail Level Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b-2 border-gray-100 pb-2">
              <i className="fas fa-book-reader text-gal-blue mr-2"></i>
              Analysis Depth (解析深度)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SettingOption 
                label="Brief (简略)" 
                desc="Quick summary, ~15 turns"
                selected={settings.detailLevel === 'brief'}
                onClick={() => setSettings({...settings, detailLevel: 'brief'})}
              />
              <SettingOption 
                label="Detailed (标准)" 
                desc="Deep dive, ~25 turns"
                selected={settings.detailLevel === 'detailed'}
                onClick={() => setSettings({...settings, detailLevel: 'detailed'})}
              />
              <SettingOption 
                label="Academic (学术)" 
                desc="Research focused, ~30 turns"
                selected={settings.detailLevel === 'academic'}
                onClick={() => setSettings({...settings, detailLevel: 'academic'})}
              />
            </div>
          </div>

          {/* Personality Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b-2 border-gray-100 pb-2">
              <i className="fas fa-heart text-gal-pink mr-2"></i>
              Murasame's Mood (性格调整)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SettingOption 
                label="Tsundere (傲娇)" 
                desc="Standard Murasame experience"
                selected={settings.personality === 'tsundere'}
                onClick={() => setSettings({...settings, personality: 'tsundere'})}
              />
              <SettingOption 
                label="Gentle (温柔)" 
                desc="Supportive onee-san style"
                selected={settings.personality === 'gentle'}
                onClick={() => setSettings({...settings, personality: 'gentle'})}
              />
              <SettingOption 
                label="Strict (严厉)" 
                desc="No slacking allowed!"
                selected={settings.personality === 'strict'}
                onClick={() => setSettings({...settings, personality: 'strict'})}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 mt-4 border border-gray-200">
            <i className="fas fa-info-circle mr-1"></i> 
            <strong>Note:</strong> API Key configuration is handled via environment variables for security. 
            Murasame cannot modify the world's source code from here.
          </div>

        </div>

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
          <button 
            onClick={onBack}
            className="px-6 py-2 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(settings)}
            className="px-8 py-2 rounded-full font-bold bg-gal-pink text-white hover:bg-gal-pink-dark shadow-md transform hover:scale-105 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingOption: React.FC<{ label: string; desc: string; selected: boolean; onClick: () => void }> = ({ label, desc, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
      ${selected 
        ? 'border-gal-pink bg-pink-50 text-gal-pink-dark shadow-md scale-105' 
        : 'border-gray-200 hover:border-gal-pink/50 hover:bg-white text-gray-600'
      }
    `}
  >
    <div className="font-bold text-lg mb-1">{label}</div>
    <div className="text-xs opacity-80">{desc}</div>
  </button>
);
