
import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useUser } from '../contexts/UserContext';
import { GameView } from '../types';

const OnlineScreen: React.FC<{ onBack: () => void; onNavigate: (view: GameView) => void; }> = ({ onBack, onNavigate }) => {
  const { user } = useUser();
  const [searching, setSearching] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
         <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
         <p className="text-lg text-gray-400 mb-8">You must be logged in to play online.</p>
         <button onClick={() => onNavigate('login')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">
            Go to Login
         </button>
      </div>
    )
  }
  
  if (searching) {
      return (
         <div className="h-full flex flex-col items-center justify-center text-center">
             <h1 className="text-4xl font-bold mb-4 text-green-400">Searching for Game...</h1>
             <p className="text-lg text-gray-400 mb-8">Looking for a worthy opponent for your {searching} match... (Simulation)</p>
             <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
             <button onClick={() => setSearching(null)} className="mt-8 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition">
                Cancel Search
            </button>
         </div>
      )
  }


  return (
    <>
      <div className="h-full flex flex-col items-center justify-center text-center">
        <button onClick={onBack} className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition">
          <ArrowLeftIcon />
          <span>Main Menu</span>
        </button>
        <h1 className="text-4xl font-bold mb-4">Online Lobby</h1>
        <p className="text-lg text-gray-400 mb-8">Challenge players from around the world.</p>
        
        <div className="w-full max-w-2xl bg-gray-900/50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-700/50 hover:bg-gray-700 rounded-md transition cursor-pointer" onClick={() => setSearching('Casual')}>
              <div>
                <span className="text-xl font-semibold">Casual Match</span>
                <p className="text-sm text-gray-400">Play for fun. No stakes.</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">Play Free</button>
          </div>
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-600/30 to-purple-500/10 hover:bg-purple-600/40 rounded-md transition cursor-pointer border border-purple-500/50" onClick={() => setSearching('Ranked')}>
              <div>
                <span className="text-xl font-semibold text-purple-300">Ranked Match</span>
                <p className="text-sm text-purple-400/80">Compete for glory and climb the ladder.</p>
              </div>
              <button className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 rounded transition">Play Ranked</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnlineScreen;