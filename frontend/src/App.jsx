import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { LanguageProvider } from "./LanguageContext";
import { AIProvider } from "./AIContext";
import { VoiceProvider } from "./VoiceContext";
import { resolveUpload } from "./api";
import Splash from "./components/Splash";
import Navbar from "./components/Navbar";
import AIAssistant from "./components/AIAssistant";
import VoiceControl from "./components/VoiceControl";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import SellerDashboard from "./pages/SellerDashboard";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import LiveMap from "./pages/LiveMap";
import EmailVerify from "./pages/EmailVerify";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";

function UserBackgroundLayer() {
  const { user } = useAuth();
  if (!user?.background_url) return null;
  return <div className="user-bg-layer" style={{ backgroundImage: `url(${resolveUpload(user.background_url)})` }} />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AIProvider>
            <VoiceProvider>
              {showSplash && <Splash onDone={() => setShowSplash(false)} />}
              <UserBackgroundLayer />
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<LiveMap />} />
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/sell/new" element={<CreateListing />} />
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/verify/:token" element={<EmailVerify />} />
                    <Route path="/account" element={<Settings />} />
                  </Routes>
                </main>
                <footer className="border-t hairline mt-10">
                  <div className="max-w-7xl mx-auto px-5 py-8 text-center text-sand/40 text-xs">
                    SPYNXcomerce — phones, computers, accessories & electronics, worldwide. Say "Spynx" anytime for help.
                  </div>
                </footer>
                <AIAssistant />
                <VoiceControl />
              </div>
            </VoiceProvider>
          </AIProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
