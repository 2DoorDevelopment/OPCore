import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import type { RockEntry, RockStatus } from '../../types'

type RockFormData = Omit<RockEntry, 'rockId' | 'createdBy' | 'createdAt'>

interface AddRockModalProps {
  open: boolean
  onClose: () => void
  onSave: (rock: RockFormData) => Promise<void>
  initialRock?: RockEntry
}

const STATUSES: RockStatus[] = ['scanned', 'mined', 'refined', 'sold']

function emptyForm(): {
  location: string
  rockType: string
  scanValue: string
  finalSaleValue: string
  status: RockStatus
  notes: string
} {
  return { location: '', rockType: '', scanValue: '', finalSaleValue: '', status: 'scanned', notes: '' }
}

export function AddRockModal({ open, onClose, onSave, initialRock }: AddRockModalProps) {
  const [form, setForm] = useState(() =>
    initialRock
      ? {
          location: initialRock.location,
          rockType: initialRock.rockType,
          scanValue: initialRock.scanValue?.toString() ?? '',
          finalSaleValue: initialRock.finalSaleValue?.toString() ?? '',
          status: initialRock.status,
          notes: initialRock.notes,
        }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        location: form.location,
        rockType: form.rockType,
        scanValue: form.scanValue !== '' ? Number(form.scanValue) : null,
        finalSaleValue: form.finalSaleValue !== '' ? Number(form.finalSaleValue) : null,
        status: form.status,
        notes: form.notes,
        composition: initialRock?.composition ?? {},
      })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initialRock ? 'Edit Rock' : 'Add Rock'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-muted block mb-1">Location</label>
          <Input
            placeholder="e.g. Aaron Halo, near Crusader"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1">Rock Type</label>
          <Input
            placeholder="e.g. Quantanium-class"
            value={form.rockType}
            onChange={(e) => set('rockType', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Scan Value (aUEC)</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.scanValue}
              onChange={(e) => set('scanValue', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Sale Value (aUEC)</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.finalSaleValue}
              onChange={(e) => set('finalSaleValue', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={cn(
                  'px-3 py-1 rounded text-xs capitalize transition-colors border',
                  form.status === s
                    ? 'bg-accent text-bg border-accent'
                    : 'bg-bg-elevated text-text-muted border-border hover:text-text'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1">Notes</label>
          <Input
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save Rock'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
