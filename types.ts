export interface DialogueLine {
  speaker: string;
  text: string;
  emotion: 'normal' | 'happy' | 'angry' | 'surprised' | 'shy' | 'proud';
  note?: string; // For technical terms explanation
}

export interface PaperAnalysisResponse {
  title: string;
  script: DialogueLine[];
}

export interface GameSettings {
  detailLevel: 'brief' | 'detailed' | 'academic';
  personality: 'tsundere' | 'gentle' | 'strict';
}

export enum GameState {
  IDLE,
  PROCESSING,
  PLAYING,
  PAUSED,
}
