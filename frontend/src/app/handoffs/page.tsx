'use client'
import { useEffect, useState, useCallback } from 'react'
import { getHandoffs, updateHandoff } from '@/lib/api'
import { Bell, ChevronLeft, ChevronRight, CheckCircle, Clock, UserCheck } from 'lucide-react'

const STATUS_FILTER = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'assigned', label: 'Đã phân công' },
  { value: 'resolved', label: 'Đã giải quyết' },
]

const TRIGGER_VN: Record<string, string> = {
  manual: 'Khách yêu cầu',
  fallback: 'Bot không hiểu',
  out_of_scope: 'Ngoài phạm vi',
}

const STATUS_STYLE: Record<string, { cls: string; icon: any }> = {
  pending: { cls: 'bg-orange-50 text-orange-600', icon: Clock },
  assigned: { cls: 'bg-blue-50 text-blue-600', icon: UserCheck },
  resolved: { cls: 'bg-green-50 text-green-600', icon: CheckCircle },
}

export default function HandoffsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [staff, setStaff] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getHandoffs({ page, limit: 10, status: statusFilter || undefined })
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (newStatus: string) => {
    if (!selected) return
    setSaving(true)
    try {
      await updateHandoff(selected.id, { status: newStatus, assigned_staff: staff || undefined, note: note || undefined })
      load()
      setSelected({ ...selected, status: newStatus, assigned_staff: staff, note })
    } finally { setSaving(false) }
  }

  const totalPages = Math.ceil(data.total / 10)

  const pendingCount = data.data.filter((h: any) => h.status === 'pending').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Handoff Requests</h1>
          <p className="text-gray-400 text-sm">{data.total} yêu cầu chuyển nhân viên</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Bell size={16} className="animate-bounce" />
            {pendingCount} yêu cầu chờ xử lý
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTER.map(s => (
          <button key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >{s.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Phiên</th>
                  <th className="table-header">Khách hàng</th>
                  <th className="table-header">Lý do</th>
                  <th className="table-header">Fallback</th>
                  <th className="table-header">Trạng thái</th>
                  <th className="table-header">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                ) : data.data.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <Bell size={40} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400">Không có yêu cầu nào</p>
                  </td></tr>
                ) : data.data.map((h: any) => {
                  const style = STATUS_STYLE[h.status] || { cls: 'bg-gray-50 text-gray-500', icon: Clock }
                  const Icon = style.icon
                  return (
                    <tr key={h.id}
                      onClick={() => { setSelected(h); setStaff(h.assigned_staff || ''); setNote(h.note || '') }}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        selected?.id === h.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="table-cell font-mono text-xs text-gray-500 max-w-[80px] truncate">{h.session_id}</td>
                      <td className="table-cell">
                        <p className="font-medium text-sm">{h.customer_name || '—'}</p>
                        <p className="text-xs text-gray-400">{h.customer_phone || '—'}</p>
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-gray-100 text-gray-600 text-xs">
                          {TRIGGER_VN[h.trigger_reason] || h.trigger_reason}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${h.fallback_count > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                          {h.fallback_count}x
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge flex items-center gap-1 w-fit ${style.cls}`}>
                          <Icon size={11} />
                          {STATUS_FILTER.find(s => s.value === h.status)?.label || h.status}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  )
                })}
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

        {/* Action panel */}
        <div className="card">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Xử lý yêu cầu</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 text-xs">✕</button>
              </div>

              <div className="bg-orange-50 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Session ID</span>
                  <span className="font-mono text-xs text-gray-600 max-w-[120px] truncate">{selected.session_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lý do</span>
                  <span className="font-medium">{TRIGGER_VN[selected.trigger_reason]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fallback</span>
                  <span className="font-medium">{selected.fallback_count} lần</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nhân viên phụ trách</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Tên nhân viên..."
                  value={staff} onChange={e => setStaff(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Ghi chú</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  rows={3} placeholder="Ghi chú xử lý..."
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>

              <div className="space-y-2">
                <button onClick={() => handleUpdate('assigned')} disabled={saving}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <UserCheck size={14} className="inline mr-1" />
                  Phân công nhân viên
                </button>
                <button onClick={() => handleUpdate('resolved')} disabled={saving}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <CheckCircle size={14} className="inline mr-1" />
                  Đánh dấu đã giải quyết
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-300">
              <Bell size={40} className="mx-auto mb-2" />
              <p className="text-sm">Chọn yêu cầu để xử lý</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
