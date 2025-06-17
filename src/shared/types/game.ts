type Response<T> = { status: 'error'; message: string } | ({ status: 'success' } & T);

export type LetterState = 'initial' | 'correct' | 'present' | 'absent';

export type CheckResponse = Response<{
  exists?: boolean;
  solved: boolean;
  correct: [LetterState, LetterState, LetterState, LetterState, LetterState];
}>;

export type InitResponse = Response<{
  postId: string;
}>;

// Street Fighter Game Types
export type Screen = 
  | 'home' 
  | 'character-editor' 
  | 'matchmaking' 
  | 'leaderboard' 
  | 'make-move' 
  | 'fight';

export interface Character {
  id: string;
  name: string;
  hat: string;
  weapon: string;
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  character: Character;
}

export interface GameState {
  currentScreen: Screen;
  player: Player;
  opponent?: Player;
  isMatchmaking: boolean;
  drawingData?: string;
  timeLeft: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}