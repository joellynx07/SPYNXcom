import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translate, LANGUAGES } from "./i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("spynx_lang") || "en");

  useEffect(() => {
    localStorage.setItem("spynx_lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l), []);
  const t = useCallback((path) => translate(lang, path), [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, t, LANGUAGES }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
