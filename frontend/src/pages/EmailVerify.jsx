import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function EmailVerify() {
  const { token } = useParams();
  const { login } = useAuth();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/auth/verify/${token}`)
      .then((data) => {
        login(data.token, data.user);
        setStatus("success");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <div className="glass-card rounded-2xl p-8">
        <img src="/spynx-logo.png" alt="SPYNX" className="w-14 h-14 object-contain mx-auto mb-3" />
        {status === "verifying" && <p className="text-sand/60">Verifying your email…</p>}
        {status === "success" && (
          <>
            <h1 className="font-display text-xl gold-text mb-2">You're verified!</h1>
            <p className="text-sand/60 text-sm mb-6">You can now list items and buy on SPYNXcomerce.</p>
            <Link to="/" className="inline-block bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full px-6 py-2.5">
              Go to marketplace
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-xl text-red-300 mb-2">Verification failed</h1>
            <p className="text-sand/60 text-sm mb-6">{error}</p>
            <Link to="/account" className="inline-block border hairline hover:border-gold rounded-full px-6 py-2.5">
              Request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
