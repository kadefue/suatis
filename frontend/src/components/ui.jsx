// src/components/ui.jsx — shared UI primitives

import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'green', sub }) {
  const colors = {
    green:  'bg-sua-50  text-sua-700  ring-sua-200',
    blue:   'bg-blue-50  text-blue-700  ring-blue-200',
    amber:  'bg-amber-50 text-amber-700 ring-amber-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
    red:    'bg-red-50   text-red-700   ring-red-200',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-display font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center ring-1', colors[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full', widths[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Form Field ────────────────────────────────────────────────────────────────
export function Field({ label, error, children, required }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ children, ...props }) {
  return (
    <select className="input" {...props}>
      {children}
    </select>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input(props) {
  return <input className="input" {...props} />
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', title, children }) {
  const styles = {
    info:    { wrapper: 'bg-blue-50 border-blue-200', icon: Info,          iconColor: 'text-blue-500' },
    warning: { wrapper: 'bg-amber-50 border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
    success: { wrapper: 'bg-green-50 border-green-200', icon: CheckCircle,  iconColor: 'text-green-500' },
    error:   { wrapper: 'bg-red-50 border-red-200',   icon: AlertTriangle, iconColor: 'text-red-500' },
  }
  const s = styles[type]
  return (
    <div className={clsx('flex gap-3 p-4 rounded-xl border', s.wrapper)}>
      <s.icon size={18} className={clsx('flex-shrink-0 mt-0.5', s.iconColor)} />
      <div className="text-sm">
        {title && <p className="font-medium text-gray-900 mb-1">{title}</p>}
        <div className="text-gray-700">{children}</div>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-gray-400" />
        </div>
      )}
      <p className="font-medium text-gray-900">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 'sm' }) {
  const sz = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-200 border-t-sua-600', sz[size])} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="md" />
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'green' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colors = { green: 'bg-sua-500', amber: 'bg-amber-400', red: 'bg-red-500', blue: 'bg-blue-500' }
  const activeColor = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : color
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', colors[activeColor])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-9 text-right">{pct}%</span>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-display font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  )
}
