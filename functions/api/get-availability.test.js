/**
 * get-availability.js — anti-surbooking sur feed iCal dégradé.
 *
 * Enjeu (Stripe est en LIVE) : quand un feed Airbnb/Booking tombe, `fetchIcal` renvoie null et le
 * canal retombe sur un Set VIDE — ses nuits réservées disparaissent de `blockedDates`, et la
 * réponse reste un 200 tout à fait normal. Si ce résultat part en cache 6 h, le calendrier public
 * ET le re-check pré-paiement affichent « libre » sur des nuits déjà vendues pendant tout ce temps.
 *
 * Ces tests figent les deux garanties : un résultat dégradé est SERVI (les résas directes y sont)
 * mais JAMAIS mis en cache, et il est signalé par `degraded:true`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onRequest } from './get-availability.js'

const ICS = (dtstart, dtend) =>
  `BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:${dtstart}\nDTEND;VALUE=DATE:${dtend}\nEND:VEVENT\nEND:VCALENDAR`

function makeEnv(kvPut = vi.fn(async () => {})) {
  return {
    ICAL_ZANDOLI: 'https://www.airbnb.com/calendar/ical/zandoli.ics',
    ICAL_BOOKING_ZANDOLI: 'https://ics.booking.com/zandoli.ics',
    AVAIL_CACHE: { get: vi.fn(async () => null), put: kvPut },
    // Pas de binding D1 → fetchDirectBlocked renvoie un Set vide sans toucher au réseau.
    revenue_manager: null,
  }
}

const ctx = (env) => ({ request: new Request('https://villamaryllis.com/api/get-availability?bienId=zandoli'), env })

describe('get-availability · feed dégradé', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('cas nominal : les 2 feeds répondent → dates bloquées fusionnées, non dégradé, MIS en cache', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(
      String(url).includes('airbnb') ? ICS('20260801', '20260803') : ICS('20260901', '20260902'),
      { status: 200 },
    )))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    expect(d.degraded).toBe(false)
    expect(d.blockedDates).toContain('2026-08-01') // Airbnb
    expect(d.blockedDates).toContain('2026-09-01') // Booking
    expect(put).toHaveBeenCalledTimes(1) // résultat complet → cache légitime
  })

  it("feed Airbnb KO (HTTP 500) → servi mais JAMAIS mis en cache, et signalé degraded", async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) =>
      String(url).includes('airbnb')
        ? new Response('boom', { status: 500 })
        : new Response(ICS('20260901', '20260902'), { status: 200 }),
    ))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    expect(d.degraded).toBe(true)
    expect(d.sources.airbnb.ok).toBe(false)
    expect(d.sources.booking.ok).toBe(true)
    expect(d.blockedDates).toContain('2026-09-01') // Booking reste servi
    expect(put).not.toHaveBeenCalled()             // ← le cœur : pas de mensonge figé 6h
  })

  it('feed qui répond 200 mais pas de l’iCal (page de maintenance) → dégradé, pas de cache', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) =>
      String(url).includes('airbnb')
        ? new Response('<html>maintenance</html>', { status: 200 }) // 200 mais aucun VCALENDAR
        : new Response(ICS('20260901', '20260902'), { status: 200 }),
    ))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    expect(d.degraded).toBe(true)
    expect(put).not.toHaveBeenCalled()
  })

  it('les 2 feeds KO → blockedDates vide MAIS degraded:true (≠ "tout est libre")', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 503 })))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    // C'est le scénario du surbooking : sans `degraded`, l'appelant croit toutes les nuits libres.
    expect(d.blockedDates).toEqual([])
    expect(d.degraded).toBe(true)
    expect(put).not.toHaveBeenCalled()
  })

  it("feed qui RÉPOND avec un VCALENDAR valide mais dont le format VEVENT a changé → degraded, pas de cache (2026-07-18)", async () => {
    // Le cas subtil que le degraded 'muet' NE couvrait PAS : le feed a des VEVENT, mais le
    // parseur n'en tire aucune nuit (DTSTART/DTEND dans un format que le regex ne reconnaît plus).
    // Sans ce garde-fou : blockedDates amputé des résas Airbnb, servi comme « libre » → surbooking.
    const VEVENT_FORMAT_CASSE =
      'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:2026-08-01T14:00:00Z\nDTEND:2026-08-03T10:00:00Z\nEND:VEVENT\nEND:VCALENDAR'
    vi.stubGlobal('fetch', vi.fn(async (url) =>
      String(url).includes('airbnb')
        ? new Response(VEVENT_FORMAT_CASSE, { status: 200 })      // 200, VCALENDAR ok, mais 0 nuit parsée
        : new Response(ICS('20260901', '20260902'), { status: 200 }),
    ))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    expect(d.sources.airbnb.ok).toBe(true)        // le feed a bien répondu (VCALENDAR présent)
    expect(d.sources.airbnb.count).toBe(0)        // mais 0 nuit extraite
    expect(d.sources.airbnb.suspect).toBe(true)   // ← détecté comme parser mort
    expect(d.degraded).toBe(true)                 // → le re-check pré-paiement refusera de conclure
    expect(put).not.toHaveBeenCalled()            // jamais figé 6h
  })

  it("feed légitimement VIDE (0 VEVENT, bien sans résa ce canal) → NON dégradé, mis en cache", async () => {
    // Ne pas confondre « parser mort » avec « aucune réservation » : un feed sans VEVENT est normal.
    vi.stubGlobal('fetch', vi.fn(async (url) =>
      String(url).includes('airbnb')
        ? new Response('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', { status: 200 }) // vide légitime
        : new Response(ICS('20260901', '20260902'), { status: 200 }),
    ))
    const put = vi.fn(async () => {})
    const res = await onRequest(ctx(makeEnv(put)))
    const d = await res.json()

    expect(d.sources.airbnb.ok).toBe(true)
    expect(d.sources.airbnb.suspect).toBe(false)  // pas de VEVENT → pas suspect
    expect(d.degraded).toBe(false)                // sinon on bloquerait la vente à tort
    expect(d.blockedDates).toContain('2026-09-01')
    expect(put).toHaveBeenCalledTimes(1)          // résultat sain → cache légitime
  })
})
