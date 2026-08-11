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
  // When true, send the PDF as image attachments to the model (OpenAI-compatible payload)
  sendAsImages?: boolean;
}

export enum GameState {
  IDLE,
  PROCESSING,
  PLAYING,
  PAUSED,
}

// Notes
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  structured?: Record<string, any>;
}
