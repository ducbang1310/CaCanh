import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { wishlist, toggle } = useWishlist()

  return (
    <main style={{ minHeight: '60vh', padding: '2rem 1rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          ❤️ Sản phẩm yêu thích
          {wishlist.length > 0 && (
            <span style={{ fontSize: '1rem', fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>
              ({wishlist.length})
            </span>
          )}
        </h1>
        {wishlist.length > 0 && (
          <Link to="/products" style={{ color: 'var(--teal, #2a9d8f)', fontSize: '0.9rem' }}>
            ← Tiếp tục mua sắm
          </Link>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🤍</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Bạn chưa lưu sản phẩm nào</p>
          <Link
            to="/products"
            style={{
              display: 'inline-block', padding: '0.65rem 1.5rem',
              background: 'var(--teal, #2a9d8f)', color: '#fff',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600,
            }}
          >
            Khám phá sản phẩm →
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          {wishlist.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  )
}
