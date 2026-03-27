export enum GameMode {
  PICK_ONE = 'A',
  RATE_ALL = 'B',
  BUDGET_34 = 'C',
}

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface VotingOption {
  id: string;
  name: string;
  description: string;
}

export interface VoteData {
  [optionId: string]: number;
}

export interface GameState {
  participants: Participant[];
  options: VotingOption[];
  mode: GameMode;
  votes: { [userId: string]: VoteData };
  submitted: { [userId: string]: boolean };
  anonymous: boolean;
  timerEnabled: boolean;
  timerDuration: number;
  liveResults: true;
  language: 'en' | 'zh';
}

export interface ResultData extends VotingOption {
  scores: number[];
  total: number;
  mean: number;
  median: number;
  count: number;
}
