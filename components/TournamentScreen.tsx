
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Tournament } from '../types';
import { useUser } from '../contexts/UserContext';
import TrophyIcon from './icons/TrophyIcon';

const dummyTournaments: Tournament[] = [
  { id: 1, name: 'Weekly Rookie Cup', prizePool: 50, status: 'Upcoming' },
  { id: 2, name: 'Summer Championship', prizePool: 1000, status: 'Upcoming' },
  { id: 3, name: 'Go Master Invitational', prizePool: 5000, status: 'Live' },
  { id: 4, name: 'Community Clash', prizePool: 20, status: 'Finished' },
];

const TournamentCard: React.FC<{ tournament: Tournament, onJoin: (t: Tournament) => void }> = ({ tournament, onJoin }) => {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'Upcoming': return 'text-blue-400';
      case 'Live': return 'text-green-400 animate-pulse';
      case 'Finished': return 'text-gray-500';
    }
  }

  return (
    <div className={`p-4 rounded-lg bg-gray-700/50 border border-gray-600 flex justify-between items-center transition hover:border-blue-500 ${tournament.status === 'Finished' ? 'opacity-60' : ''}`}>
      <div>
        <h3 className="text-xl font-bold flex items-center">
          {tournament.name}
        </h3>
        <p className="text-sm text-gray-400">
          Prize Pool: <span className="font-semibold text-green-400">${tournament.prizePool.toLocaleString()}</span>
          <span className="mx-2">|</span>
          Entry: Free
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${getStatusColor(tournament.status)}`}>{tournament.status}</p>
        {tournament.status !== 'Finished' && (
           <button 
             onClick={() => onJoin(tournament)}
             className={`mt-1 text-white font-bold py-1 px-4 rounded transition text-sm bg-blue-600 hover:bg-blue-500`}
           >
             {tournament.status === 'Live' ? 'View' : 'Join'}
           </button>
        )}
      </div>
    </div>
  );
};

const TournamentScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const { user } = useUser();

  const handleJoinClick = (tournament: Tournament) => {
    if (user) {
        alert(`You have joined the ${tournament.name}! (Simulation)`);
    } else {
        alert("You must be logged in to join tournaments.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
          <ArrowLeftIcon />
          <span>Main Menu</span>
        </button>
        <h1 className="text-4xl font-bold text-center">Tournaments</h1>
        <div className="w-24"></div> {/* Spacer */}
      </div>
      
      <div className="w-full max-w-4xl mx-auto space-y-4 overflow-y-auto pr-2">
        {dummyTournaments.map(t => <TournamentCard key={t.id} tournament={t} onJoin={handleJoinClick} />)}
      </div>
    </div>
  );
};

export default TournamentScreen;