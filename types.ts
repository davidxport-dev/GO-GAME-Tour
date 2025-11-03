export type Player = 'black' | 'white';
export type Stone = Player | null;
export type Board = Stone[][];
export type GameView = 'menu' | 'offline-game' | 'online' | 'tournaments' | 'login' | 'rules' | 'offline-setup' | 'profile';
export type AIDifficulty = 'beginner' | 'skilled' | 'pro';

export interface Move {
  row: number;
  col: number;
}

export interface User {
  username: string; // This will be used as the nickname
  name: string;
  age: number | null;
  country: string;
  city: string;
}

export interface Tournament {
  id: number;
  name: string;
  prizePool: number;
  status: 'Upcoming' | 'Live' | 'Finished';
}