export type PlayerSymbol = 'X' | 'O';
export type GameMode = 'ai' | 'pvp';
export type AiDifficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';
export type GameWinner = 'X' | 'O' | 'draw' | 'none' | null;

export interface PlayerInfo {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

export interface GameDoc {
  id: string;
  gameCode: string;
  mode: GameMode;
  aiDifficulty?: AiDifficulty | 'none';
  creatorId: string;
  creatorDisplayName?: string;
  creatorPhotoURL?: string;
  playerX: PlayerInfo;
  playerO: PlayerInfo | null;
  status: GameStatus;
  winner?: GameWinner;
  currentTurn: PlayerSymbol;
  moveCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface GameEventDoc {
  id: string;
  gameId: string;
  eventIndex: number;
  turnNumber?: number;
  type: 'MOVE' | 'ROLLBACK';
  player?: PlayerSymbol | 'none';
  playerId?: string;
  cellIndex?: number;
  targetTurn?: number;
  timestamp?: any;
}

export interface TurnSnapshot {
  turnNumber: number;
  eventIndex: number;
  board: (PlayerSymbol | null)[];
  lastMove: {
    cellIndex: number;
    player: PlayerSymbol;
  } | null;
  currentTurn: PlayerSymbol;
  winner: GameWinner;
  winningLine: number[] | null;
  summary: string;
}

export interface ReconstructedState {
  board: (PlayerSymbol | null)[];
  currentTurn: PlayerSymbol;
  winner: GameWinner;
  winningLine: number[] | null;
  moveCount: number;
  isGameOver: boolean;
  history: TurnSnapshot[];
}
