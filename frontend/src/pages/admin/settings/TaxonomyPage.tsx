import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, X, GripVertical, Eye } from 'lucide-react'

import { taxonomyApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'

// ── Reorderable list ─────────────────────────────────────────────────

function ReorderableList({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [newItem, setNewItem] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setNewItem('')
  }

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const updated = [...items]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(idx, 0, moved)
    onChange(updated)
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text">{label}</label>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-2 rounded-md border border-border bg-gray-50 px-3 py-2 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted flex-shrink-0" />
            <span className="flex-1 text-sm text-text">{item}</span>
            <button
              onClick={() => removeItem(idx)}
              className="rounded p-0.5 text-muted hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder="Add new…"
          className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button variant="outline" size="sm" onClick={addItem} leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Add
        </Button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function TaxonomyPage() {
  const queryClient = useQueryClient()

  const { data: taxonomy, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: taxonomyApi.get,
  })

  const [syncedAt, setSyncedAt] = useState(0)
  const [severityLabels, setSeverityLabels] = useState<string[]>([])
  const [ungradableReasons, setUngradableReasons] = useState<string[]>([])
  const [dmeFlagsEnabled, setDmeFlagsEnabled] = useState(false)
  const [dirty, setDirty] = useState(false)

  if (dataUpdatedAt > syncedAt && taxonomy) {
    setSyncedAt(dataUpdatedAt)
    setSeverityLabels(taxonomy.severityLabels ?? [])
    setUngradableReasons(taxonomy.ungradableReasons ?? [])
    setDmeFlagsEnabled(taxonomy.dmeFlagsEnabled ?? false)
    setDirty(false)
  }

  const mutation = useMutation({
    mutationFn: () =>
      taxonomyApi.update({ severityLabels, ungradableReasons, dmeFlagsEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] })
      toast.success('Taxonomy saved.')
      setDirty(false)
    },
    onError: () => toast.error('Failed to save taxonomy.'),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Clinical Taxonomy"
        subtitle="Configure severity labels, ungradable reasons, and DME flags for your organization."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Clinical Taxonomy' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: config sections */}
        <div className="space-y-6">
          <Card title="Severity Labels">
            <ReorderableList
              label=""
              items={severityLabels}
              onChange={(items) => { setSeverityLabels(items); setDirty(true) }}
            />
          </Card>

          <Card title="Ungradable Reasons">
            <ReorderableList
              label=""
              items={ungradableReasons}
              onChange={(items) => { setUngradableReasons(items); setDirty(true) }}
            />
          </Card>

          <Card title="DME Flags">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Enable DME Flags</p>
                <p className="text-xs text-muted">Show DME flag options in case review UI</p>
              </div>
              <button
                onClick={() => { setDmeFlagsEnabled(!dmeFlagsEnabled); setDirty(true) }}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  dmeFlagsEnabled ? 'bg-teal-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    dmeFlagsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending} disabled={!dirty}>
              Save Taxonomy
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <Card title="Live Preview" description="How labels appear in the case review UI">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
                  <Eye className="h-4 w-4 text-muted" />
                  Severity Labels
                </h4>
                {severityLabels.length === 0 ? (
                  <p className="text-xs text-muted italic">No severity labels defined</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {severityLabels.map((label, i) => (
                      <Badge key={i} variant="info" size="md">{label}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-text">Ungradable Reasons</h4>
                {ungradableReasons.length === 0 ? (
                  <p className="text-xs text-muted italic">No reasons defined</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ungradableReasons.map((reason, i) => (
                      <Badge key={i} variant="warning" size="md">{reason}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-text">DME Flags</h4>
                <Badge variant={dmeFlagsEnabled ? 'success' : 'default'} size="md">
                  {dmeFlagsEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
