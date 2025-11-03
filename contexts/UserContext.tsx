
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  login: (userDetails: Omit<User, 'username'> & { username: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userDetails: User) => {
    // In a real app, this would involve a password and API call.
    setUser(userDetails);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};