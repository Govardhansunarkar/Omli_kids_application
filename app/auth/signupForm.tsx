"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface Props {
  switchToLogin: () => void;
}

export default function SignupForm({ switchToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"error" | "success">("error");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleGoogleSignup = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    // Full page redirect instead of popup
    window.location.href = authUrl;
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setMsg("Please fill in all fields.");
      setMsgType("error");
      return;
    }
    
    setIsLoading(true);
    setMsg("");
    
    const result = await signup(name, email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      setMsg(result.message);
      setMsgType("success");
      setTimeout(() => switchToLogin(), 1500);
    } else {
      setMsg(result.message);
      setMsgType("error");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create Account</h2>
      <input 
        style={styles.input}
        placeholder="Name" 
        value={name} 
        onChange={e => setName(e.target.value)} 
      />
      <input 
        style={styles.input}
        placeholder="Email" 
        type="email"
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <input 
        style={styles.input}
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <button 
        style={styles.button}
        onClick={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
      
      {GOOGLE_CLIENT_ID && (
        <>
          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>
          <button 
            style={styles.googleButton}
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </>
      )}
      
      {msg && <p style={msgType === "error" ? styles.error : styles.success}>{msg}</p>}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  title: {
    fontSize: "1.4rem",
    marginBottom: "8px",
    background: "linear-gradient(135deg, #818cf8, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "700",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "1rem",
    transition: "all 0.2s ease",
    outline: "none",
  },
  button: {
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)",
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    color: "#ef4444",
    margin: "0",
    fontSize: "0.9rem",
    textAlign: "center",
  },
  success: {
    color: "#22c55e",
    margin: "0",
    fontSize: "0.9rem",
    textAlign: "center",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    color: "#94a3b8",
    fontSize: "0.85rem",
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    backgroundColor: "white",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    color: "#374151",
  },
};
