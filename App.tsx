import React, { useState, useCallback } from 'react';
import { GameView, AIDifficulty, TimeSetting } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import OnlineScreen from './components/OnlineScreen';
import TournamentScreen from './components/TournamentScreen';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import RulesScreen from './components/RulesScreen';
import OfflineSetupScreen from './components/OfflineSetupScreen';
import ProfileScreen from './components/ProfileScreen';

const App: React.FC = () => {
  const [view, setView] = useState<GameView>('menu');
  const [boardSize, setBoardSize] = useState<number>(9);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('skilled');
  const [timeSetting, setTimeSetting] = useState<TimeSetting>('15m');

  const navigateTo = useCallback((newView: GameView) => {
    setView(newView);
  }, []);

  const handleStartGame = useCallback((size: number, difficulty: AIDifficulty, time: TimeSetting) => {
    setBoardSize(size);
    setAiDifficulty(difficulty);
    setTimeSetting(time);
    setView('offline-game');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onNavigate={navigateTo} />;
      case 'offline-setup':
        return <OfflineSetupScreen onBack={() => navigateTo('menu')} onStartGame={handleStartGame} />;
      case 'offline-game':
        return <GameScreen onBack={() => navigateTo('menu')} size={boardSize} difficulty={aiDifficulty} timeSetting={timeSetting} />;
      case 'online':
        return <OnlineScreen onBack={() => navigateTo('menu')} onNavigate={navigateTo} />;
      case 'tournaments':
        return <TournamentScreen onBack={() => navigateTo('menu')} />;
      case 'login':
        return <LoginScreen onBack={() => navigateTo('menu')} onNavigate={navigateTo} />;
      case 'rules':
        return <RulesScreen onBack={() => navigateTo('menu')} />;
      case 'profile':
        return <ProfileScreen onBack={() => navigateTo('menu')} />;
      default:
        return <MainMenu onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-800 text-white flex flex-col overflow-hidden">
      {/* Title Bar */}
      <div className="w-full bg-gray-900/50 px-4 py-2 flex items-center justify-between border-b border-gray-700 z-10 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <h1 className="text-lg font-bold text-gray-300">Go Master</h1>
        {/* Header component for user info */}
        <Header onNavigate={navigateTo} />
      </div>
      
      {/* Content */}
      <div className={`flex-grow min-h-0 ${view !== 'offline-game' ? 'p-4 md:p-6' : ''}`}>
           {renderView()}
      </div>
    </div>
  );
};

export default App;