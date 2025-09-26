import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Language, LanguageTexts, languages, defaultLanguage } from '../constants/languages';

interface LanguageContextType {
  language: Language;
  texts: LanguageTexts;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = React.memo<LanguageProviderProps>(({ children }) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  const texts = useMemo(() => languages[language], [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ms' : 'en');
  }, []);

  const value = useMemo(() => ({
    language,
    texts,
    setLanguage,
    toggleLanguage,
  }), [language, texts, toggleLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
});

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}