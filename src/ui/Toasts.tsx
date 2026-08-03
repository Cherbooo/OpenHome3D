import { useUI } from './uiStore'

/** Top-center black pill toasts, fed by uiStore.toasts (auto-expire there). */
export default function Toasts() {
  const toasts = useUI((s) => s.toasts)
  if (toasts.length === 0) return null
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.leaving ? ' leaving' : ''}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
