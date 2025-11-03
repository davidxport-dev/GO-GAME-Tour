import React from 'react';
import { GameView } from '../types';
import PlayerIcon from './icons/PlayerIcon';
import GlobeIcon from './icons/GlobeIcon';
import TrophyIcon from './icons/TrophyIcon';
import InfoIcon from './icons/InfoIcon';
import { useUser } from '../contexts/UserContext';

interface MainMenuProps {
  onNavigate: (view: GameView) => void;
}

const MenuCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-700/50 rounded-lg p-6 flex flex-col items-center justify-center text-center border-2 border-transparent hover:border-blue-500 hover:bg-gray-700 transition-all duration-300 cursor-pointer transform hover:scale-105"
    >
        <div className="mb-4 text-blue-400">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400">{description}</p>
    </div>
);


const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const { user } = useUser();

  const handleNavigation = (view: GameView) => {
    if ((view === 'online' || view === 'tournaments') && !user) {
      onNavigate('login');
    } else {
      onNavigate(view);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Go Master
      </h1>
      <p className="text-xl text-gray-400 mb-12">The ancient game of strategy, reborn.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <MenuCard 
          title="Play Offline"
          description="Challenge a powerful AI opponent. Perfect for practice."
          icon={<PlayerIcon />}
          onClick={() => handleNavigation('offline-setup')}
        />
        <MenuCard 
          title="Play Online"
          description="Join the global community. Find matches and make friends."
          icon={<GlobeIcon />}
          onClick={() => handleNavigation('online')}
        />
        <MenuCard 
          title="Tournaments"
          description="Compete for glory and prizes in scheduled events."
          icon={<TrophyIcon />}
          onClick={() => handleNavigation('tournaments')}
        />
        <MenuCard 
          title="Game Rules"
          description="Learn the basics of Go and master the fundamentals."
          icon={<InfoIcon />}
          onClick={() => handleNavigation('rules')}
        />
      </div>
    </div>
  );
};

export default MainMenu;