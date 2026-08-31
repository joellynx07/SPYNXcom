import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "obsidian-gold", label: "Obsidian Gold", swatch: ["#0B0E14", "#D4AF37", "#1F6FEB"] },
  { id: "midnight-emerald", label: "Midnight Emerald", swatch: ["#080E12", "#2DD4A0", "#38BDF8"] },
  { id: "sandstone-light", label: "Sandstone Light", swatch: ["#FAF6ED", "#B45309", "#1E40AF"] },
  { id: "neon-cyber", label: "Neon Cyber", swatch: ["#06060C", "#EC48C8", "#22D3EE"] },
  { id: "kente-royale", label: "Kente Royale", swatch: ["#120A08", "#E8B923", "#C1272D"] },
  { id: "ocean-mist", label: "Ocean Mist", swatch: ["#F0F7F7", "#0E7C7B", "#2C5F8A"] },
  { id: "crimson-dusk", label: "Crimson Dusk", swatch: ["#0D0808", "#E23744", "#8A8D91"] },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("spynx_theme") || "obsidian-gold");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("spynx_theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
