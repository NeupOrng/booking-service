export type NotifyType = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export interface NotifyOptions {
  type?: NotifyType
  title: string
  description?: string
  /** ms before auto-dismiss. 0 = persistent. Default: 15000 */
  duration?: number
}

export interface NotifyItem extends Required<Omit<NotifyOptions, 'description'>> {
  id: string
  description?: string
}

// ── Module-level singleton ─────────────────────────────────────────────────────
const items = ref<NotifyItem[]>([])

let _counter = 0

// Per-notification timer state
const _state = new Map<string, {
  tid: ReturnType<typeof setTimeout>
  startedAt: number
  duration: number
}>()

function _startTimer(id: string, delay: number) {
  if (delay <= 0) return
  const tid = setTimeout(() => {
    _state.delete(id)
    dismiss(id)
  }, delay)
  _state.set(id, { tid, startedAt: Date.now(), duration: delay })
}

function _clearTimer(id: string) {
  const entry = _state.get(id)
  if (entry) {
    clearTimeout(entry.tid)
    _state.delete(id)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
function push(options: NotifyOptions): string {
  const id = `notif-${Date.now()}-${++_counter}`
  const duration = options.duration ?? 15000

  items.value.unshift({
    id,
    type: options.type ?? 'neutral',
    title: options.title,
    description: options.description,
    duration,
  })

  _startTimer(id, duration)
  return id
}

function dismiss(id: string) {
  _clearTimer(id)
  const idx = items.value.findIndex(n => n.id === id)
  if (idx !== -1) items.value.splice(idx, 1)
}

// Pause auto-dismiss while the user hovers (tracks remaining ms)
function pause(id: string) {
  const entry = _state.get(id)
  if (!entry) return
  clearTimeout(entry.tid)
  // Replace state with remaining time so resume picks it up
  const elapsed = Date.now() - entry.startedAt
  const remaining = Math.max(0, entry.duration - elapsed)
  _state.set(id, { tid: -1 as unknown as ReturnType<typeof setTimeout>, startedAt: Date.now(), duration: remaining })
}

// Resume from where pause left off
function resume(id: string) {
  const entry = _state.get(id)
  if (!entry || entry.duration <= 0) return
  _startTimer(id, entry.duration)
}

export function useNotify() {
  const notify = {
    neutral: (title: string, description?: string, opts?: Partial<NotifyOptions>) =>
      push({ ...opts, type: 'neutral', title, description }),
    info: (title: string, description?: string, opts?: Partial<NotifyOptions>) =>
      push({ ...opts, type: 'info', title, description }),
    success: (title: string, description?: string, opts?: Partial<NotifyOptions>) =>
      push({ ...opts, type: 'success', title, description }),
    warning: (title: string, description?: string, opts?: Partial<NotifyOptions>) =>
      push({ ...opts, type: 'warning', title, description }),
    error: (title: string, description?: string, opts?: Partial<NotifyOptions>) =>
      push({ ...opts, type: 'error', title, description }),
    push,
    dismiss,
  }

  return { items, notify, push, dismiss, pause, resume }
}
