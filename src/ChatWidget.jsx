// ChatWidget.jsx — Assistant virtuel Amaryllis (Grok / xAI)
// Flottant bottom-right sur toutes les pages publiques

import { useState, useRef, useEffect, useCallback } from "react";

const NAVY   = "#0e3b3a";
const CORAL  = "#c47254";
const IVORY  = "#faf5e9";
const SAND   = "#e8dcc8";
const MUTED  = "#7a6e61";

const WELCOME = "Bonjour 👋 Je suis l'assistant Amaryllis. Je peux vous aider à choisir votre villa, répondre à vos questions sur Martinique, les disponibilités ou la réservation directe. Comment puis-je vous aider ?";

const SUGGESTIONS = [
  "Quelle villa pour 6 personnes ?",
  "C'est quoi la meilleure saison ?",
  "Avantages réservation directe",
  "Différence Amaryllis et Zandoli ?",
];

export default function ChatWidget() {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([{ role: "assistant", content: WELCOME }]);
  const [suggestions, setSuggestions] = useState(SUGGESTIONS); // suggestions courantes
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Scroll to bottom à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    // GA4 — track chat_message_sent (longueur message + page)
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      try {
        window.gtag("event", "chat_message_sent", {
          message_length: content.length,
          page_path: window.location.pathname,
          is_suggestion: !!text,
        });
      } catch { /* silent */ }
    }

    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestions([]); // efface les suggestions pendant la réponse
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== "system").slice(-10),
          mode: "public",
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        setSuggestions(data.suggestions || []);
        if (!open) setUnread(u => u + 1);
      } else {
        const errMsg = data.error || `HTTP ${res.status} — réponse vide`;
        console.error("[ChatWidget] API error:", errMsg);
        setMessages(prev => [...prev, { role: "assistant", content: `⚠ Erreur : ${errMsg}` }]);
      }
    } catch (e) {
      console.error("[ChatWidget] fetch error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: `⚠ Erreur réseau : ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, open]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 9990,
          width: "min(380px, calc(100vw - 32px))",
          background: IVORY,
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(14,59,58,0.18), 0 4px 16px rgba(14,59,58,0.1)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          border: `1px solid ${SAND}`,
          animation: "fadeIn 0.2s ease",
          maxHeight: "min(560px, calc(100vh - 120px))",
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                border: `1.5px solid ${CORAL}`,
                overflow: "hidden", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(14,59,58,0.3)",
              }}>
                <img src="/photos/assistant.png" alt="Assistante Amaryllis"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: IVORY, letterSpacing: "0.04em" }}>
                  Assistant Amaryllis
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: "rgba(250,245,233,0.6)", letterSpacing: "0.04em" }}>En ligne · répond en quelques secondes</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(250,245,233,0.7)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 8px", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end", gap: 6,
              }}>
                {m.role === "assistant" && (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${SAND}`, overflow: "hidden", flexShrink: 0, marginBottom: 2 }}>
                    <img src="/photos/assistant.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
                  </div>
                )}
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  background: m.role === "user"
                    ? `linear-gradient(135deg, ${CORAL} 0%, #b56344 100%)`
                    : "#fff",
                  color: m.role === "user" ? "#fff" : "#3d3530",
                  fontSize: 13, lineHeight: 1.65,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  boxShadow: m.role === "user"
                    ? "0 2px 8px rgba(196,114,84,0.3)"
                    : "0 1px 4px rgba(14,59,58,0.08)",
                  border: m.role === "assistant" ? `1px solid ${SAND}` : "none",
                  whiteSpace: "pre-wrap",
                }}>
                  {/* Rendu enrichi : liens cliquables + formatage léger */}
                  {m.content.split("\n").map((line, li, arr) => {
                    const isHr    = line.startsWith("─") || line.trim() === "---";
                    const isTotal = /total estimé|total :/i.test(line);
                    if (isHr) return <span key={li} style={{ display: "block", borderTop: `1px solid ${SAND}`, margin: "6px 0" }} />;
                    // Parser les liens villamaryllis.com/xxx dans chaque ligne
                    const linkRe = /(villamaryllis\.com\/[\w-]*)/g;
                    const parts  = line.split(linkRe);
                    const rendered = parts.map((p, pi) =>
                      linkRe.test(p)
                        ? <a key={pi} href={`https://${p}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: CORAL, textDecoration: "none", fontWeight: 600, borderBottom: `1px solid ${CORAL}44` }}
                            onMouseEnter={e => e.currentTarget.style.borderBottomColor = CORAL}
                            onMouseLeave={e => e.currentTarget.style.borderBottomColor = `${CORAL}44`}
                          >{p} →</a>
                        : <span key={pi} style={isTotal ? { fontWeight: 700, color: CORAL } : {}}>{p}</span>
                    );
                    return (
                      <span key={li}>
                        {rendered}
                        {li < arr.length - 1 && "\n"}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${SAND}`, overflow: "hidden", flexShrink: 0 }}>
                  <img src="/photos/assistant.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%", transform: "scale(2.0)", transformOrigin: "52% 10%" }} />
                </div>
                <div style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: "4px 16px 16px 16px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(14,59,58,0.08)" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: "50%", background: CORAL,
                        animation: "skeletonPulse 1.2s ease-in-out infinite",
                        animationDelay: `${delay}s`,
                        display: "inline-block",
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions — initiales ou générées par l'IA après chaque réponse */}
          {!loading && suggestions.length > 0 && (
            <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0, animation: "fadeIn 0.3s ease" }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "5px 10px", borderRadius: 20,
                    border: `1px solid ${SAND}`,
                    background: "#fff", color: MUTED,
                    fontSize: 11, fontFamily: "'Jost', sans-serif",
                    cursor: "pointer", transition: "all 0.15s",
                    letterSpacing: "0.02em", textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = IVORY; e.currentTarget.style.borderColor = NAVY; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = SAND; }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 14px 14px",
            borderTop: `1px solid ${SAND}`,
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "#fff", flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question…"
              rows={1}
              style={{
                flex: 1, resize: "none", border: `1px solid ${SAND}`,
                borderRadius: 12, padding: "9px 12px",
                fontSize: 13, fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: "#3d3530", background: IVORY,
                outline: "none", lineHeight: 1.5,
                maxHeight: 80, overflowY: "auto",
              }}
              onFocus={e => e.target.style.borderColor = CORAL}
              onBlur={e => e.target.style.borderColor = SAND}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: "50%", border: "none",
                background: (!input.trim() || loading) ? SAND : `linear-gradient(135deg, ${CORAL} 0%, #b56344 100%)`,
                color: (!input.trim() || loading) ? MUTED : "#fff",
                cursor: (!input.trim() || loading) ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s", flexShrink: 0,
                boxShadow: (!input.trim() || loading) ? "none" : "0 2px 8px rgba(196,114,84,0.35)",
              }}
            >↑</button>
          </div>

          {/* Footer discret */}
          <div style={{ textAlign: "center", padding: "0 14px 10px", fontSize: 9, color: MUTED, fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em", background: "#fff" }}>
            Propulsé par IA · Réponses indicatives — <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL, textDecoration: "none" }}>contact@villamaryllis.com</a>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9991,
          width: 58, height: 58, borderRadius: "50%", border: "none",
          background: open ? NAVY : `linear-gradient(135deg, ${CORAL} 0%, #b56344 100%)`,
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: open ? 22 : 26,
          boxShadow: "0 4px 20px rgba(14,59,58,0.25), 0 2px 8px rgba(0,0,0,0.12)",
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "rotate(0deg) scale(1)" : "scale(1)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {open ? "×" : "💬"}
        {/* Badge non-lu */}
        {!open && unread > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 18, height: 18, borderRadius: "50%",
            background: "#22c55e", color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>{unread}</span>
        )}
      </button>
    </>
  );
}
