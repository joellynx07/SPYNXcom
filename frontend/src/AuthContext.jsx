import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("spynx_user");
    if (saved) setUser(JSON.parse(saved));
    setReady(true);
  }, []);

  function login(token, user) {
    localStorage.setItem("spynx_token", token);
    localStorage.setItem("spynx_user", JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("spynx_token");
    localStorage.removeItem("spynx_user");
    setUser(null);
  }

  async function register(payload) {
    const data = await api.post("/auth/register", payload);
    login(data.token, data.user);
    return data;
  }

  async function signIn(payload) {
    const data = await api.post("/auth/login", payload);
    login(data.token, data.user);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, register, signIn }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
