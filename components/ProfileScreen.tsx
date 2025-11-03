import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useUser } from '../contexts/UserContext';
import UserCircleIcon from './icons/UserCircleIcon';

const ProfileDetail: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
  </div>
);

const GameHistoryItem: React.FC<{ result: 'Win' | 'Loss'; opponent: string; board: string; }> = ({ result, opponent, board }) => (
    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-md">
        <div>
            <p className="font-semibold">{opponent}</p>
            <p className="text-sm text-gray-400">{board} Board</p>
        </div>
        <p className={`font-bold text-lg ${result === 'Win' ? 'text-green-400' : 'text-red-400'}`}>{result}</p>
    </div>
);

const ProfileScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-4">Not Logged In</h1>
        <p className="text-lg text-gray-400">You must be logged in to view your profile.</p>
        <button onClick={onBack} className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">
            Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
          <ArrowLeftIcon />
          <span>Main Menu</span>
        </button>
        <h1 className="text-4xl font-bold text-center">User Profile</h1>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="w-full max-w-4xl mx-auto overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details & Ranking */}
        <div className="md:col-span-1 space-y-8">
            <div className="bg-gray-900/50 p-6 rounded-lg text-center">
                 <UserCircleIcon/>
                 <h2 className="text-2xl font-bold mt-4">{user.username}</h2>
                 <p className="text-gray-400">{user.city}, {user.country}</p>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Account Details</h3>
                <dl className="divide-y divide-gray-700">
                    <ProfileDetail label="Full Name" value={user.name} />
                    <ProfileDetail label="Nickname" value={user.username} />
                    <ProfileDetail label="Age" value={user.age} />
                    <ProfileDetail label="Location" value={`${user.city}, ${user.country}`} />
                </dl>
            </div>
             <div className="bg-gray-900/50 p-6 rounded-lg text-center">
                 <h3 className="text-xl font-bold mb-2">Current Rank (Simulated)</h3>
                 <p className="text-4xl font-extrabold text-blue-400">5 kyu</p>
                 <p className="text-gray-400">ELO: 1500</p>
            </div>
        </div>

        {/* Right Column: Game History */}
        <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Game History (Simulated)</h3>
            <div className="space-y-3">
                <GameHistoryItem result="Win" opponent="vs. AI (Skilled)" board="19x19" />
                <GameHistoryItem result="Loss" opponent="vs. PlayerX" board="13x13" />
                <GameHistoryItem result="Win" opponent="vs. PlayerY" board="19x19" />
                <GameHistoryItem result="Win" opponent="vs. AI (Beginner)" board="9x9" />
                <GameHistoryItem result="Loss" opponent="vs. AI (Pro)" board="19x19" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;