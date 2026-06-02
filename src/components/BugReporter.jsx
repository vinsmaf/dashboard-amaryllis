// Bouton flottant « Signaler un bug » — capture commentaire + screenshot best-effort
// → reportManualBug() → POST /api/client-errors (kind=report) → onglet 🐞 Bugs.
//
// La capture est prise AVANT d'ouvrir le panneau pour ne pas se photographier.
// html-to-image est importé dynamiquement (zéro poids sur le bundle principal).

import { useState, useCallback } from "react";
import { reportManualBug } from "../lib/bugCapture.js";

export default function BugReporter() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [shot, setShot] = useState(null);     // dataURL JPEG ou null
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const grab = useCallback(async () => {
    setDone(false);
    setOpen(true);
    setBusy(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const scale = Math.min(1, 900 / Math.max(window.innerWidth, 1));
      const data = await toJpeg(document.body, {
        quality: 0.5,
        pixelRatio: scale,
        cacheBust: true,
        skipFonts: true,
        filter: (node) => !(node?.dataset && node.dataset.bugReporter), // exclut ce widget
      });
      // garde-fou taille (~180 Ko base64 max côté serveur)
      setShot(data && data.length < 175_000 ? data : null);
    } catch {
      setShot(null); // capture impossible (images cross-origin) → report sans image
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(() => {
    reportManualBug({ comment: comment.trim(), screenshot: shot });
    setDone(true);
    setComment("");
    setShot(null);
    setTimeout(() => setOpen(false), 1400);
  }, [comment, shot]);

  const close = () => { setOpen(false); setComment(""); setShot(null); setDone(false); };

  return (
    <div data-bug-reporter="1" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9000 }}>
      {!open && (
        <button
          onClick={grab}
          title="Signaler un bug ou un souci d'affichage"
          style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px rgba(0,0,0,0.3)" }}>
          🐞 Signaler un bug
        </button>
      )}
      {open && (
        <div style={{ width: 300, background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14, boxShadow: "0 16px 50px rgba(0,0,0,0.5)", color: "#e2e8f0" }}>
          {done ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#34d399", padding: "8px 0", textAlign: "center" }}>✓ Merci, bug envoyé !</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>🐞 Signaler un bug</span>
                <button onClick={close} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                autoFocus
                placeholder="Que s'est-il passé ? (ex : le bas du calendrier est coupé)"
                style={{ width: "100%", boxSizing: "border-box", minHeight: 70, background: "#1e293b", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 8, fontSize: 12, resize: "vertical" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", fontSize: 11, color: "#94a3b8" }}>
                {busy ? "📸 Capture en cours…"
                  : shot ? <><img src={shot} alt="" style={{ width: 40, height: 26, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)" }} /> Capture jointe</>
                  : "⚠ Capture indisponible (envoi sans image)"}
              </div>
              <button
                onClick={submit}
                disabled={busy || (!comment.trim() && !shot)}
                style={{ width: "100%", background: (busy || (!comment.trim() && !shot)) ? "#334155" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: (busy || (!comment.trim() && !shot)) ? "default" : "pointer" }}>
                Envoyer
              </button>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 6, textAlign: "center" }}>URL & navigateur joints automatiquement</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
