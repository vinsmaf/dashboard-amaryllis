// functions/api/beds24-manage.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost } from "./beds24-manage.js";

function req(body) {
  return new Request("https://villamaryllis.com/api/beds24-manage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function baseEnv() {
  return {
    BEDS24_TOKEN: "b24-token",
    STRIPE_SECRET_KEY: "sk_test_xxx",
    revenue_manager: null, // rateLimit fail-open sans D1
  };
}

describe("beds24-manage — action confirm (anti-fraude Stripe)", () => {
  let fetchMock;
  beforeEach(() => { fetchMock = vi.fn(); global.fetch = fetchMock; });

  it("refuse sans paymentIntentId", async () => {
    const res = await onRequestPost({ request: req({ action: "confirm", bookingId: "123" }), env: baseEnv() });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse si le PaymentIntent Stripe n'existe pas", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: "No such payment_intent" } }) });
    const res = await onRequestPost({
      request: req({ action: "confirm", bookingId: "123", paymentIntentId: "pi_fake" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/introuvable/i);
  });

  it("refuse si le paiement n'est pas succeeded", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "pi_1", status: "requires_payment_method", metadata: { beds24Id: "123" } }),
    });
    const res = await onRequestPost({
      request: req({ action: "confirm", bookingId: "123", paymentIntentId: "pi_1" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/non confirmé/i);
  });

  it("refuse si le PaymentIntent réussi ne correspond pas à ce bookingId (anti-rejeu)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "pi_1", status: "succeeded", metadata: { beds24Id: "999" } }),
    });
    const res = await onRequestPost({
      request: req({ action: "confirm", bookingId: "123", paymentIntentId: "pi_1" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/ne correspond pas/i);
  });

  it("confirme quand le paiement succeeded correspond au bookingId (flow légitime)", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "pi_1", status: "succeeded", metadata: { beds24Id: "123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      });
    const res = await onRequestPost({
      request: req({ action: "confirm", bookingId: "123", paymentIntentId: "pi_1" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe("confirmed");
    // 1er appel = vérif Stripe, 2e = PUT Beds24
    expect(fetchMock.mock.calls[0][0]).toContain("api.stripe.com/v1/payment_intents/pi_1");
    expect(fetchMock.mock.calls[1][0]).toContain("beds24.com");
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
  });

  it("accepte aussi la correspondance via metadata.bookingId (pas seulement beds24Id)", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "pi_1", status: "succeeded", metadata: { bookingId: "123" } }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ success: true }) });
    const res = await onRequestPost({
      request: req({ action: "confirm", bookingId: "123", paymentIntentId: "pi_1" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(200);
  });
});

describe("beds24-manage — action cancel (anti-IDOR)", () => {
  let fetchMock;
  beforeEach(() => { fetchMock = vi.fn(); global.fetch = fetchMock; });

  it("refuse sans email ni lastName", async () => {
    const res = await onRequestPost({ request: req({ action: "cancel", bookingId: "123" }), env: baseEnv() });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse si la réservation n'est pas retrouvée chez Beds24", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) });
    const res = await onRequestPost({
      request: req({ action: "cancel", bookingId: "123", email: "guest@example.com" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(404);
  });

  it("refuse si l'email fourni ne correspond pas au voyageur réel (IDOR bloqué)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [{ id: "123", email: "vrai@voyageur.com", lastName: "Dupont" }] }),
    });
    const res = await onRequestPost({
      request: req({ action: "cancel", bookingId: "123", email: "attaquant@evil.com" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(403);
  });

  it("annule quand l'email correspond (flow légitime — fermeture modal sans payer)", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [{ id: "123", email: "vrai@voyageur.com", lastName: "Dupont" }] }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ success: true }) });
    const res = await onRequestPost({
      request: req({ action: "cancel", bookingId: "123", email: "Vrai@Voyageur.com" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("cancelled");
  });

  it("annule quand seul le lastName correspond (email absent côté client)", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [{ id: "123", email: "vrai@voyageur.com", lastName: "Dupont" }] }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ success: true }) });
    const res = await onRequestPost({
      request: req({ action: "cancel", bookingId: "123", lastName: "dupont" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(200);
  });
});

describe("beds24-manage — actions inchangées", () => {
  let fetchMock;
  beforeEach(() => { fetchMock = vi.fn(); global.fetch = fetchMock; });

  it("find() fonctionne toujours sans vérification additionnelle", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: "123", email: "a@b.com", firstName: "Jean", lastName: "Dupont", status: "new", price: 100 }],
      }),
    });
    const res = await onRequestPost({
      request: req({ action: "find", email: "a@b.com" }),
      env: baseEnv(),
    });
    expect(res.status).toBe(200);
  });

  it("restoreGuest (admin) refuse toujours sans Bearer", async () => {
    const res = await onRequestPost({
      request: req({ action: "restoreGuest", bookingId: "1", firstName: "A", lastName: "B", price: 100 }),
      env: baseEnv(),
    });
    expect(res.status).toBe(401);
  });
});
