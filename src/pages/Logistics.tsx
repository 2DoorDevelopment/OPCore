import { useState, useEffect, useCallback } from 'react'
import { Package, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { UexKeyModal } from '../components/ui/UexKeyModal'
import { useAuth } from '../lib/auth'
import {
  loadUexToken,
  getCommodities,
  getCommodityPrices,
  findBestRoutes,
  type TradeRoute,
} from '../lib/uex'

export function Logistics() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [showKeyModal, setShowKeyModal] = useState(false)

  const [scu, setScu] = useState('100')
  const [routes, setRoutes] = useState<TradeRoute[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Load saved token on mount
  useEffect(() => {
    if (!user) return
    loadUexToken(user.uid).then((t) => {
      setToken(t)
      setTokenLoading(false)
    })
  }, [user])

  const handleSearch = useCallback(async () => {
    if (!token) { setShowKeyModal(true); return }
    const scuNum = Math.max(1, parseInt(scu) || 1)
    setSearching(true)
    setSearchError(null)
    try {
      const [commodities, prices] = await Promise.all([
        getCommodities(token),
        getCommodityPrices(token),
      ])
      const found = findBestRoutes(prices, commodities, scuNum, 5)
      setRoutes(found)
      setSearched(true)
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Failed to fetch trade data.')
      if (e instanceof Error && e.message.includes('token')) setToken(null)
    } finally {
      setSearching(false)
    }
  }, [token, scu])

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted text-sm animate-pulse">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Logistics</h1>
      </div>

      {/* No token banner */}
      {!token && (
        <Card className="border-warn/40 bg-warn/5">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text">UEX API key required</p>
              <p className="text-xs text-text-muted mt-0.5">
                Trade prices are powered by UEX Corp. Add your free API token to get started.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowKeyModal(true)} className="shrink-0">
              Add Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search form */}
      <Card>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">Cargo Capacity (SCU)</label>
            <Input
              type="number"
              min="1"
              placeholder="100"
              value={scu}
              onChange={(e) => setScu(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full"
          >
            {searching ? (
              <><RefreshCw size={15} className="animate-spin" /> Fetching routes…</>
            ) : (
              'Find Best Routes'
            )}
          </Button>
          {token && (
            <button
              onClick={() => setShowKeyModal(true)}
              className="text-xs text-text-dim hover:text-text-muted transition-colors w-full text-center"
            >
              Update API key
            </button>
          )}
        </CardContent>
      </Card>

      {searchError && (
        <div className="flex items-center gap-2 text-danger text-sm">
          <AlertTriangle size={14} />
          {searchError}
        </div>
      )}

      {/* Results */}
      {searched && routes.length === 0 && !searchError && (
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm text-center py-6">
              No profitable routes found. Try adjusting your SCU capacity.
            </p>
          </CardContent>
        </Card>
      )}

      {routes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-heading font-semibold text-text-muted uppercase tracking-wider">
            Top Routes by Profit
          </h2>
          {routes.map((route, i) => (
            <RouteCard key={i} route={route} rank={i + 1} />
          ))}
          <p className="text-text-dim text-xs text-center">
            Prices cached for 1 hour · Powered by UEX Corp
          </p>
        </div>
      )}

      <UexKeyModal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        uid={user!.uid}
        onSaved={setToken}
      />
    </div>
  )
}

function RouteCard({ route, rank }: { route: TradeRoute; rank: number }) {
  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-text-dim text-xs font-mono shrink-0">#{rank}</span>
            <div className="min-w-0">
              <p className="text-text font-medium text-sm truncate">{route.commodity}</p>
              <p className="text-text-dim text-xs">{route.commodityCode}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-accent font-bold font-heading text-lg leading-none">
              {route.totalProfit.toLocaleString()}
            </p>
            <p className="text-text-dim text-xs">aUEC profit</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 min-w-0">
            <p className="text-text-muted font-medium truncate">{route.buyTerminal}</p>
            <p className="text-text-dim truncate">{route.buyLocation}</p>
            <p className="text-success mt-0.5">{route.buyPrice.toLocaleString()} aUEC/SCU</p>
          </div>
          <ArrowRight size={14} className="text-text-dim shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-text-muted font-medium truncate">{route.sellTerminal}</p>
            <p className="text-text-dim truncate">{route.sellLocation}</p>
            <p className="text-accent mt-0.5">{route.sellPrice.toLocaleString()} aUEC/SCU</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs border-t border-border pt-2">
          <span className="text-text-dim">
            +{route.profitPerScu.toLocaleString()} aUEC/SCU
          </span>
          <span className="text-text-dim">
            {route.scuAvailable} SCU available
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
