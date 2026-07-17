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
})
