
import React, { useState, FormEvent } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useUser } from '../contexts/UserContext';
import { GameView } from '../types';

const LoginScreen: React.FC<{ onBack: () => void; onNavigate: (view: GameView) => void; }> = ({ onBack, onNavigate }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const { login } = useUser();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            login({ 
                username: username.trim(),
                name: isLogin ? 'Existing User' : name.trim(), // Use dummy data for login
                age: isLogin ? 25 : (age ? parseInt(age, 10) : null),
                country: isLogin ? 'USA' : country.trim(),
                city: isLogin ? 'New York' : city.trim(),
            });
            onNavigate('menu'); // Navigate back to menu after login/registration
        } else {
            alert('Please enter a username.');
        }
    };

    const inputClass = "w-full bg-gray-900/50 rounded-md p-3 border border-gray-600 focus:border-blue-500 focus:outline-none";

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <button onClick={onBack} className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition">
                <ArrowLeftIcon />
                <span>Main Menu</span>
            </button>
            <div className="w-full max-w-md">
                <div className="flex border-b border-gray-600 mb-6">
                    <button onClick={() => setIsLogin(true)} className={`w-1/2 py-3 font-bold text-lg transition ${isLogin ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'}`}>
                        Login
                    </button>
                    <button onClick={() => setIsLogin(false)} className={`w-1/2 py-3 font-bold text-lg transition ${!isLogin ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'}`}>
                        Register
                    </button>
                </div>

                <h1 className="text-3xl font-bold text-center mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1" htmlFor="username">Nickname</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="Enter your nickname" required />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1" htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••••" required />
                    </div>
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-400 mb-1" htmlFor="name">Full Name</label>
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-1" htmlFor="age">Age</label>
                                    <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="e.g., 25" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1" htmlFor="country">Country</label>
                                    <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} placeholder="e.g., USA" required />
                                </div>
                             </div>
                             <div>
                                <label className="block text-gray-400 mb-1" htmlFor="city">City</label>
                                <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="e.g., New York" required />
                            </div>
                        </>
                    )}
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition mt-6">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;