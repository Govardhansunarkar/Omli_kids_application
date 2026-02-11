"use client";

import { useEffect, useRef, useState } from "react";
import { askOmli } from "./actions";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function HomeContent() {
  const [status, setStatus] = useState("Initializing...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user, logout } = useAuth();
  
  const sttRef = useRef<any>(null);
  const ttsRef = useRef<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const { STTLogic, TTSLogic, sharedAudioPlayer } = await import("speech-to-speech");

        // 1. Configure audio player with automatic mute/unmute logic
        sharedAudioPlayer.configure({ autoPlay: true, sampleRate: 22050 });

        sharedAudioPlayer.setPlayingChangeCallback((playing) => {
          setIsSpeaking(playing);
          setStatus(playing ? "speaking" : "idle");
          
          if (playing) {
            // Mute mic immediately when AI starts talking
            sttRef.current?.stop(); 
          } else {
            // Wait 500ms after AI finishes before listening again to avoid echo
            setTimeout(() => {
              if (sttRef.current) sttRef.current.start();
            }, 500);
          }
        });

        // 2. Setup TTS (Piper Neural Voice)
        ttsRef.current = new TTSLogic({ 
          voiceId: "en_US-hfc_female-medium", 
          warmUp: true 
        });
        await ttsRef.current.initialize();

        // 3. Setup STT (Speech to Text)
        sttRef.current = new STTLogic(
          () => {}, 
          async (text) => {
            // Ignore if AI is speaking or text is too short
            if (text.trim().length > 1 && !isSpeaking) {
              await handleConversation(text);
            }
          }
        );

        setStatus("idle");
      } catch (error) {
        console.error("Init Error:", error);
        setStatus("Error loading Omli");
      }
    }
    init();

    return () => {
      sttRef.current?.stop();
      ttsRef.current?.dispose();
    };
  }, []);

  const handleConversation = async (userText: string) => {
    // Stop mic immediately to prevent processing the prompt while thinking
    sttRef.current?.stop();
    setStatus("thinking");

    try {
      const reply = await askOmli(userText);
      
      const { sharedAudioPlayer } = await import("speech-to-speech");
      const result = await ttsRef.current.synthesize(reply);
      
      sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
    } catch (error) {
      console.error("Conversation Error:", error);
      setStatus("idle");
      sttRef.current?.start();
    }
  };

  return (
    <main style={styles.container}>
      {/* Header with user info and logout */}
      <div style={styles.header}>
        <span style={styles.greeting}>Hi, {user?.name || "Friend"}! 👋</span>
        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        {/* Mascot Circle with Glow effect when speaking */}
        <div style={{
          ...styles.mascotCircle,
          boxShadow: isSpeaking ? "0 0 40px #A855F7" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          borderColor: isSpeaking ? "#A855F7" : "#E2E8F0"
        }}>
          <span style={{
            fontSize: "90px",
            animation: isSpeaking ? "pulse 1.5s infinite ease-in-out" : "none",
            display: "inline-block"
          }}>
             🐧
          </span>
        </div>

        <h1 style={styles.title}>Omli Buddy</h1>
        
        <div style={styles.statusBadge}>
          <div style={{
            ...styles.dot, 
            backgroundColor: isSpeaking ? "#A855F7" : (status === "idle" ? "#10B981" : "#F59E0B")
          }} />
          {status.toUpperCase()}
        </div>

        <button 
          style={{
            ...styles.mainButton,
            backgroundColor: isSpeaking ? "#C084FC" : "#9333EA",
            cursor: isSpeaking ? "default" : "pointer"
          }}
          onClick={() => !isSpeaking && sttRef.current?.start()}
          disabled={isSpeaking || status === "Initializing..."}
        >
          {isSpeaking ? "Omli is talking..." : "Tap to Talk"}
        </button>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        body { margin: 0; background-color: #FAF5FF; }
      `}</style>
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

const styles: any = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif",
    position: "relative"
  },
  header: {
    position: "absolute",
    top: "20px",
    right: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },
  greeting: {
    fontSize: "16px",
    color: "#581C87",
    fontWeight: "600"
  },
  logoutButton: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "2px solid #A855F7",
    backgroundColor: "white",
    color: "#A855F7",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  card: {
    backgroundColor: "white",
    padding: "50px 40px",
    borderRadius: "50px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "380px",
    textAlign: "center"
  },
  mascotCircle: {
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    border: "10px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "25px",
    transition: "all 0.4s ease",
    backgroundColor: "#F3E8FF"
  },
  title: {
    fontSize: "28px",
    color: "#581C87",
    margin: "0 0 15px 0",
    fontWeight: "800"
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#F1F5F9",
    padding: "8px 20px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: "40px"
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%"
  },
  mainButton: {
    width: "100%",
    padding: "20px",
    borderRadius: "25px",
    border: "none",
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 15px -3px rgba(147, 51, 234, 0.4)"
  }
};