'use client'
import { useEffect, useState, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '@/lib/api'
import { Search, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã huỷ' },
]

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-600',
  confirmed: 'bg-blue-50 text-blue-600',
  processing: 'bg-purple-50 text-purple-600',
  shipped: 'bg-cyan-50 text-cyan-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500',
}

export default function OrdersPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const load = useCallback(() => {
    setLoading(true)
    getOrders({ page, limit: 10, search: search || undefined, status: status || undefined })
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateOrderStatus(id, newStatus)
    load()
    if (selected?.id === id) setSelected({ ...selected, status: newStatus })
  }

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫'
  const totalPages = Math.ceil(data.total / 10)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-400 text-sm">{data.total} đơn hàng</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            placeholder="Tìm tên, SĐT, mã đơn..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s.value}
              onClick={() => { setStatus(s.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                status === s.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Mã đơn</th>
                  <th className="table-header">Khách hàng</th>
                  <th className="table-header">Sản phẩm</th>
                  <th className="table-header">Trạng thái</th>
                  <th className="table-header">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                ) : data.data.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">
                    <ShoppingCart size={40} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400">Không có đơn hàng</p>
                  </td></tr>
                ) : data.data.map((o: any) => (
                  <tr key={o.id}
                    onClick={() => setSelected(o)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selected?.id === o.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="table-cell font-mono font-semibold text-orange-600 text-xs">{o.order_code}</td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-800">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.customer_phone}</p>
                    </td>
                    <td className="table-cell text-xs text-gray-600 max-w-[120px] truncate">{o.product_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLE[o.status] || 'bg-gray-50 text-gray-500'}`}>
                        {STATUSES.find(s => s.value === o.status)?.label || o.status}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="card">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Chi tiết đơn hàng</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 text-xs hover:text-gray-600">✕ Đóng</button>
              </div>

              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Mã đơn hàng</p>
                <p className="font-mono font-bold text-orange-600 text-lg">{selected.order_code}</p>
              </div>

              <div className="space-y-3">
                {[
                  ['Khách hàng', selected.customer_name],
                  ['Số điện thoại', selected.customer_phone],
                  ['Địa chỉ', selected.customer_address],
                  ['Sản phẩm', selected.product_name],
                  ['Giá', selected.product_price ? new Intl.NumberFormat('vi-VN').format(selected.product_price) + '₫' : '—'],
                  ['Thanh toán', selected.payment_method],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700 text-right max-w-[160px]">{value || '—'}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Cập nhật trạng thái:</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.filter(s => s.value).map(s => (
                    <button key={s.value}
                      onClick={() => handleStatusChange(selected.id, s.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                        selected.status === s.value
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-300">
              <ShoppingCart size={40} className="mx-auto mb-2" />
              <p className="text-sm">Chọn đơn hàng để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
