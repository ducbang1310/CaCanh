import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { blogService } from '../services/blog/blogService'
import styles from './BlogDetail.module.css'

export default function BlogDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const res = await blogService.getById(id)
        setBlog(res)
      } catch (err) {
        setError(err.message || 'Không thể tải bài viết')
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [id])

  if (loading) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.status}>⏳ Đang tải bài viết...</p>
      </div>
    </main>
  )

  if (error) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.status} style={{ color: '#ef4444' }}>❌ {error}</p>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className={styles.backBtn} onClick={() => navigate('/blog')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    </main>
  )

  if (!blog) return null

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Nút quay lại */}
        <Link to="/blog" className={styles.backLink}>
          ← Quay lại Blog
        </Link>

        <article className={styles.article}>
          {/* Ảnh bìa */}
          {blog.imageUrl && (
            <div className={styles.cover}>
              <img
                src={blog.imageUrl}
                alt={blog.title}
                onError={e => { e.target.src = '/placeholder.jpg' }}
              />
            </div>
          )}

          {/* Tiêu đề + meta */}
          <header className={styles.header}>
            <h1 className={styles.title}>{blog.title}</h1>
            <div className={styles.meta}>
              {blog.publishDate && (
                <span>📅 {new Date(blog.publishDate).toLocaleDateString('vi-VN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
              )}
              <span>✍️ {blog.author || 'Admin'}</span>
            </div>
            {blog.shortDescription && (
              <p className={styles.summary}>{blog.shortDescription}</p>
            )}
          </header>

          {/* Nội dung bài viết */}
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Footer navigation */}
        <div className={styles.footer}>
          <Link to="/blog" className={styles.backBtn}>
            ← Xem thêm bài viết khác
          </Link>
        </div>
      </div>
    </main>
  )
}
