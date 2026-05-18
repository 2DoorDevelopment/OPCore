import { cacheGet, cacheSet, TTL } from './cache'

const BASE = 'https://api.uexcorp.space/2.0'

export interface UexCommodity {
  id: number
  name: string
  code: string
  kind: string
  trade_price_buy: number
  trade_price_sell: number
}

export interface UexCommodityPrice {
  id_terminal: number
  id_commodity: number
  price_buy: number
  price_sell: number
  scu_buy: number
  scu_sell: number
  terminal_name: string
  terminal_code: string
  planet_name: string
  moon_name: string | null
  city_name: string | null
  faction_name: string | null
}

export interface UexTerminal {
  id: number
  name: string
  code: string
  type: string
  planet_name: string
  moon_name: string | null
  city_name: string | null
  faction_name: string | null
  is_available: number
}

async function uexFetch<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid UEX API token.')
    throw new Error(`UEX API error: ${res.status}`)
  }
  const json = await res.json()
  // UEX wraps responses in { data: [...] }
  return (json.data ?? json) as T
}

export async function getCommodities(token: string): Promise<UexCommodity[]> {
  const key = 'uex:commodities'
  const cached = await cacheGet<UexCommodity[]>(key)
  if (cached) return cached
  const data = await uexFetch<UexCommodity[]>('/commodities', token)
  await cacheSet(key, data, TTL.ONE_DAY)
  return data
}

export async function getCommodityPrices(token: string): Promise<UexCommodityPrice[]> {
  const key = 'uex:commodity_prices'
  const cached = await cacheGet<UexCommodityPrice[]>(key)
  if (cached) return cached
  const data = await uexFetch<UexCommodityPrice[]>('/commodities_prices', token)
  await cacheSet(key, data, TTL.ONE_HOUR)
  return data
}

export async function getTerminals(token: string): Promise<UexTerminal[]> {
  const key = 'uex:terminals'
  const cached = await cacheGet<UexTerminal[]>(key)
  if (cached) return cached
  const data = await uexFetch<UexTerminal[]>('/terminals', token)
  await cacheSet(key, data, TTL.ONE_DAY)
  return data
}

// ── Trade route logic ────────────────────────────────────────────────────────

export interface TradeRoute {
  commodity: string
  commodityCode: string
  buyTerminal: string
  buyLocation: string
  sellTerminal: string
  sellLocation: string
  buyPrice: number
  sellPrice: number
  profitPerScu: number
  totalProfit: number
  scuAvailable: number
}

export function findBestRoutes(
  prices: UexCommodityPrice[],
  commodities: UexCommodity[],
  scuCapacity: number,
  maxRoutes = 5,
): TradeRoute[] {
  const commodityMap = new Map(commodities.map((c) => [c.id, c]))

  // Group prices by commodity
  const byComm = new Map<number, UexCommodityPrice[]>()
  for (const p of prices) {
    if (!byComm.has(p.id_commodity)) byComm.set(p.id_commodity, [])
    byComm.get(p.id_commodity)!.push(p)
  }

  const routes: TradeRoute[] = []

  for (const [commId, commPrices] of byComm) {
    const commodity = commodityMap.get(commId)
    if (!commodity) continue

    const buys = commPrices.filter((p) => p.price_buy > 0 && p.scu_buy > 0)
    const sells = commPrices.filter((p) => p.price_sell > 0)

    for (const buy of buys) {
      for (const sell of sells) {
        if (buy.terminal_code === sell.terminal_code) continue
        if (sell.price_sell <= buy.price_buy) continue

        const profitPerScu = sell.price_sell - buy.price_buy
        const scuAvailable = Math.min(buy.scu_buy, scuCapacity)
        const totalProfit = profitPerScu * scuAvailable

        routes.push({
          commodity: commodity.name,
          commodityCode: commodity.code,
          buyTerminal: buy.terminal_name,
          buyLocation: formatLocation(buy),
          sellTerminal: sell.terminal_name,
          sellLocation: formatLocation(sell),
          buyPrice: buy.price_buy,
          sellPrice: sell.price_sell,
          profitPerScu,
          totalProfit,
          scuAvailable,
        })
      }
    }
  }

  return routes
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, maxRoutes)
}

function formatLocation(p: UexCommodityPrice): string {
  return [p.city_name, p.moon_name, p.planet_name].filter(Boolean).join(', ')
}

// ── API key storage ───────────────────────────────────────────────────────────

import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function saveUexToken(uid: string, token: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'settings', 'apiKeys'),
    { uex: token },
    { merge: true },
  )
}

export async function loadUexToken(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'settings', 'apiKeys'))
  return snap.exists() ? (snap.data().uex as string | null) ?? null : null
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    await uexFetch('/commodities', token)
    return true
  } catch {
    return false
  }
}
