import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  currentUser: string | null;
  selectedPlant: string | null;
  selectedLine: string | null;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedPlant = localStorage.getItem('selectedPlant');
    const savedLine = localStorage.getItem('selectedLine');

    // Try to parse user object, if it's already an object use username, otherwise use as is
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setCurrentUser(userObj.username || savedUser);
      } catch {
        setCurrentUser(savedUser);
      }
    }
    if (savedPlant) setSelectedPlant(savedPlant);
    if (savedLine) setSelectedLine(savedLine);

    setIsLoading(false);
  }, []);

  // Don't save currentUser to localStorage - authService handles this
  // We only track the username in state for UI purposes

  useEffect(() => {
    if (selectedPlant) {
      localStorage.setItem('selectedPlant', selectedPlant);
    } else {
      localStorage.removeItem('selectedPlant');
    }
  }, [selectedPlant]);

  useEffect(() => {
    if (selectedLine) {
      localStorage.setItem('selectedLine', selectedLine);
    } else {
      localStorage.removeItem('selectedLine');
    }
  }, [selectedLine]);

  const logout = () => {
    setCurrentUser(null);
    setSelectedPlant(null);
    setSelectedLine(null);
    localStorage.clear();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      selectedPlant,
      selectedLine,
      isLoading,
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