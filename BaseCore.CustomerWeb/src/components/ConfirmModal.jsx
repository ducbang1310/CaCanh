import { useState } from 'react'

export default function ConfirmModal({ title, message, confirmText = 'Xác nhận', cancelText = 'Không', onConfirm, onCancel, danger = false }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '28px 32px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'fadeInUp 0.25s ease',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#666', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14,
              background: '#f5f5f5', color: '#333', border: 'none', cursor: 'pointer',
            }}
          >{cancelText}</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: danger ? '#ef4444' : 'var(--teal, #0d9488)',
              color: '#fff', border: 'none', cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >{loading ? 'Đang xử lý...' : confirmText}</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
