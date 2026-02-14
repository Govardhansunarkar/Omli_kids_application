"use client";
import { useState, useEffect, useMemo } from "react";
import LoginForm from "./loginForm";
import SignupForm from "./signupForm";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const stars = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    emoji: ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]
  })), []);

  const bubbles = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 20 + Math.random() * 40,
    delay: `${Math.random() * 8}s`,
    duration: `${8 + Math.random() * 4}s`
  })), []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const onLoginSuccess = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <span style={{ fontSize: "40px", marginBottom: "10px" }}>🐧</span>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      
      <div className="floating-elements">
        {stars.map((star) => (
          <span
            key={`star-${star.id}`}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay
            }}
          >
            {star.emoji}
          </span>
        ))}
        {bubbles.map((bubble) => (
          <div
            key={`bubble-${bubble.id}`}
            className="bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration
            }}
          />
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.logo}>🐧 Monu</div>
        
        {showLogin ? (
          <>
            <LoginForm onLoginSuccess={onLoginSuccess} />
            <p style={styles.switchText}>
              Don't have an account?{" "}
              <button style={styles.switchButton} onClick={() => setShowLogin(false)}>
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            <SignupForm switchToLogin={() => setShowLogin(true)} />
            <p style={styles.switchText}>
              Already have an account?{" "}
              <button style={styles.switchButton} onClick={() => setShowLogin(true)}>
                Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #f5d0fe 100%)",
    backgroundSize: "400% 400%",
    animation: "gradientShift 15s ease infinite",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "35px",
    borderRadius: "30px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: "360px",
    position: "relative",
    zIndex: 2,
    border: "3px solid rgba(255,255,255,0.6)",
  },
  logo: {
    fontSize: "1.8rem",
    textAlign: "center",
    marginBottom: "20px",
    background: "linear-gradient(135deg, #818cf8, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "800",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#a78bfa",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.2rem",
    background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)",
    color: "white",
  },
};