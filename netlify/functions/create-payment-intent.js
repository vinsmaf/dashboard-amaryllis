const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY manquante" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide" }) }; }

  const { amount, currency = "eur", metadata = {} } = body;
  if (!amount || amount < 50) return { statusCode: 400, body: JSON.stringify({ error: "Montant invalide" }) };

  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    "automatic_payment_methods[enabled]": "true",
    "metadata[bienId]": metadata.bienId || "",
    "metadata[checkin]": metadata.checkin || "",
    "metadata[checkout]": metadata.checkout || "",
    "metadata[voyageur]": metadata.voyageur || "",
  }).toString();

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.stripe.com",
        path: "/v1/payment_intents",
        method: "POST",
        headers: {
          Authorization: `Bearer ${sk}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) });
          } else {
            resolve({
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientSecret: parsed.client_secret }),
            });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.write(payload);
    req.end();
  });
};
