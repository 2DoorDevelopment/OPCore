import { useState } from 'react'
import { signInWithGoogle } from '../lib/auth'
import { Button } from '../components/ui/Button'

export function Landing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // signInWithRedirect navigates away — loading state stays true intentionally
    } catch {
      setError('Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-heading font-bold text-accent tracking-wide">OpCore</h1>
          <p className="text-text-muted text-base">
            Your Star Citizen crew hub — mining, salvage, fleet, and trade in one place.
          </p>
        </div>

        <div className="bg-bg-panel border border-border rounded-xl p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { label: 'Mining Sessions', desc: 'Track rocks & splits' },
              { label: 'Salvage Ops', desc: 'RMC/CM hauls & payouts' },
              { label: 'Fleet Tracker', desc: 'Your ships, shared with crew' },
              { label: 'Trade Routes', desc: 'UEX-powered cargo planner' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-bg-elevated rounded-lg p-3">
                <p className="text-text text-sm font-medium font-heading">{label}</p>
                <p className="text-text-dim text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              'Signing in…'
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </Button>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}
        </div>

        <p className="text-text-dim text-xs">
          OpCore is an unofficial fan-made tool. Star Citizen® is © Cloud Imperium Rights LLC.
        </p>
        <p className="text-text-dim text-xs">v0.4 · build 2026-05-18</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
