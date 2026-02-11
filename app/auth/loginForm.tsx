"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("Please fill in all fields.");
      return;
    }
    
    setIsLoading(true);
    setMsg("");
    
    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      setMsg(result.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome Back</h2>
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
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {msg && <p style={styles.error}>{msg}</p>}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    fontSize: "1.5rem",
    marginBottom: "8px",
    color: "#333",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#A855F7",
    color: "white",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    color: "#ef4444",
    margin: "0",
    fontSize: "0.9rem",
  },
};
