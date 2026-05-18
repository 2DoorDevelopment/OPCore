import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Modal } from './Modal'
import { Input } from './Input'
import { Button } from './Button'
import { saveUexToken, validateToken } from '../../lib/uex'

interface UexKeyModalProps {
  open: boolean
  onClose: () => void
  uid: string
  onSaved: (token: string) => void
}

export function UexKeyModal({ open, onClose, uid, onSaved }: UexKeyModalProps) {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const trimmed = token.trim()
    if (!trimmed) { setError('Please paste your UEX token.'); return }
    setSaving(true)
    setError(null)
    try {
      const valid = await validateToken(trimmed)
      if (!valid) { setError('Token rejected by UEX — double-check it and try again.'); setSaving(false); return }
      await saveUexToken(uid, trimmed)
      onSaved(trimmed)
      onClose()
    } catch {
      setError('Failed to save token. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="UEX Corp API Key">
      <div className="space-y-4">
        <p className="text-text-muted text-sm">
          OpCore uses UEX Corp for live trade prices. Your token is stored privately in your profile and never shared.
        </p>

        <a
          href="https://uexcorp.space"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-accent text-sm hover:underline"
        >
          <ExternalLink size={14} />
          uexcorp.space → My Apps → Create App → copy token
        </a>

        <div>
          <label className="text-xs text-text-muted block mb-1">Access Token</label>
          <Input
            placeholder="Paste your UEX access token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Verifying…' : 'Save Token'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
