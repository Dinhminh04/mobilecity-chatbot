'use client'
import { useEffect, useRef, useState } from 'react'

interface Message {
  id: number
  sender: 'user' | 'bot'
  text: string
  time: string
}

const RASA_URL = process.env.NEXT_PUBLIC_RASA_URL || 'http://localhost:5005'

const SESSION_ID = typeof window !== 'undefined'
  ? (sessionStorage.getItem('mc_sid') || (() => {
      const id = 'mc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
      sessionStorage.setItem('mc_sid', id)
      return id
    })())
  : 'mc_default'

function formatTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#b58a00">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#b58a00;border-bottom:1px dashed rgba(181,138,0,.4)">$1</a>')
    .replace(/(?<![">])(https?:\/\/[^\s<"]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#b58a00">$1</a>')
    .replace(/^• (.+)$/gm, '<span style="display:block;padding-left:14px">• $1</span>')
    .replace(/\n/g, '<br>')
}

const QUICK_REPLIES = [
  { label: '📱 iPhone', text: 'iPhone 17 Pro Max giá bao nhiêu?' },
  { label: '📱 Samsung', text: 'Samsung S25 Ultra bao nhiêu tiền?' },
  { label: '📱 OPPO', text: 'OPPO Reno 13 có tốt không?' },
  { label: '📱 Xiaomi', text: 'Xiaomi 15T Pro giá bao nhiêu?' },
  { label: '💻 iPad', text: 'iPad nào phù hợp cho học sinh?' },
  { label: '⌚ Apple Watch', text: 'Apple Watch Series 10 giá bao nhiêu?' },
  { label: '💰 Tầm 10tr', text: 'Tầm 10 triệu nên mua điện thoại gì?' },
  { label: '🔀 So sánh', text: 'So sánh iPhone 17 và Samsung S25 Ultra' },
  { label: '🛒 Đặt hàng', text: 'Tôi muốn đặt hàng một sản phẩm' },
  { label: '🤝 Nhân viên', text: 'Cho mình gặp nhân viên tư vấn trực tiếp' },
]

const PRODUCTS = [
  { name: 'Samsung Galaxy S25 Ultra Chính hãng VN', price: '24.150.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/01/samsung-galaxy-s25-ultra-xanh.jpg.webp', badge: 'HOT', url: 'https://mobilecity.vn/dien-thoai/samsung-galaxy-s25-ultra-chinh-hang.html' },
  { name: 'Samsung Galaxy S26 Chính hãng', price: '22.000.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2026/02/samsung-glalaxy-s26-0-4.jpg', badge: 'MỚI', url: 'https://mobilecity.vn/dien-thoai/samsung-galaxy-s26-chinh-hang.html' },
  { name: 'iPhone 17 Pro Chính hãng', price: '34.999.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/09/iphone-17-pro-xanh-dam.jpg.webp', badge: 'HOT', url: 'https://mobilecity.vn/dien-thoai/iphone-17-pro-chinh-hang.html' },
  { name: 'iPhone 17 Pro Max Chính hãng', price: '37.450.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/09/iphone-17-pro-max-cam.jpg.webp', badge: 'MỚI', url: 'https://mobilecity.vn/dien-thoai/iphone-17-pro-max-chinh-hang.html' },
  { name: 'Xiaomi 15T Chính hãng', price: '10.050.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/09/xiaomi-15t-vang-hong-1.jpg.webp', badge: '', url: 'https://mobilecity.vn/dien-thoai/xiaomi-15t-chinh-hang.html' },
  { name: 'Samsung Galaxy S26 Ultra 5G', price: '29.950.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2026/02/samsung-galaxy-s26-ultra-5g-0-4.jpg', badge: '', url: 'https://mobilecity.vn/dien-thoai/samsung-galaxy-s26-ultra-5g.html' },
  { name: 'Xiaomi REDMI Note 14 Chính hãng', price: '4.050.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/01/redmi-note-14-chinh-hang-tim.jpg.webp', badge: '', url: 'https://mobilecity.vn/dien-thoai/xiaomi-redmi-note-14-5g.html' },
  { name: 'Samsung Galaxy A56 5G Chính hãng', price: '8.050.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/03/samsung-galaxy-a56-5g-xanh.jpg.webp', badge: '', url: 'https://mobilecity.vn/dien-thoai/samsung-galaxy-a56-5g.html' },
  { name: 'Samsung Galaxy A36 5G Chính hãng', price: '6.300.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/03/samsung-galaxy-a36-5g-xanh.jpg.webp', badge: '', url: 'https://mobilecity.vn/dien-thoai/samsung-galaxy-a36-5g-chinh-hang.html' },
  { name: 'Xiaomi REDMI Note 15 Pro Chính hãng', price: '7.800.000₫', img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2026/02/xiaomi-redmi-note-15-pro-chinh-hang-9.jpg', badge: '', url: 'https://mobilecity.vn/dien-thoai/xiaomi-redmi-note-15-pro-chinh-hang.html' },
]

const BANNERS = [
  { img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2026/02/dat-truoc-galaxy-s26-series.jpg', url: 'https://mobilecity.vn/dien-thoai' },
  { img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/11/banner-redmi-k90-pro-mobilecity-1720x650px.jpg', url: 'https://mobilecity.vn/dien-thoai' },
  { img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2025/11/banner-realme-gt8-pro-mobilecity-1720x650px.jpg', url: 'https://mobilecity.vn/dien-thoai' },
  { img: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2024/01/banner-sua-chua-mobilecity-03.jpg', url: 'https://mobilecity.vn/sua-chua-dien-thoai' },
]

const NAV_ITEMS = [
  { icon: 'https://mobilecity.vn/assets/img/icon_header/smartPhone.png', emoji: '📱', label: 'Điện thoại', url: 'https://mobilecity.vn/dien-thoai' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/tablet.png', emoji: '💻', label: 'Máy tính bảng', url: 'https://mobilecity.vn/may-tinh-bang' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/laptop.png', emoji: '🖥️', label: 'Laptop', url: 'https://mobilecity.vn/laptop' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/tv.png', emoji: '📺', label: 'Tivi', url: 'https://mobilecity.vn/tivi' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/charging.png', emoji: '🔌', label: 'Phụ kiện', url: 'https://mobilecity.vn/phu-kien' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/watch.png', emoji: '⌚', label: 'Đồng hồ', url: 'https://mobilecity.vn/phu-kien-dong-ho-thong-minh' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/headphone.png', emoji: '🎧', label: 'Tai nghe', url: 'https://mobilecity.vn/phu-kien-tai-nghe' },
  { icon: 'https://mobilecity.vn/assets/img/icon_header/repair.png', emoji: '🔧', label: 'Sửa chữa', url: 'https://mobilecity.vn/sua-chua-dien-thoai' },
]

// ── Chatbot vàng đen đặc trưng ────────────────────────────────
function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [badge, setBadge] = useState(true)
  const [greeted, setGreeted] = useState(false)
  const [msgId, setMsgId] = useState(0)
  const msgsRef = useRef<HTMLDivElement>(null)

  const addMsg = (sender: 'user' | 'bot', text: string) => {
    setMsgId(p => p + 1)
    setMessages(prev => [...prev, { id: msgId + 1, sender, text, time: formatTime() }])
  }

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, typing])

  const greet = () => {
    if (greeted) return
    setGreeted(true)
    setTimeout(() => addMsg('bot',
      '👋 **Chào mừng bạn đến MobileCity!**\n\nMình là trợ lý AI tư vấn 24/7. Mình giúp được:\n• Tìm điện thoại phù hợp ngân sách\n• So sánh iPhone, Samsung, OPPO, Xiaomi\n• Kiểm tra giá & tồn kho thực tế\n• Đặt hàng & kết nối nhân viên tư vấn\n\nBạn cần tư vấn gì? 👇'
    ), 400)
  }

  const toggleOpen = () => {
    setOpen(p => !p)
    setBadge(false)
    if (!greeted) greet()
  }

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    addMsg('user', msg)
    setTyping(true)
    try {
      const res = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: SESSION_ID, message: msg })
      })
      const data = await res.json()
      setTyping(false)
      if (!data || data.length === 0) {
        addMsg('bot', 'Mình chưa hiểu rõ câu hỏi 😅\nThử hỏi về: iPhone, Samsung, giá, tồn kho hoặc đặt hàng nhé!')
      } else {
        data.forEach((m: { text?: string }) => { if (m.text) addMsg('bot', m.text) })
      }
    } catch {
      setTyping(false)
      addMsg('bot', '❌ Không kết nối được chatbot.\n📞 Hotline: **097.120.66.88**')
    }
  }

  return (
    <>
      {/* Toggle button — vàng đen */}
      <div onClick={toggleOpen} style={{
        position: 'fixed', right: 24, bottom: 24,
        width: 62, height: 62,
        background: open
          ? 'linear-gradient(135deg,#FFC107,#e6a800)'
          : 'linear-gradient(135deg,#1a1a1a,#2d2d2d)',
        border: '2.5px solid #FFC107',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 999999,
        boxShadow: '0 4px 24px rgba(255,193,7,.45), 0 2px 8px rgba(0,0,0,.5)',
        fontSize: 26, userSelect: 'none',
        transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <span>{open ? '✕' : '📱'}</span>
        {badge && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, background: '#ff3b30',
            borderRadius: '50%', fontSize: 11, fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>1</div>
        )}
      </div>

      {/* Chat box — vàng đen */}
      <div style={{
        position: 'fixed', right: 24, bottom: 98,
        width: 385, height: 590,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 16px 56px rgba(0,0,0,.25), 0 2px 8px rgba(255,193,7,.12)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: 999998,
        fontFamily: "'Be Vietnam Pro', Arial, sans-serif",
        transformOrigin: 'bottom right',
        transform: open ? 'scale(1) translateY(0)' : 'scale(.82) translateY(24px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'transform .38s cubic-bezier(.16,1,.3,1), opacity .38s cubic-bezier(.16,1,.3,1)',
      }}>
        {/* Header vàng đen */}
        <div style={{
          background: 'linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '2.5px solid #FFC107', flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, background: '#FFC107', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(255,193,7,.3)',
          }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#FFC107', letterSpacing: .2 }}>MobileCity Assistant</div>
            <div style={{ fontSize: 11.5, color: '#999', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 7, height: 7, background: '#34d058', borderRadius: '50%', display: 'inline-block', animation: 'blink 2s infinite' }} />
              Tư vấn trực tuyến 24/7
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#777', fontSize: 20, cursor: 'pointer', padding: 5, borderRadius: '50%', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FFC107'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,193,7,.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#777'; (e.currentTarget as HTMLElement).style.background = 'none' }}
          >✕</button>
        </div>

        {/* Messages */}
        <div ref={msgsRef} style={{
          flex: 1, padding: '14px 12px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10,
          background: '#f6f7f8', scrollBehavior: 'smooth',
        }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: m.sender === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#1a1a1a', border: '2px solid #FFC107',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>📱</div>
              <div>
                <div style={{
                  padding: '9px 13px', borderRadius: 18,
                  maxWidth: '80%', fontSize: 13.5, lineHeight: 1.65, wordBreak: 'break-word',
                  background: m.sender === 'user' ? 'linear-gradient(135deg,#1a1a1a,#333)' : '#fff',
                  color: m.sender === 'user' ? '#FFC107' : '#1a1a1a',
                  borderBottomRightRadius: m.sender === 'user' ? 5 : 18,
                  borderBottomLeftRadius: m.sender === 'bot' ? 5 : 18,
                  boxShadow: '0 1px 5px rgba(0,0,0,.09)',
                }}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }}
                />
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 3, textAlign: m.sender === 'user' ? 'right' : 'left' }}>{m.time}</div>
              </div>
            </div>
          ))}

          {/* Quick replies */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 38, paddingTop: 4 }}>
              {QUICK_REPLIES.map(q => (
                <button key={q.label} onClick={() => send(q.text)} style={{
                  border: '1.5px solid #FFC107', background: '#fff', color: '#1a1a1a',
                  borderRadius: 99, padding: '5px 12px', fontSize: 12,
                  fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500,
                  transition: 'all .2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFC107'; (e.currentTarget as HTMLElement).style.color = '#1a1a1a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.transform = '' }}
                >{q.label}</button>
              ))}
            </div>
          )}

          {/* Typing */}
          {typing && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a1a', border: '2px solid #FFC107', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📱</div>
              <div style={{ background: '#fff', borderRadius: 18, borderBottomLeftRadius: 5, padding: '10px 14px', display: 'flex', gap: 5, boxShadow: '0 1px 5px rgba(0,0,0,.09)' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, background: '#FFC107', borderRadius: '50%', display: 'inline-block', animation: `dotBounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Nhập câu hỏi về điện thoại..."
            style={{ flex: 1, border: '1.5px solid #e5e5e5', borderRadius: 99, padding: '8px 15px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#fafafa', transition: 'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = '#FFC107'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
          <button onClick={() => send()} style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg,#FFC107,#e6a800)',
            color: '#1a1a1a', border: 'none', borderRadius: '50%',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
          }}>➤</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10.5, color: '#ccc', padding: '3px 0 6px', background: '#fff', flexShrink: 0 }}>
          Powered by MobileCity AI · Rasa + Gemini
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-7px);opacity:1} }
      `}</style>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  const [slide, setSlide] = useState(0)
  const [searchVal, setSearchVal] = useState('')

  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p + 1) % BANNERS.length), 4500)
    return () => clearInterval(t)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) window.location.href = `https://mobilecity.vn/tim-kiem?keyword=${encodeURIComponent(searchVal)}`
  }

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro', Arial, sans-serif", fontSize: 14, color: '#333', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#c69a39', position: 'sticky', top: 0, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>

        {/* Top bar */}
        <div style={{ background: '#1a1a1a', padding: '6px 0', borderBottom: '1px solid #c69a39' }}>
          <div style={{ maxWidth: 1170, margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#FFC107', fontSize: 13, fontWeight: 600 }}>
              📞 Hotline CSKH: <span style={{ color: '#fff' }}>097.120.66.88</span>
              <span style={{ color: '#555', margin: '0 8px' }}>|</span>
              <span style={{ color: '#ccc' }}>📍 Hà Nội – TP.HCM – Đà Nẵng</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['Tin tức', 'tin-tuc'], ['Events', 'event'], ['Tra cứu BH', 'tra-cuu-bao-hanh']].map(([label, slug]) => (
                <a key={label} href={`https://mobilecity.vn/${slug}`} style={{ color: '#ccc', fontSize: 12, textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#FFC107'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#ccc'}
                >{label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Main row */}
        <div style={{ maxWidth: 1170, margin: '0 auto', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo */}
          <a href="/" style={{ flexShrink: 0, width: 200 }}>
            <img src="https://cdn.mobilecity.vn/mobilecity-vn/images/2023/04/logo-mobilecity-1.png.webp" alt="MobileCity"
              style={{ width: '100%', maxHeight: 52, objectFit: 'contain' }} />
          </a>

          {/* Location */}
          <div style={{ background: '#8a6c1c', borderRadius: 6, padding: '6px 10px', minWidth: 120, flexShrink: 0 }}>
            <p style={{ color: '#fff', fontSize: 10, marginBottom: 2 }}>Xem giá, tồn kho tại:</p>
            <select style={{ color: '#fff', fontSize: 12, fontWeight: 700, background: 'transparent', border: 'none', outline: 'none', width: '100%', cursor: 'pointer' }}>
              <option style={{ color: '#333' }}>Hà Nội</option>
              <option style={{ color: '#333' }}>TP. Hồ Chí Minh</option>
              <option style={{ color: '#333' }}>Đà Nẵng</option>
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Tìm kiếm sản phẩm ..."
              style={{ width: '100%', height: 40, border: 'none', borderRadius: 6, padding: '0 44px 0 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ position: 'absolute', right: 0, top: 0, width: 40, height: 40, background: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 16, color: '#c69a39' }}>🔍</button>
          </form>

          {/* Auth với icon thật */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { img: 'https://mobilecity.vn/assets/img/icon_login.png', label: 'Đăng nhập', url: 'https://mobilecity.vn/login' },
              { img: 'https://mobilecity.vn/assets/img/icon_login.png', label: 'Đăng ký', url: 'https://mobilecity.vn/register' },
            ].map(btn => (
              <a key={btn.label} href={btn.url} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: '#8a6c1c', color: '#fff',
                padding: '5px 12px', borderRadius: 6,
                fontSize: 11, fontWeight: 600, gap: 2, minWidth: 70,
                textDecoration: 'none', transition: 'background .2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#6b5515'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#8a6c1c'}
              >
                <img src={btn.img} alt={btn.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                {btn.label}
              </a>
            ))}
          </div>
        </div>

        {/* Navbar với icon thật từ mobilecity.vn */}
        <nav style={{ background: '#b8892e', borderTop: '1px solid rgba(255,255,255,.15)' }}>
          <div style={{ maxWidth: 1170, margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
            {NAV_ITEMS.map(item => (
              <a key={item.label} href={item.url} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: '#fff', fontSize: 13.5, fontWeight: 700,
                padding: '11px 14px', whiteSpace: 'nowrap',
                textDecoration: 'none', textTransform: 'uppercase',
                letterSpacing: 0.2, transition: 'background .2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.18)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <img src={item.icon} alt={item.label} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main>
        <div style={{ maxWidth: 1170, margin: '0 auto', padding: '16px 15px' }}>

          {/* Banner */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', height: 300, background: '#1a1a1a' }}>
              <div style={{ display: 'flex', height: '100%', transition: 'transform .6s ease', transform: `translateX(-${slide * 100}%)` }}>
                {BANNERS.map((b, i) => (
                  <a key={i} href={b.url} style={{ flexShrink: 0, width: '100%', height: '100%', display: 'block' }}>
                    <img src={b.img} alt={`Banner ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
              <button onClick={() => setSlide(p => (p - 1 + BANNERS.length) % BANNERS.length)}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.4)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>&#8249;</button>
              <button onClick={() => setSlide(p => (p + 1) % BANNERS.length)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.4)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>&#8250;</button>
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {BANNERS.map((_, i) => (
                  <span key={i} onClick={() => setSlide(i)}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: i === slide ? '#FFC107' : 'rgba(255,255,255,.5)', cursor: 'pointer', transition: 'background .2s' }} />
                ))}
              </div>
            </div>
          </section>

          {/* Category */}
          <section style={{ marginBottom: 16, padding: 20, background: 'linear-gradient(135deg,#fdf8ee,#f5edd5)', borderRadius: 12, border: '1px solid #e8d5a0' }}>
            <h2 style={{ color: '#c69a39', fontSize: 17, marginBottom: 14, fontWeight: 700 }}>🛍️ Danh mục sản phẩm</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NAV_ITEMS.map(item => (
                <a key={item.label} href={item.url} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', background: '#c69a39', color: '#fff',
                  borderRadius: 8, fontWeight: 600, fontSize: 13.5,
                  textDecoration: 'none', transition: 'all .2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#FFC107'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#c69a39'; (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.transform = '' }}
                >
                  <img src={item.icon} alt={item.label} style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  {item.label}
                </a>
              ))}
            </div>
          </section>

          {/* Products */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 14px', borderLeft: '4px solid #c69a39', paddingLeft: 12 }}>
            <h2 style={{ color: '#c69a39', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="https://mobilecity.vn/assets/img/icon_header/smartPhone.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain', filter: 'invert(65%) sepia(60%) saturate(500%) hue-rotate(5deg)' }} />
              Điện thoại nổi bật
            </h2>
            <a href="https://mobilecity.vn/dien-thoai" style={{ color: '#c69a39', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Xem tất cả →</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
            {PRODUCTS.map((p, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #efefef', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all .25s' }}
                onClick={() => window.location.href = p.url}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = '#c69a39' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.borderColor = '#efefef' }}
              >
                <div style={{ position: 'relative', background: '#f9f9f9', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.badge && (
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#c69a39', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{p.badge}</span>
                  )}
                  <img src={p.img} alt={p.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} loading="lazy" />
                </div>
                <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                  <p style={{ color: '#e00', fontWeight: 700, fontSize: 15 }}>{p.price}</p>
                  <button style={{ marginTop: 'auto', background: '#c69a39', color: '#fff', border: 'none', borderRadius: 6, padding: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mua ngay</button>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <section style={{ background: '#fdf8ee', borderRadius: 12, border: '1px solid #e8d5a0', padding: 24, marginTop: 8 }}>
            <h2 style={{ color: '#c69a39', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>MobileCity – Chuỗi cửa hàng điện thoại uy tín</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>
              Được thành lập từ ngày 10/6/2014, MobileCity là một trong những chuỗi cửa hàng điện thoại hàng đầu Việt Nam với hơn 6 chi nhánh tại Hà Nội, Đà Nẵng và TP.HCM.
            </p>
            <h3 style={{ color: '#c69a39', fontSize: 15, fontWeight: 700, margin: '14px 0 6px' }}>🏆 Cam kết của MobileCity</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#444' }}>
              ✅ Sản phẩm <strong>chính hãng 100%</strong><br />
              ✅ <strong>Bảo hành 12–18 tháng</strong> toàn quốc<br />
              ✅ <strong>Trả góp 0%</strong> lãi suất, duyệt nhanh 15 phút<br />
              ✅ <strong>Đổi mới trong 30 ngày</strong> nếu có lỗi NSX<br />
              ✅ Giao hàng <strong>2 giờ</strong> nội thành HN & HCM
            </p>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a1a1a', color: '#ccc', marginTop: 40 }}>
        <div style={{ maxWidth: 1170, margin: '0 auto', padding: '32px 15px', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h4 style={{ color: '#FFC107', fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>🏪 Hệ thống cửa hàng</h4>
            <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.9 }}>
              <strong style={{ color: '#FFC107' }}>Hà Nội:</strong><br />
              120 Thái Hà, Q.Đống Đa<br />
              398 Cầu Giấy | 42 Phố Vọng<br /><br />
              <strong style={{ color: '#FFC107' }}>TP.HCM:</strong> 602 Lê Hồng Phong<br />
              <strong style={{ color: '#FFC107' }}>Đà Nẵng:</strong> 97 Hàm Nghi<br /><br />
              📞 CSKH: <span style={{ color: '#FFC107', fontWeight: 700, fontSize: 15 }}>097.120.66.88</span>
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h4 style={{ color: '#FFC107', fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>📋 Chính sách</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['Chính sách bảo hành', 'Chính sách vận chuyển', 'Chính sách đổi trả', 'Hướng dẫn thanh toán', 'Mua hàng Online'].map(t => (
                <a key={t} href="https://mobilecity.vn" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#FFC107'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#aaa'}
                >{t}</a>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h4 style={{ color: '#FFC107', fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>🔗 Kết nối</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['📘 Facebook', 'https://www.facebook.com/MobileCity.vn'], ['▶️ Youtube', 'https://www.youtube.com/@MobileCity3'], ['💬 Zalo OA', 'https://zalo.me/2709729516030357642'], ['📸 Instagram', 'https://www.instagram.com/mobilecityvn/'], ['🎵 TikTok', 'https://www.tiktok.com/@mobilecity.vn']].map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="nofollow" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#FFC107'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#aaa'}
                >{label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#666', padding: '14px 0', borderTop: '1px solid #333' }}>
          © 2024 – MobileCity | Chuỗi cửa hàng điện thoại chính hãng uy tín
        </div>
      </footer>

      {/* ── CHATBOT ── */}
      <Chatbot />
    </div>
  )
}