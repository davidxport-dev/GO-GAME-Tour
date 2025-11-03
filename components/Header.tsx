
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { GameView } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';

interface HeaderProps {
  onNavigate: (view: GameView) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useUser();

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <button onClick={() => onNavigate('profile')} className="flex items-center space-x-2 text-gray-300 hover:text-white transition">
           <UserCircleIcon />
           <span>{user.username}</span>
        </button>
        <button onClick={logout} className="text-gray-400 hover:text-white transition text-sm">Logout</button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button onClick={() => onNavigate('login')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-1 px-3 rounded transition">
        Login
      </button>
       <button onClick={() => onNavigate('login')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold text-sm py-1 px-3 rounded transition">
        Register
      </button>
    </div>
  );
};

export default Header;