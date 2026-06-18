import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast])
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast])

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', icon: '✅', text: '#166534' },
    error:   { bg: '#fef2f2', border: '#fca5a5', icon: '❌', text: '#991b1b' },
    info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ️', text: '#1e40af' },
  }
  const c = colors[toast.type] || colors.info

  return (
    <div
      onClick={onClose}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        padding: '14px 20px',
        borderRadius: 12,
        fontSize: 14,
        lineHeight: 1.5,
        maxWidth: 360,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
      }}
    >
      <span style={{ marginRight: 8 }}>{c.icon}</span>
      {toast.message}
    </div>
  )
}
