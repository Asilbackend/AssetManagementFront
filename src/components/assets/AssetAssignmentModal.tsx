import { useMemo, useState } from 'react'
import type { Role, User } from '../../domain/types'
import { Modal } from '../ui/Modal'
import { SearchSelect } from '../ui/SearchSelect'

export function AssetAssignmentModal({
  open,
  title,
  users,
  role,
  showIpAddress = false,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  users: User[]
  role: Role
  showIpAddress?: boolean
  onClose: () => void
  onConfirm: (userId: string, extras?: { ipAddress?: string }) => void
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [ipAddress, setIpAddress] = useState('')

  const options = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.fullName} - ${user.team}`,
        value: user.id,
      })),
    [users],
  )

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="space-y-6">
        <SearchSelect
          label={`${role.replaceAll('_', ' ')} selection`}
          options={options}
          value={selectedUserId}
          placeholder={role.replaceAll('_', ' ')}
          onChange={setSelectedUserId}
        />
        {showIpAddress ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              IP Address
            </label>
            <input
              value={ipAddress}
              onChange={(event) => setIpAddress(event.target.value)}
              placeholder="192.168.10.25"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
            />
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedUserId) {
                return
              }

              onConfirm(selectedUserId, { ipAddress: ipAddress.trim() || undefined })
              setSelectedUserId('')
              setIpAddress('')
              onClose()
            }}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Confirm assignment
          </button>
        </div>
      </div>
    </Modal>
  )
}
