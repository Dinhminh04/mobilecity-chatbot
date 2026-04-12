'use client'
import { useState } from 'react'
import { Eye, EyeOff, Lock, User, Smartphone } from 'lucide-react'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'mobilecity123'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 600))

    if (username.trim() === ADMIN_USER && password.trim() === ADMIN_PASS) {
      // Set cookie rồi dùng window.location để đảm bảo cookie được ghi trước khi redirect
      document.cookie = 'mc_token=mc_admin_authenticated; path=/; max-age=86400; SameSite=Lax'
      window.location.href = '/dashboard'
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng!')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, background: 'rgba(198,154,57,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, background: 'rgba(198,154,57,0.05)', borderRadius: '50%' }} />
      </div>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, background: 'linear-gradient(135deg,#c69a39,#e6b84a)',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(198,154,57,0.4)',
          }}>
            <Smartphone size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>MobileCity Admin</h1>
          <p style={{ fontSize: 14, color: '#888' }}>Đăng nhập để quản lý hệ thống</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                style={{
                  width: '100%', padding: '12px 14px 12px 40px',
                  border: '1.5px solid #e5e5e5', borderRadius: 10,
                  fontSize: 14, outline: 'none', background: '#fafafa',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#c69a39'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 40px',
                  border: '1.5px solid #e5e5e5', borderRadius: 10,
                  fontSize: 14, outline: 'none', background: '#fafafa',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#c69a39'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#d4a843' : 'linear-gradient(135deg,#c69a39,#e6b84a)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(198,154,57,0.4)',
              marginTop: 4,
            }}
          >
            {loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
          </button>
        </form>

        {/* Hint */}
        <div style={{ marginTop: 20, padding: 12, background: '#fdf8ee', borderRadius: 8, border: '1px solid #e8d5a0' }}>
          <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 4 }}>Tài khoản mặc định:</p>
          <p style={{ fontSize: 12, color: '#c69a39', textAlign: 'center', fontWeight: 600 }}>

          </p>
        </div>
      </div>
    </div>
  )
}