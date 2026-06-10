import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/user/userService'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [infoMsg, setInfoMsg] = useState(null)
  const [infoErr, setInfoErr] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)
  const [pwErr, setPwErr] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    userService.getMe()
      .then(data => setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' }))
      .catch(() => setForm({ name: user.name || '', email: user.email || '', phone: '' }))
  }, [user])

  const handleInfoSave = async e => {
    e.preventDefault()
    setInfoMsg(null); setInfoErr(null)
    if (!form.name.trim()) { setInfoErr('Tên không được để trống'); return }
    setSaving(true)
    try {
      const updated = await userService.updateMe({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() })
      updateUser({ name: updated.name, email: updated.email })
      setInfoMsg('Cập nhật thông tin thành công!')
    } catch (err) {
      setInfoErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePwSave = async e => {
    e.preventDefault()
    setPwMsg(null); setPwErr(null)
    if (!pwForm.oldPassword || !pwForm.newPassword) { setPwErr('Vui lòng điền đầy đủ'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwErr('Mật khẩu mới không khớp'); return }
    if (pwForm.newPassword.length < 6) { setPwErr('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    setSavingPw(true)
    try {
      await userService.changeMyPassword(pwForm.oldPassword, pwForm.newPassword)
      setPwMsg('Đổi mật khẩu thành công!')
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwErr(err.message)
    } finally {
      setSavingPw(false)
    }
  }

  if (!user) return null

  const initial = (user.name || user.username || '?')[0].toUpperCase()

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initial}</div>
          <div>
            <h1 className={styles.displayName}>{user.name || user.username}</h1>
            <p className={styles.username}>@{user.username}</p>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Thông tin cá nhân */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Thông tin cá nhân</h2>
            <form onSubmit={handleInfoSave}>
              <div className={styles.field}>
                <label>Tên hiển thị</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nhập tên của bạn"
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com"
                />
              </div>
              <div className={styles.field}>
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0912 345 678"
                />
              </div>
              {infoMsg && <p className={styles.success}>{infoMsg}</p>}
              {infoErr && <p className={styles.error}>{infoErr}</p>}
              <button type="submit" className={styles.btnSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </section>

          {/* Đổi mật khẩu */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Đổi mật khẩu</h2>
            <form onSubmit={handlePwSave}>
              <div className={styles.field}>
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={pwForm.oldPassword}
                  onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.field}>
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>
              <div className={styles.field}>
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {pwMsg && <p className={styles.success}>{pwMsg}</p>}
              {pwErr && <p className={styles.error}>{pwErr}</p>}
              <button type="submit" className={styles.btnSave} disabled={savingPw}>
                {savingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
