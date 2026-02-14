"use client";

import { useEffect, useRef, useState } from "react";
import { askOmli } from "./actions";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function HomeContent() {
      const [audioUnlocked, setAudioUnlocked] = useState(false);
    const synthesizeAndAddToQueue = async (text: string) => {
      if (!ttsRef.current) {
        console.warn("TTS not ready");
        return;
      }
      try {
        await ttsRef.current.synthesizeAndAddToQueue(text);
        console.log("TTS synthesizeAndAddToQueue called for:", text);
      } catch (err) {
        console.error("TTS synthesizeAndAddToQueue failed:", err);
      }
    };
  const [status, setStatus] = useState("Initializing...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string, time: Date}[]>([]);
  const [metrics, setMetrics] = useState<{stt: number | null, ai: number | null, tts: number | null}>({stt: null, ai: null, tts: null});
  const sttStartRef = useRef<number | null>(null);
  const { user, logout } = useAuth();
  
  const sttRef = useRef<any>(null);
  const ttsRef = useRef<any>(null);
  const audioPlayerRef = useRef<any>(null);
  const handleConversationRef = useRef<((text: string) => Promise<void>) | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasGreetedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const IDLE_TIMEOUT = 15000;
  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const triggerIdlePrompt = async () => {
    if (isListening && !isSpeaking && ttsRef.current) {
      sttRef.current?.stop();
      setIsListening(false);
      
      const idlePrompt = "Hey! Want a story or a game?";
      setChatHistory(prev => [...prev, { role: 'assistant', text: idlePrompt, time: new Date() }]);
      
      try {
        console.log("Synthesizing idle prompt...");
        await synthesizeAndAddToQueue(idlePrompt);
        console.log("Idle audio added to queue");
      } catch (error) {
        console.error("Idle prompt error:", error);
        setStatus("idle");
      }
    }
  };

  useEffect(() => {
    if (isListening && !isSpeaking) {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        triggerIdlePrompt();
      }, IDLE_TIMEOUT);
    } else {
      clearIdleTimer();
    }

    return () => clearIdleTimer();
  }, [isListening, isSpeaking]);

  useEffect(() => {
    const saved = localStorage.getItem(`omli-chat-${user?.id || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed.map((msg: any) => ({ ...msg, time: new Date(msg.time) })));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`omli-chat-${user?.id || 'guest'}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (videoRef.current) {
      if (isSpeaking) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isSpeaking]);

  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    emoji: ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]
  }));

  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 20 + Math.random() * 40,
    delay: `${Math.random() * 8}s`,
    duration: `${8 + Math.random() * 4}s`
  }));

  const clouds = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    delay: `${Math.random() * 4}s`
  }));

  useEffect(() => {
    if (!audioUnlocked) return;
    async function init() {
      try {
        const { STTLogic, TTSLogic, sharedAudioPlayer } = await import("speech-to-speech");

        audioPlayerRef.current = sharedAudioPlayer;

        sharedAudioPlayer.setPlayingChangeCallback((playing) => {
          console.log("Audio playing state changed:", playing);
          setIsSpeaking(playing);
          setStatus(playing ? "speaking" : "idle");
          
          if (playing) {
            sttRef.current?.stop();
            setIsListening(false);
          }
        });

        ttsRef.current = new TTSLogic({ 
          voiceId: "en_US-hfc_female-medium", 
          warmUp: true 
        });
        await ttsRef.current.initialize();
        console.log("TTS initialized successfully");

        audioPlayerRef.current = sharedAudioPlayer;

        sttRef.current = new STTLogic(
          () => {}, 
          async (text) => {
            if (text.trim().length > 1) {
              const sttTime = sttStartRef.current ? Date.now() - sttStartRef.current : null;
              setMetrics(prev => ({ ...prev, stt: sttTime }));
              
              setIsListening(false);
              sttRef.current?.stop();
              await handleConversationRef.current?.(text);
            }
          }
        );

        setStatus("idle");

        if (!hasGreetedRef.current) {
          hasGreetedRef.current = true;
          const welcomeMsg = `Hey there! I'm Monu! Tap the mic to chat!`;
          
          setChatHistory(prev => [...prev, { role: 'assistant', text: welcomeMsg, time: new Date() }]);
          
          setTimeout(async () => {
            try {
              if (ttsRef.current) {
                console.log("Synthesizing welcome message...");
                await synthesizeAndAddToQueue(welcomeMsg);
                console.log("Welcome audio added to queue");
              }
            } catch (err) {
              console.error("Welcome TTS error:", err);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Init Error:", error);
        setStatus("Error loading Monu");
      }
    }
    init();

    return () => {
      sttRef.current?.stop();
      ttsRef.current?.dispose();
    };
  }, [audioUnlocked]);
  

  const handleConversation = async (userText: string) => {
    sttRef.current?.stop();
    setIsListening(false);
    setStatus("thinking");

    const updatedHistory = [...chatHistory, { role: 'user' as const, text: userText, time: new Date() }];
    setChatHistory(updatedHistory);

    try {
      const historyForAI = updatedHistory.map(msg => ({ role: msg.role, text: msg.text }));
      
      const aiStart = Date.now();
      const reply = await askOmli(userText, historyForAI);
      const aiTime = Date.now() - aiStart;
      setMetrics(prev => ({ ...prev, ai: aiTime }));
      
      setChatHistory(prev => [...prev, { role: 'assistant', text: reply, time: new Date() }]);
      
      if (!ttsRef.current) {
        console.error("TTS not initialized");
        setStatus("idle");
        return;
      }
      
      console.log("Synthesizing:", reply);
      
      const ttsStart = Date.now();
      await synthesizeAndAddToQueue(reply);
      const ttsTime = Date.now() - ttsStart;
      setMetrics(prev => ({ ...prev, tts: ttsTime }));
      console.log("Audio added to queue successfully");
      
    } catch (error) {
      console.error("Conversation Error:", error);
      setStatus("idle");
      setIsListening(false);
    }
  };

  const handleStop = async () => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        audioPlayerRef.current.clearQueue?.();
      }
      sttRef.current?.stop();
      setIsSpeaking(false);
      setIsListening(false);
      setStatus("idle");
    } catch (error) {
      console.error("Stop Error:", error);
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    
    localStorage.removeItem(`omli-chat-${user?.id || 'guest'}`);
    localStorage.removeItem('omli-chat-guest');
    
    if (user?.id) {
      localStorage.removeItem(`omli-chat-${user.id}`);
    }
    
    setSidebarOpen(false);
    clearIdleTimer();
    
    handleStop();
  };

  useEffect(() => {
    handleConversationRef.current = handleConversation;
  });

  return (
    <main style={styles.container}>
      {!audioUnlocked && (
        <div style={{position:'fixed',zIndex:9999,top:0,left:0,width:'100vw',height:'100vh',background:'rgba(255,255,255,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <h1 style={{fontSize:32,marginBottom:24}}>Welcome to Monu!</h1>
          <button style={{fontSize:24,padding:'16px 32px',borderRadius:12,background:'#a5b4fc',color:'#222',border:'none',cursor:'pointer'}} onClick={() => setAudioUnlocked(true)}>
            Start Monu
          </button>
          <p style={{marginTop:16,color:'#666'}}>Click to enable sound and start the app.</p>
        </div>
      )}
      
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
        {clouds.map((cloud) => (
          <span
            key={`cloud-${cloud.id}`}
            className="cloud"
            style={{
              left: cloud.left,
              top: cloud.top,
              animationDelay: cloud.delay
            }}
          >
            ☁️
          </span>
        ))}
      </div>

      
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>💬 Chat History</span>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="chat-messages">
          {chatHistory.length === 0 ? (
            <div className="no-chats">
              <span>🐧</span>
              <p>No conversations yet!</p>
              <p>Start talking to Monu</p>
            </div>
          ) : (
            <>
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <div className="chat-icon">{msg.role === 'user' ? '👤' : '🐧'}</div>
                  <div className="chat-content">
                    <p>{msg.text}</p>
                    <span className="chat-time">
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>
        {chatHistory.length > 0 && (
          <button className="clear-chat" onClick={handleReset}>
            🗑️ Clear History
          </button>
        )}
      </div>

      
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      
      <button className="chat-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span>💬</span>
        {chatHistory.length > 0 && <span className="chat-badge">{chatHistory.length}</span>}
      </button>

      

      
      <div className="header-container">
        <div className="user-badge">
          <span className="user-avatar">😊</span>
          <span className="user-name">Hi, {user?.name || "Friend"}!</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>👋</span> Logout
        </button>
      </div>

      <div className="main-card" style={styles.card}>
        
        <div className="mascot-circle" style={{
          ...styles.mascotCircle,
          boxShadow: isSpeaking ? "0 0 40px #A855F7" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          borderColor: isSpeaking ? "#A855F7" : "#E2E8F0",
          overflow: "hidden",
          padding: 0
        }}>
            <video
            ref={videoRef}
            src="/monu-talking.mp4"
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%"
            }}
          />
        </div>

        <h1 style={styles.title}>Monu</h1>
        
        <div style={styles.statusBadge}>
          <div style={{
            ...styles.dot, 
            backgroundColor: isSpeaking ? "#A855F7" : (isListening ? "#ef4444" : (status === "idle" ? "#10B981" : "#F59E0B"))
          }} />
          {isSpeaking ? "SPEAKING" : (isListening ? "LISTENING" : status.toUpperCase())}
        </div>

        <button 
          className="talk-btn"
          style={{
            ...styles.mainButton,
            background: isSpeaking ? "#d8b4fe" : (isListening ? "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)" : "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)"),
            cursor: isSpeaking ? "default" : "pointer"
          }}
          onClick={() => {
            if (isSpeaking) return;
            if (isListening) {
              sttRef.current?.stop();
              setIsListening(false);
              setStatus("idle");
              sttStartRef.current = null;
            } else {
              sttStartRef.current = Date.now();
              sttRef.current?.start();
              setIsListening(true);
              setStatus("listening");
            }
          }}
          disabled={isSpeaking || status === "Initializing..."}
        >
          {isSpeaking ? "Monu is talking..." : (isListening ? "Tap to Stop" : "Tap to Talk")}
        </button>

        
        <div className="action-buttons">
          <button 
            className="reset-btn"
            onClick={handleReset}
            disabled={status === "Initializing..."}
          >
            🔄 Reset
          </button>
          <button 
            className="stop-btn"
            onClick={handleStop}
            disabled={!isSpeaking}
          >
            ⏹️ Stop
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        
        /* Latency/metrics CSS removed */
        /* Header Styles */
        .header-container {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          z-index: 10;
        }
        
        .user-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 25px;
          border: 2px solid rgba(255,255,255,0.4);
          transition: all 0.3s ease;
        }
        
        .user-badge:hover {
          background: rgba(255,255,255,0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .user-avatar {
          font-size: 24px;
        }
        
        .user-name {
          color: white;
          font-weight: 600;
          font-size: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 25px;
          border: none;
          background: linear-gradient(135deg, #fca5a5, #f87171);
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(252, 165, 165, 0.4);
        }
        
        .logout-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 25px rgba(252, 165, 165, 0.5);
          background: linear-gradient(135deg, #f87171, #ef4444);
        }
        
        .logout-btn:active {
          transform: translateY(0) scale(0.98);
        }
        
        /* Card hover */
        .main-card {
          transition: all 0.3s ease;
        }
        
        .main-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3);
        }
        
        /* Button hover */
        .talk-btn {
          transition: all 0.3s ease;
        }
        
        .talk-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 30px -5px rgba(102, 126, 234, 0.6);
        }
        
        .talk-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        
        /* Action buttons (Reset & Stop) */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 15px;
          width: 100%;
        }
        
        .reset-btn, .stop-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 15px;
          border: none;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .reset-btn {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
        }
        
        .reset-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
        }
        
        .reset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .stop-btn {
          background: linear-gradient(135deg, #fca5a5, #f87171);
          color: white;
          box-shadow: 0 4px 15px rgba(252, 165, 165, 0.3);
        }
        
        .stop-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(252, 165, 165, 0.4);
        }
        
        .stop-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Mascot hover */
        .mascot-circle {
          transition: all 0.4s ease;
        }
        
        .mascot-circle:hover {
          transform: scale(1.05);
        }
        
        /* Chat Toggle Button */
        .chat-toggle {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%);
          color: white;
          font-size: 22px;
          cursor: pointer;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(45, 212, 191, 0.4);
          transition: all 0.3s ease;
        }
        
        .chat-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 30px rgba(45, 212, 191, 0.5);
        }
        
        .chat-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff6b6b;
          color: white;
          font-size: 12px;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 10px;
          min-width: 18px;
        }
        
        /* Chat Sidebar */
        .chat-sidebar {
          position: fixed;
          top: 0;
          left: -350px;
          width: 320px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 5px 0 30px rgba(0, 0, 0, 0.2);
          z-index: 200;
          transition: left 0.3s ease;
          display: flex;
          flex-direction: column;
          border-right: 3px solid rgba(102, 126, 234, 0.3);
        }
        
        .chat-sidebar.open {
          left: 0;
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px;
          background: linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%);
          color: white;
          font-size: 17px;
          font-weight: bold;
        }
        
        .close-sidebar {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        
        .close-sidebar:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .no-chats {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
          text-align: center;
        }
        
        .no-chats span {
          font-size: 60px;
          margin-bottom: 15px;
        }
        
        .no-chats p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .chat-bubble {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 15px;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .chat-bubble.user {
          background: linear-gradient(135deg, #e0e7ff, #ddd6fe);
          margin-left: 20px;
        }
        
        .chat-bubble.assistant {
          background: linear-gradient(135deg, #faf5ff, #f3e8ff);
          margin-right: 20px;
        }
        
        .chat-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .chat-content {
          flex: 1;
        }
        
        .chat-content p {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #333;
          line-height: 1.4;
        }
        
        .chat-time {
          font-size: 11px;
          color: #888;
        }
        
        .clear-chat {
          margin: 15px;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #fca5a5, #f87171);
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .clear-chat:hover {
          transform: scale(1.02);
          box-shadow: 0 5px 15px rgba(252, 165, 165, 0.4);
        }
        
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          z-index: 150;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
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
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "35px 30px",
    borderRadius: "40px",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "320px",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
    border: "3px solid rgba(255,255,255,0.6)"
  },
  mascotCircle: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    border: "8px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    transition: "all 0.4s ease",
    background: "linear-gradient(145deg, #faf5ff, #f3e8ff)"
  },
  title: {
    fontSize: "24px",
    background: "linear-gradient(135deg, #818cf8, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: "0 0 12px 0",
    fontWeight: "800"
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    padding: "6px 16px",
    borderRadius: "25px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: "25px",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)"
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%"
  },
  mainButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "20px",
    border: "none",
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
    boxShadow: "0 8px 20px -5px rgba(129, 140, 248, 0.4)"
  }
};