import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';

const LANGUAGE_KEY = 'sccrm_language';

export type SupportedLanguage = 'th' | 'en';

interface LanguageContextValue {
  language: SupportedLanguage | null;  // null = first launch, not yet chosen
  languageLoaded: boolean;             // true once AsyncStorage read completes
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: null,
  languageLoaded: false,
  changeLanguage: async () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage | null>(null);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((saved) => {
        if (saved === 'th' || saved === 'en') {
          setLanguage(saved);
          void i18n.changeLanguage(saved);
        }
        // saved === null → first launch; language stays null → show picker
        setLanguageLoaded(true);
      })
      .catch(() => {
        // Storage failure — show picker so user can still choose
        setLanguageLoaded(true);
      });
  }, []);

  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    setLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, languageLoaded, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
