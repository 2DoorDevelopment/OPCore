import { Settings as SettingsIcon, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { signOut } from '../lib/auth'
import { useAuth } from '../lib/auth'

export function Settings() {
  const { user } = useAuth()

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
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User'}
                  className="w-10 h-10 rounded-full"
                />
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
        <CardContent>
          <p className="text-text-muted text-sm">UEX integration coming in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  )
}
