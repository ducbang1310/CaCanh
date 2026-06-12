import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'aquaviet_wishlist'

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
  }, [wishlist])

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
