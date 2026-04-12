'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/api'
import {
  Package, ShoppingCart, MessageSquare, Bell,
  TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f97316',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

const STATUS_VN: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!stats) return (
    <div className="card text-center py-12">
      <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
      <p className="text-gray-500">Không thể tải dữ liệu. Kiểm tra kết nối backend.</p>
    </div>
  )

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Tổng quan hệ thống Chatbot MobileCity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Tổng sản phẩm" value={stats.total_products}
          color="bg-blue-500" sub="Đang kinh doanh" />
        <StatCard icon={ShoppingCart} label="Tổng đơn hàng" value={stats.total_orders}
          color="bg-orange-500" sub={`${stats.pending_orders} đang chờ`} />
        <StatCard icon={MessageSquare} label="Phiên hội thoại" value={stats.total_sessions}
          color="bg-purple-500" sub="Tổng tất cả" />
        <StatCard icon={Bell} label="Handoff chờ" value={stats.pending_handoffs}
          color="bg-red-500" sub="Cần xử lý" />
      </div>

      {/* Revenue */}
      <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Doanh thu (đơn đã giao)</p>
            <p className="text-3xl font-bold mt-1">{formatVND(stats.total_revenue)}</p>
          </div>
          <TrendingUp size={48} className="text-orange-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status - pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Đơn hàng theo trạng thái</h3>
          {stats.orders_by_status?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.orders_by_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${STATUS_VN[status] || status}: ${count}`}
                >
                  {stats.orders_by_status.map((entry: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, STATUS_VN[name as string] || name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">Chưa có đơn hàng</p>}
        </div>

        {/* Top products - bar */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm bán chạy</h3>
          {stats.top_products?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.top_products} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 14 ? v.substring(0, 14) + '…' : v} />
                <Tooltip />
                <Bar dataKey="order_count" fill="#f97316" radius={[0, 4, 4, 0]} name="Đơn hàng" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Mã đơn</th>
                <th className="table-header">Khách hàng</th>
                <th className="table-header">Sản phẩm</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders?.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell font-mono font-medium text-orange-600">{o.order_code}</td>
                  <td className="table-cell">
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.customer_phone}</p>
                  </td>
                  <td className="table-cell text-gray-600">{o.product_name || '—'}</td>
                  <td className="table-cell">
                    <span className="badge" style={{
                      backgroundColor: (STATUS_COLORS[o.status] || '#94a3b8') + '20',
                      color: STATUS_COLORS[o.status] || '#94a3b8'
                    }}>
                      {STATUS_VN[o.status] || o.status}
                    </span>
                  </td>
                  <td className="table-cell text-gray-400 text-xs">
                    {new Date(o.created_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
