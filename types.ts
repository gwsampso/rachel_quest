export type GamePhase = 'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

export interface Option {
  id: 'A' | 'B';
  label: string;
  text: string;
  nextScenarioId?: string;
  isGameOver: boolean;
  gameOverReason?: string;
  loveMeterChange?: number;
  inventoryItem?: string;
  successFeedback?: string;
  familyAdd?: string;
  houseLevelChange?: number;
}

export interface Scenario {
  id: string;
  levelTitle: string;
  title: string;
  description: string;
  imageKeyword?: string;
  imageSrcKey?: string; // Key for the pre-loaded base64 image
  options: Option[];
}

export interface PlayerState {
  hearts: number;
  currentLevelLove: number;
  inventory: string[];
  currentScenarioId: string;
  family: string[];
  houseLevel: number;
}