'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart,
  MessageSquare, Bell, Menu, X, Smartphone, LogOut
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/products',      label: 'Sản phẩm',          icon: Package },
  { href: '/orders',        label: 'Đơn hàng',          icon: ShoppingCart },
  { href: '/conversations', label: 'Hội thoại',         icon: MessageSquare },
  { href: '/handoffs',      label: 'Handoff Requests',  icon: Bell },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoginPage = pathname === '/login'

  const handleLogout = () => {
    // Xóa cookie
    document.cookie = 'mc_token=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  return (
    <html lang="vi">
      <head>
        <title>MobileCity Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* Trang login không có sidebar */}
        {isLoginPage ? (
          <>{children}</>
        ) : (
          <div className="flex h-screen overflow-hidden bg-slate-100">
            {/* Sidebar */}
            <aside className={`
              fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300
              lg:relative lg:translate-x-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">MobileCity</p>
                  <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Nav */}
              <nav className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">Menu</p>
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`sidebar-link ${pathname.startsWith(href) ? 'active' : 'text-gray-600'}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Footer — user + logout */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Admin</p>
                    <p className="text-xs text-gray-400">MobileCity</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </aside>

            {/* Overlay mobile */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                  <Menu size={22} />
                </button>
                <div className="hidden lg:block">
                  <h2 className="text-gray-500 text-sm">
                    {navItems.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
                  </h2>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-gray-500">Chatbot MobileCity v1.0</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
                  {/* Logout button trên header (mobile) */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors ml-2"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                </div>
              </header>

              {/* Page content */}
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}
