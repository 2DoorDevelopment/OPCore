import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import type { SalvageEntry, SalvageStatus } from '../../types'

type SalvageFormData = Omit<SalvageEntry, 'salvageId' | 'createdBy' | 'createdAt'>

interface AddSalvageModalProps {
  open: boolean
  onClose: () => void
  onSave: (entry: SalvageFormData) => Promise<void>
  initialEntry?: SalvageEntry
}

const STATUSES: SalvageStatus[] = ['scanned', 'stripped', 'sold']

function emptyForm() {
  return { shipType: '', location: '', rmcUnits: '', cmUnits: '', finalSaleValue: '', status: 'scanned' as SalvageStatus, notes: '' }
}

export function AddSalvageModal({ open, onClose, onSave, initialEntry }: AddSalvageModalProps) {
  const [form, setForm] = useState(() =>
    initialEntry
      ? {
          shipType: initialEntry.shipType,
          location: initialEntry.location,
          rmcUnits: initialEntry.rmcUnits.toString(),
          cmUnits: initialEntry.cmUnits.toString(),
          finalSaleValue: initialEntry.finalSaleValue?.toString() ?? '',
          status: initialEntry.status,
          notes: initialEntry.notes,
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
        shipType: form.shipType,
        location: form.location,
        rmcUnits: form.rmcUnits !== '' ? Number(form.rmcUnits) : 0,
        cmUnits: form.cmUnits !== '' ? Number(form.cmUnits) : 0,
        finalSaleValue: form.finalSaleValue !== '' ? Number(form.finalSaleValue) : null,
        status: form.status,
        notes: form.notes,
      })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initialEntry ? 'Edit Salvage Entry' : 'Add Salvage Entry'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-muted block mb-1">Ship Type</label>
          <Input
            placeholder="e.g. C2 Hercules, Reclaimer hull"
            value={form.shipType}
            onChange={(e) => set('shipType', e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1">Location</label>
          <Input
            placeholder="e.g. Yela belt, near ArcCorp"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">RMC (SCU)</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.rmcUnits}
              onChange={(e) => set('rmcUnits', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">CM (SCU)</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.cmUnits}
              onChange={(e) => set('cmUnits', e.target.value)}
            />
          </div>
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

        <div>
          <label className="text-xs text-text-muted block mb-1">Status</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={cn(
                  'flex-1 py-1.5 rounded text-xs capitalize border transition-colors',
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
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
