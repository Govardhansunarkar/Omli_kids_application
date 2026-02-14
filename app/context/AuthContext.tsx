"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  googleLogin: (credential: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.message === "REGISTER_SUCCESS") {
        return { success: true, message: "Signup successful! Please login." };
      } else if (data.message === "USER_EXISTS") {
        return { success: false, message: "User already exists." };
      }
      return { success: false, message: "Signup failed." };
    } catch (error) {
      return { success: false, message: "Server error. Please try again." };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.message === "LOGIN_SUCCESS") {
        setToken(data.token);
        const userData = { 
          id: data.user?.id || "", 
          name: data.user?.name || email.split("@")[0], 
          email: data.user?.email || email 
        };
        setUser(userData);
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        return { success: true, message: "Login successful!" };
      } else if (data.message === "USER_NOT_FOUND") {
        return { success: false, message: "User not found. Please signup." };
      } else if (data.message === "WRONG_PASSWORD") {
        return { success: false, message: "Incorrect password." };
      } else if (data.message === "GOOGLE_ACCOUNT") {
        return { success: false, message: "This account uses Google. Please sign in with Google." };
      }
      return { success: false, message: "Login failed." };
    } catch (error) {
      return { success: false, message: "Server error. Please try again." };
    }
  };

  const googleLogin = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch("http://localhost:5000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });

      const data = await res.json();

      if (data.message === "LOGIN_SUCCESS") {
        setToken(data.token);
        const userData = { 
          id: data.user?.id || "", 
          name: data.user?.name || "User", 
          email: data.user?.email || "" 
        };
        setUser(userData);
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        return { success: true, message: "Google login successful!" };
      }
      return { success: false, message: data.message || "Google login failed." };
    } catch (error) {
      return { success: false, message: "Server error. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
