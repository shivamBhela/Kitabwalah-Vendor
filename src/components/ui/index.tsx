import type { ReactNode, CSSProperties } from 'react'
import type { ProductView } from '../../types'

// ─── Brand ────────────────────────────────────────────────────────────────────

export function Brand() {
  return (
    <div className="brand auth-brand">
      <span className="brand-mark">K</span>
      <span>
        KITAB<span>WALAH</span>
        <small>VENDOR CENTRAL</small>
      </span>
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

type PageHeaderProps = {
  crumb: string
  title: string
  desc: string
  action?: ReactNode
}

export function PageHeader({ crumb, title, desc, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardProps = {
  title?: string
  subtitle?: string
  action?: ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function Card({ title, subtitle, action, children, className = '', style }: CardProps) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// ─── Metric ───────────────────────────────────────────────────────────────────

type MetricProps = {
  label: string
  value: string
  trend?: string
  alert?: string
}

export function Metric({ label, value, trend, alert }: MetricProps) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}</strong>
      {(trend || alert) && (
        <span className={alert ? 'alert-text' : 'trend'}>{alert || trend}</span>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ value }: { value: string }) {
  const display = value ? value.replaceAll('_', ' ') : 'N/A'
  return (
    <span className={`badge ${display.toLowerCase().replaceAll(' ', '-')}`}>
      {display}
    </span>
  )
}

// ─── Book Thumbnail ───────────────────────────────────────────────────────────

export function Book({ product }: { product: ProductView }) {
  const title = product.title || 'Book'
  const imageUrl = product.images?.[0]?.imageUrl
  const bgColor = '#467364'

  return (
    <span
      className="book"
      style={{
        background: bgColor,
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!imageUrl &&
        title
          .split(' ')
          .slice(0, 2)
          .map((word, i) => <span key={i}>{word}</span>)}
    </span>
  )
}

// ─── Stock Indicator ──────────────────────────────────────────────────────────

type StockProps = { stock: number; threshold?: number }

export function Stock({ stock, threshold = 10 }: StockProps) {
  const className =
    stock === 0 ? 'stock out' : stock <= threshold ? 'stock low' : 'stock'
  const label =
    stock === 0 ? 'Out of stock' : stock <= threshold ? 'Low stock' : 'In stock'
  return (
    <span className={className}>
      {label} <b>{stock}</b>
    </span>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

export function Stars({ rating }: { rating: number }) {
  const safeRating = Math.min(5, Math.max(0, Math.round(rating)))
  return (
    <span className="stars">
      {'★'.repeat(safeRating)}
      <i>{'★'.repeat(5 - safeRating)}</i>
    </span>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

type ToggleProps = {
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      className={value ? 'toggle on' : 'toggle'}
      onClick={() => onChange(!value)}
      aria-label="Toggle setting"
    >
      <i />
    </button>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

type FieldProps = {
  label: string
  required?: boolean
  value?: string | number
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  textarea?: boolean
  select?: boolean
  options?: string[]
  prefix?: string
  full?: boolean
}

export function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea,
  select,
  options,
  prefix,
  full,
}: FieldProps) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {textarea ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
      ) : select ? (
        <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <div className={prefix ? 'prefixed' : ''}>
          {prefix && <i>{prefix}</i>}
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )}
    </label>
  )
}

// ─── File Upload Box ──────────────────────────────────────────────────────────

export function FileBox({ label }: { label: string }) {
  return (
    <div className="file-box">
      <span>⇧</span>
      <div>
        <b>{label}</b>
        <small>PDF, JPG or PNG · max 5 MB</small>
      </div>
      <button className="text-button" type="button">
        Browse
      </button>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

type EmptyProps = {
  title: string
  text: string
  action?: string
  onClick?: () => void
}

export function Empty({ title, text, action, onClick }: EmptyProps) {
  return (
    <div className="empty">
      <span>⌁</span>
      <b>{title}</b>
      <p>{text}</p>
      {action && (
        <button className="button" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

type PaginationProps = {
  label: string
  page?: number
  totalPages?: number
  onPageChange?: (p: number) => void
}

export function Pagination({ label, page = 1, totalPages = 1, onPageChange }: PaginationProps) {
  return (
    <div className="pagination">
      <span>{label}</span>
      <div>
        <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
          ←
        </button>
        <button className="selected">{page}</button>
        <button disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
          →
        </button>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  title: string
  close: () => void
  children: ReactNode
}

export function Modal({ title, close, children }: ModalProps) {
  return (
    <div className="modal-backdrop" role="dialog">
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={close}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
