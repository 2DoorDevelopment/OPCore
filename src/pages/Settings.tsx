import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, LogOut, Key, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { UexKeyModal } from '../components/ui/UexKeyModal'
import { signOut, useAuth } from '../lib/auth'
import { loadUexToken, saveUexToken } from '../lib/uex'

export function Settings() {
  const { user } = useAuth()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    if (!user) return
    loadUexToken(user.uid).then((t) => setHasToken(!!t))
  }, [user])

  async function handleRemoveToken() {
    if (!user) return
    await saveUexToken(user.uid, '')
    setHasToken(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={22} className="text-accent" />
        <h1 className="text-2xl font-heading font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-heading font-semibold text-lg">Account</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName ?? 'User'} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="text-text font-medium">{user.displayName}</p>
                <p className="text-text-muted text-sm">{user.email}</p>
              </div>
            </div>
          )}
          <Button variant="danger" size="sm" onClick={signOut}>
            <LogOut size={16} />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-heading font-semibold text-lg">UEX Corp API Key</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-text-muted text-sm">
            Required for live trade prices in the Logistics page. Stored privately in your profile.
          </p>
          {hasToken ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-success text-sm">
                <Check size={15} />
                Token saved
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowKeyModal(true)}>
                <Key size={14} />
                Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemoveToken}>
                Remove
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowKeyModal(true)}>
              <Key size={14} />
              Add UEX Token
            </Button>
          )}
        </CardContent>
      </Card>

      {user && (
        <UexKeyModal
          open={showKeyModal}
          onClose={() => setShowKeyModal(false)}
          uid={user.uid}
          onSaved={() => setHasToken(true)}
        />
      )}
    </div>
  )
}
