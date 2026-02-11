"use client";
import { useState, useEffect } from "react";
import LoginForm from "./loginForm";
import SignupForm from "./signupForm";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect to main page if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const onLoginSuccess = () => {
    router.push("/"); // redirect to AI assistant
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.logo}>🤖 Omli AI</div>
        
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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    width: "100%",
    maxWidth: "400px",
  },
  logo: {
    fontSize: "2rem",
    textAlign: "center",
    marginBottom: "24px",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#A855F7",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.2rem",
  },
};
