import { createContext, ReactNode, useContext, useState } from 'react';
import { CatalogConnectionProvider } from './CatalogConnectionContext';

interface Profile {
  label: string;
  id: string;
  icon: string;
  isKid: boolean;
}

interface AppAuthContextType {
  isAuthenticated: boolean;
  profiles: Profile[];
  selectedProfile: Profile | null;
  setSelectedProfile: (profile: Profile) => void;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

interface AppAuthProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  profiles: Profile[];
}

export function AppAuthProvider({
  children,
  isAuthenticated,
  profiles = [],
}: AppAuthProviderProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
    isAuthenticated ? profiles[0] || null : null,
  );

  const contextValue = {
    isAuthenticated,
    profiles: isAuthenticated ? profiles : [],
    selectedProfile: isAuthenticated ? selectedProfile : null,
    setSelectedProfile: (profile: Profile) => {
      if (isAuthenticated) {
        setSelectedProfile(profile);
      }
    },
  };

  return (
    <AppAuthContext.Provider value={contextValue}>
      <CatalogConnectionProvider>{children}</CatalogConnectionProvider>
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
}
