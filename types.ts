export interface StoryState {
  text: string;
  choices: Choice[];
  inventory: string[];
  currentQuest: string;
  imagePrompt: string;
  sceneTitle: string;
}

export interface Choice {
  id: string;
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface HistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export enum ImageSize {
  Size_1K = "1K",
  Size_2K = "2K",
  Size_4K = "4K"
}

export interface GameContext {
  history: HistoryItem[];
  inventory: string[];
  quest: string;
  location: string;
  characterDescription: string;
}

export interface GameState {
  history: HistoryItem[];
  currentText: string;
  choices: Choice[];
  inventory: string[];
  quest: string;
  sceneTitle: string;
  currentImage: string | null;
  charDesc: string;
  started: boolean;
  imageSize: ImageSize;
  savedAt: number;
}

// Window augmentation for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}