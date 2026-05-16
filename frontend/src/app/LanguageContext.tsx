'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  "Login securely": { en: "Login securely", hi: "सुरक्षित लॉगिन करें" },
  "Phone Number": { en: "Phone Number", hi: "फ़ोन नंबर" },
  "OTP": { en: "OTP", hi: "ओटीपी" },
  "Security Force Management": { en: "Security Force Management", hi: "सुरक्षा बल प्रबंधन" },
  "Check In Now": { en: "Check In Now", hi: "अभी हाजिरी लगाएं" },
  "Tap to acquire GPS": { en: "Tap to acquire GPS", hi: "जीपीएस के लिए टैप करें" },
  "Location Ready": { en: "Location Ready", hi: "स्थान तैयार है" },
  "Checking...": { en: "Checking...", hi: "जांच हो रही है..." },
  "Sign Out": { en: "Sign Out", hi: "लॉग आउट करें" },
  "Hello": { en: "Hello", hi: "नमस्ते" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved) setLang(saved);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
