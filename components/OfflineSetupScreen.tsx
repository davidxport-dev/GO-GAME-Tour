import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { AIDifficulty, TimeSetting } from '../types';

interface OfflineSetupScreenProps {
  onBack: () => void;
  onStartGame: (size: number, difficulty: AIDifficulty, timeSetting: TimeSetting) => void;
}

const OptionButton: React.FC<{
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, description, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-lg text-center transition-all duration-200 border-2 ${
      isSelected
        ? 'bg-blue-600 border-blue-400 shadow-lg scale-105'
        : 'bg-gray-700/50 border-gray-600 hover:border-blue-500'
    }`}
  >
    <p className="text-2xl font-bold">{label}</p>
    <p className="text-sm text-gray-400">{description}</p>
  </button>
);


const OfflineSetupScreen: React.FC<OfflineSetupScreenProps> = ({ onBack, onStartGame }) => {
  const [selectedSize, setSelectedSize] = useState<number>(9);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('skilled');
  const [selectedTime, setSelectedTime] = useState<TimeSetting>('15m');
  const [timeEnabled, setTimeEnabled] = useState(true);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <button onClick={onBack} className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition">
        <ArrowLeftIcon />
        <span>Main Menu</span>
      </button>

      <div className="text-center w-full max-w-4xl">
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
        
        <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-left text-gray-200">AI Difficulty</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OptionButton label="Beginner" description="Easy" isSelected={selectedDifficulty === 'beginner'} onClick={() => setSelectedDifficulty('beginner')} />
                <OptionButton label="Skilled" description="Normal" isSelected={selectedDifficulty === 'skilled'} onClick={() => setSelectedDifficulty('skilled')} />
                <OptionButton label="Pro" description="Hard" isSelected={selectedDifficulty === 'pro'} onClick={() => setSelectedDifficulty('pro')} />
            </div>
        </div>
        
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-left text-gray-200">Time Controls</h2>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setTimeEnabled(e => !e)}>
                    <div className={`relative w-12 h-7 rounded-full p-1 transition-colors ${timeEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}>
                        <div className="absolute bg-white w-5 h-5 rounded-full transition-transform"
                            style={{ transform: `translateX(${timeEnabled ? '1.25rem' : '0rem'})` }}
                        />
                    </div>
                    <span className={`font-semibold transition-colors ${timeEnabled ? 'text-white' : 'text-gray-400'}`}>
                        {timeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
            </div>
            {timeEnabled && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <OptionButton label="5 min" description="Blitz" isSelected={selectedTime === '5m'} onClick={() => setSelectedTime('5m')} />
                    <OptionButton label="15 min" description="Standard" isSelected={selectedTime === '15m'} onClick={() => setSelectedTime('15m')} />
                    <OptionButton label="30 min" description="Long" isSelected={selectedTime === '30m'} onClick={() => setSelectedTime('30m')} />
                    <OptionButton label="Unlimited" description="Relaxed" isSelected={selectedTime === 'unlimited'} onClick={() => setSelectedTime('unlimited')} />
                </div>
            )}
        </div>
      </div>

      <button
        onClick={() => onStartGame(selectedSize, selectedDifficulty, timeEnabled ? selectedTime : 'unlimited')}
        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-12 rounded-lg transition-transform transform hover:scale-105 text-xl"
      >
        Start Game
      </button>
    </div>
  );
};

export default OfflineSetupScreen;