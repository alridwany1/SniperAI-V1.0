import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant } from '../types';
import { Language } from '../utils/translations';

interface AppContextType {
  userEmail: string;
  setUserEmail: (email: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant | null) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  language: Language;
  setLanguage: (lang: Language) => void;
  speechLocale: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const speechLocaleMap: Record<Language, string> = {
  en: 'en-US',
  ar: 'ar-SA',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('userEmail') || '';
  });
  const [selectedTenantId, setSelectedTenantId] = useState<string>('root');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const speechLocale = speechLocaleMap[language] || 'en-US';

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isAuthenticated));
    localStorage.setItem('userEmail', userEmail);
  }, [isAuthenticated, userEmail]);

  return (
    <AppContext.Provider
      value={{
        userEmail,
        setUserEmail,
        isAuthenticated,
        setIsAuthenticated,
        activeTenant,
        setActiveTenant,
        selectedTenantId,
        setSelectedTenantId,
        tenants,
        setTenants,
        language,
        setLanguage,
        speechLocale,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
