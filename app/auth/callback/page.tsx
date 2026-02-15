"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");
  
  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        setStatus("Login cancelled");
        setTimeout(() => router.push('/auth'), 2000);
        return;
      }
      
      if (!code) {
        setStatus("No auth code received");
        setTimeout(() => router.push('/auth'), 2000);
        return;
      }
      
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await res.json();
        
        if (data.message === "LOGIN_SUCCESS") {
          // Save to localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify({
            id: data.user?.id || "",
            name: data.user?.name || "User",
            email: data.user?.email || ""
          }));
          
          setStatus("Login successful! Redirecting...");
          
          // Redirect to main app
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setStatus(data.message || "Login failed");
          setTimeout(() => router.push('/auth'), 2000);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setStatus("Server error. Please try again.");
        setTimeout(() => router.push('/auth'), 2000);
      }
    };
    
    handleAuth();
  }, [searchParams, router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #f5d0fe 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '20px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: '40px' }}>🔄</span>
        <p style={{ marginTop: '15px', color: '#6b7280' }}>{status}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #f5d0fe 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '40px' }}>🔄</span>
          <p style={{ marginTop: '15px', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
