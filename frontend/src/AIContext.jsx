import React, { createContext, useContext, useState } from "react";

const AIContext = createContext(null);

const MENTION_PATTERN = /\bspynx\b/i;

export function AIProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [listingId, setListingId] = useState(null);

  function trySummon(text) {
    if (MENTION_PATTERN.test(text)) {
      const cleaned = text.replace(MENTION_PATTERN, "").replace(/^[,:\s]+/, "").trim();
      setPendingMessage(cleaned || "Hey SPYNX, I need some help.");
      setOpen(true);
      return true;
    }
    return false;
  }

  function openWithMessage(text, forListingId) {
    if (forListingId !== undefined) setListingId(forListingId);
    setPendingMessage(text);
    setOpen(true);
  }

  return (
    <AIContext.Provider value={{ open, setOpen, pendingMessage, setPendingMessage, listingId, setListingId, trySummon, openWithMessage }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => useContext(AIContext);
