import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { AIDifficulty } from '../types';

interface OfflineSetupScreenProps {
  onBack: () => void;
  onStartGame: (size: number, difficulty: AIDifficulty) => void;
}

const OptionButton: React.FC<{
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, description, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-6 rounded-lg text-center transition-all duration-200 border-2 ${
      isSelected
        ? 'bg-blue-600 border-blue-400 shadow-lg scale-105'
        : 'bg-gray-700/50 border-gray-600 hover:border-blue-500'
    }`}
  >
    <p className="text-3xl font-bold">{label}</p>
    <p className="text-gray-300">{description}</p>
  </button>
);


const OfflineSetupScreen: React.FC<OfflineSetupScreenProps> = ({ onBack, onStartGame }) => {
  const [selectedSize, setSelectedSize] = useState<number>(9);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('skilled');

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <button onClick={onBack} className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition">
        <ArrowLeftIcon />
        <span>Main Menu</span>
      </button>

      <div className="text-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Offline Game Setup</h1>
        <p className="text-lg text-gray-400 mb-10">Configure your match against the AI.</p>
      
        <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-left text-gray-200">Board Size</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OptionButton label="9x9" description="Beginner" isSelected={selectedSize === 9} onClick={() => setSelectedSize(9)} />
                <OptionButton label="13x13" description="Intermediate" isSelected={selectedSize === 13} onClick={() => setSelectedSize(13)} />
                <OptionButton label="19x19" description="Standard" isSelected={selectedSize === 19} onClick={() => setSelectedSize(19)} />
            </div>
        </div>
        
        <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-left text-gray-200">AI Difficulty</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OptionButton label="Beginner" description="Easy" isSelected={selectedDifficulty === 'beginner'} onClick={() => setSelectedDifficulty('beginner')} />
                <OptionButton label="Skilled" description="Normal" isSelected={selectedDifficulty === 'skilled'} onClick={() => setSelectedDifficulty('skilled')} />
                <OptionButton label="Pro" description="Hard" isSelected={selectedDifficulty === 'pro'} onClick={() => setSelectedDifficulty('pro')} />
            </div>
        </div>

      </div>

      <button
        onClick={() => onStartGame(selectedSize, selectedDifficulty)}
        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-12 rounded-lg transition-transform transform hover:scale-105 text-xl"
      >
        Start Game
      </button>
    </div>
  );
};

export default OfflineSetupScreen;