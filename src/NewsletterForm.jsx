// NewsletterForm — lead magnet newsletter (double opt-in RGPD)
// Props : source (string) — identifiant de la page (ex: "guide-sainte-anne")
//         theme (string) — "light" (défaut) | "dark"

import { useState } from "react";

export default function NewsletterForm({ source = "site", theme = "light" }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const dark = theme === "dark";
  const bg = dark ? "#1f2a3d" : "#f6f1e7";
  const card = dark ? "rgba(255,253,248,0.05)" : "#fffdf8";
  const border = dark ? "rgba(255,253,248,0.12)" : "#e8dfc9";
  const text = dark ? "#faf5e9" : "#1f2a3d";
  const muted = dark ? "rgba(250,245,233,0.6)" : "#6b7384";
  const inputBg = dark ? "rgba(255,253,248,0.08)" : "#fff";
  const inputBorder = dark ? "rgba(255,253,248,0.2)" : "#d6ccb8";

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), first_name: firstName.trim(), source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Une erreur est survenue, réessayez.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Erreur réseau, réessayez dans un instant.");
    }
  }

  return (
    <div style={{ background: bg, borderRadius: 14, border: `1px solid ${border}`, padding: "32px 28px", maxWidth: 540, margin: "0 auto" }}>
      {status === "success" ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: text, fontFamily: "Georgia, serif" }}>
            Vérifiez votre boîte mail
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: muted, lineHeight: 1.6 }}>
            Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour recevoir vos guides Martinique.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p style={{ margin: "0 0 6px", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", color: "#c47254", fontFamily: "Jost, sans-serif" }}>
            Guides &amp; bons plans
          </p>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: "normal", color: text, fontFamily: "Georgia, serif", lineHeight: 1.3 }}>
            Les secrets de la Martinique par vos hôtes
          </h3>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: muted, lineHeight: 1.6 }}>
            Plages secrètes, tortues, distilleries — nos guides exclusifs et les offres directes en avant-première.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              maxLength={80}
              style={{
                flex: "1 1 120px", minWidth: 100, padding: "11px 14px", borderRadius: 7,
                border: `1px solid ${inputBorder}`, background: inputBg, color: text,
                fontSize: 15, fontFamily: "Jost, sans-serif", outline: "none",
              }}
            />
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              maxLength={200}
              style={{
                flex: "2 1 200px", minWidth: 160, padding: "11px 14px", borderRadius: 7,
                border: `1px solid ${inputBorder}`, background: inputBg, color: text,
                fontSize: 15, fontFamily: "Jost, sans-serif", outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 7, border: "none",
              background: status === "loading" ? "#9aa3b5" : "#c47254",
              color: "#fffdf8", fontSize: 15, fontFamily: "Jost, sans-serif",
              letterSpacing: "0.5px", cursor: status === "loading" ? "default" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {status === "loading" ? "Envoi…" : "Recevoir les guides gratuitement"}
          </button>

          {status === "error" && (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "#e05c3a" }}>{errorMsg}</p>
          )}

          <p style={{ margin: "12px 0 0", fontSize: 11, color: muted, lineHeight: 1.5 }}>
            Pas de spam. Désabonnement en un clic. Vos données restent chez nous.
          </p>
        </form>
      )}
    </div>
  );
}
