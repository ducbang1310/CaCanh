import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

function getStorageKey(user) {
  // Mỗi user có wishlist riêng, chưa login dùng key chung 'guest'
  const userId = user?.userId || user?.id || 'guest'
  return `aquaviet_wishlist_${userId}`
}

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const storageKey = getStorageKey(user)

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || []
    } catch {
      return []
    }
  })

  // Reload wishlist khi user thay đổi (login/logout)
  useEffect(() => {
    try {
      setWishlist(JSON.parse(localStorage.getItem(storageKey)) || [])
    } catch {
      setWishlist([])
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(wishlist))
  }, [wishlist, storageKey])

  const toggle = useCallback((product) => {
    setWishlist(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    )
  }, [])

  const isSaved = useCallback((id) => wishlist.some(p => p.id === id), [wishlist])

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isSaved }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
