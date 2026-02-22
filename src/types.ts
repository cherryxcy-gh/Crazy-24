export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Card {
  id: string;
  value: CardValue;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface GameState {
  currentCards: Card[];
  score: number;
  history: GameRound[];
  status: 'idle' | 'playing' | 'checking' | 'won' | 'lost';
  message: string;
}

export interface GameRound {
  cards: Card[];
  expression: string;
  result: number;
  success: boolean;
  timestamp: number;
}
