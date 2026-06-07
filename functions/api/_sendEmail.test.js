// functions/api/_sendEmail.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "./_sendEmail.js";

function mockD1() {
  const inserts = [];
  return {
    inserts,
    prepare: vi.fn(() => ({
      bind: vi.fn(function (...args) {
        this._args = args;
        return this;
      }),
      run: vi.fn(async function () {
        inserts.push(this._args);
        return { success: true };
      }),
    })),
  };
}

describe("sendEmail helper", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it("envoie via Resend et log en D1 en cas de succès", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "resend_abc123" }),
    });
    const db = mockD1();
    const env = { RESEND_API_KEY: "key", revenue_manager: db };

    const result = await sendEmail(env, {
      to: "client@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      template: "test",
      category: "client",
      booking_id: "pi_xyz",
    });

    expect(result.ok).toBe(true);
    expect(result.resendId).toBe("resend_abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
    expect(db.inserts).toHaveLength(1);
    const args = db.inserts[0];
    expect(args[2]).toBe("client@example.com"); // to_email
    expect(args[4]).toBe("Hello");               // subject
    expect(args[5]).toBe("test");                // template
    expect(args[6]).toBe("client");              // category
    expect(args[8]).toBe("pi_xyz");              // booking_id
    expect(args[11]).toBe("sent");               // status
  });

  it("log en D1 même si Resend échoue", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Domain not verified" }),
    });
    const db = mockD1();
    const env = { RESEND_API_KEY: "key", revenue_manager: db };

    const result = await sendEmail(env, {
      to: "x@y.com",
      subject: "X",
      html: "<p></p>",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Domain not verified");
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0][11]).toBe("failed");    // status
    expect(db.inserts[0][12]).toBe("Domain not verified"); // error
  });

  it("n'échoue pas si D1 plante", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ok" }),
    });
    const env = {
      RESEND_API_KEY: "key",
      revenue_manager: {
        prepare: () => { throw new Error("D1 down"); },
      },
    };

    const result = await sendEmail(env, {
      to: "x@y.com",
      subject: "X",
      html: "<p></p>",
    });

    expect(result.ok).toBe(true); // envoi OK même si log échoue
  });

  it("category par défaut = 'client'", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "ok" }) });
    const db = mockD1();
    const env = { RESEND_API_KEY: "key", revenue_manager: db };

    await sendEmail(env, { to: "x@y.com", subject: "X", html: "<p></p>" });

    expect(db.inserts[0][6]).toBe("client");
  });

  it("accepte un tableau pour to_email et le join avec virgules", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "ok" }) });
    const db = mockD1();
    const env = { RESEND_API_KEY: "key", revenue_manager: db };

    await sendEmail(env, {
      to: ["a@x.com", "b@x.com"],
      subject: "S",
      html: "<p></p>",
    });

    expect(db.inserts[0][2]).toBe("a@x.com,b@x.com");
  });
});
