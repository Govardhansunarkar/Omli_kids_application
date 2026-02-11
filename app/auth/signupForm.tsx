"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
      {msg && <p style={msgType === "error" ? styles.error : styles.success}>{msg}</p>}
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
  success: {
    color: "#22c55e",
    margin: "0",
    fontSize: "0.9rem",
  },
};
