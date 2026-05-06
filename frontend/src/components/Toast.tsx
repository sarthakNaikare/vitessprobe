import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface Toast {
  id: string
  type: 'incident' | 'resolved' | 'info'
  title: string
  message: string
}

let addToastFn: ((t: Omit<Toast, 'id'>) => void) | null = null

export function addToast(t: Omit<Toast, 'id'>) {
  if (addToastFn) addToastFn(t)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { ...t, id }])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000)
    }
    return () => { addToastFn = null }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-slide-in ${
            t.type === 'incident'
              ? 'bg-red-50 border-red-200'
              : t.type === 'resolved'
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-stone-200'
          }`}
        >
          {t.type === 'incident'
            ? <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            : <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-stone-800">{t.title}</p>
            <p className="text-xs text-stone-500 truncate">{t.message}</p>
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-stone-300 hover:text-stone-500"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
