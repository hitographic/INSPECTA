import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  currentUser: string | null;
  selectedPlant: string | null;
  selectedLine: string | null;
  setCurrentUser: (user: string | null) => void;
  setSelectedPlant: (plant: string | null) => void;
  setSelectedLine: (line: string | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const logout = () => {
    setCurrentUser(null);
    setSelectedPlant(null);
    setSelectedLine(null);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      selectedPlant,
      selectedLine,
      setCurrentUser,
      setSelectedPlant,
      setSelectedLine,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};