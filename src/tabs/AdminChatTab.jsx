/**
 * AdminChatTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { ADMIN_SHORTCUTS } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function AdminChatTab() {
  const { biens = [], reservations = [], addToast = () => {} } = useAppData();
  const [messages,    setMessages]    = useState([{ role: "assistant", content: "Bonjour 👋 Je suis votre assistant IA Amaryllis. Je peux vous aider à rédiger des emails, analyser vos performances, créer du contenu marketing, ou répondre à toute question de gestion locative. Par quoi commençons-nous ?" }]);
  const [suggestions, setSuggestions] = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Contexte admin injecté dans chaque message
  const buildContext = useCallback(() => {
    const totalResas = reservations.length;
    const upcoming = reservations.filter(r => r.checkin >= new Date().toISOString().slice(0,10)).slice(0, 5);
    return `\n\n[CONTEXTE ADMIN]\nBiens : ${biens.map(b => `${b.nom} (${b.id})`).join(", ")}\nTotal réservations : ${totalResas}\nProchaines arrivées : ${upcoming.map(r => `${r.voyageur} → ${r.bienId} le ${r.checkin}`).join(" | ") || "aucune"}`;
  }, [biens, reservations]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestions([]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m, i) =>
            i === 0 ? { ...m, content: m.content + buildContext() } : m
          ).slice(-12),
          mode: "admin",
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        setSuggestions(data.suggestions || []);
      } else {
        addToast(data.error || "Erreur assistant IA", "error");
      }
    } catch (e) {
      addToast(`Erreur réseau : ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, buildContext, addToast]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Rendu d'une ligne avec liens cliquables
  const renderLine = (line, li, arr) => {
    const linkRe = /(villamaryllis\.com\/[\w-]*)/g;
    const parts = line.split(linkRe);
    const isTotal = /total estimé|total :/i.test(line);
    const isHr = line.startsWith("─") || line.trim() === "---";
    if (isHr) return <span key={li} style={{ display: "block", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />;
    return (
      <span key={li}>
        {parts.map((p, pi) => linkRe.test(p)
          ? <a key={pi} href={`https://${p}`} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none", borderBottom: "1px solid rgba(56,189,248,0.3)" }}>{p} →</a>
          : <span key={pi} style={isTotal ? { fontWeight: 700, color: "#a3e635" } : {}}>{p}</span>
        )}
        {li < arr.length - 1 && "\n"}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", height: "calc(100vh - 140px)", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(167,139,250,0.4)", flexShrink: 0 }}>
          <img src="/photos/assistant.webp" alt="Assistant IA" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>✨ Assistant IA — Mode Admin</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Powered by Groq · Connait vos biens, vos réservations et votre activité</div>
        </div>
        <button onClick={() => { setMessages([{ role: "assistant", content: "Conversation réinitialisée. Comment puis-je vous aider ?" }]); setSuggestions([]); }}
          style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 7, border: "1px solid #334155", background: "none", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
          🗑 Effacer
        </button>
      </div>

      {/* Raccourcis */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {ADMIN_SHORTCUTS.map(s => (
          <button key={s.label} onClick={() => sendMessage(s.prompt)}
            style={{ padding: "5px 11px", borderRadius: 20, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.07)", color: "#a78bfa", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,0.18)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(167,139,250,0.07)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)"; }}
          >
            <span>{s.icon}</span><span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: "auto", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(167,139,250,0.3)", flexShrink: 0 }}>
                <img src="/photos/assistant.webp" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
              </div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1e293b",
              color: "#e2e8f0", fontSize: 13, lineHeight: 1.65,
              border: m.role === "assistant" ? "1px solid #334155" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {m.content.split("\n").map((line, li, arr) => renderLine(line, li, arr))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(167,139,250,0.3)", flexShrink: 0 }}>
              <img src="/photos/assistant.webp" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "4px 16px 16px 16px", padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "skeletonPulse 1.2s ease-in-out infinite", animationDelay: `${d}s` }} />)}
              </div>
            </div>
          </div>
        )}
        {/* Suggestions IA */}
        {!loading && suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 4 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{ padding: "5px 11px", borderRadius: 20, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#334155"; e.currentTarget.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#94a3b8"; }}
              >{s}</button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question, demandez un email, une analyse… (Entrée pour envoyer)"
          rows={2}
          style={{ flex: 1, resize: "none", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e2e8f0", background: "#0f172a", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", fontFamily: "system-ui, sans-serif" }}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e => e.target.style.borderColor = "#334155"}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: (!input.trim() || loading) ? "#1e293b" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", cursor: (!input.trim() || loading) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "all 0.2s" }}>
          ↑
        </button>
      </div>
    </div>
  );
}
