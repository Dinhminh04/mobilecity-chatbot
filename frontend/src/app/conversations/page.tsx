'use client'
import { useEffect, useState, useCallback } from 'react'
import { getConversations, getConversationDetail } from '@/lib/api'
import { MessageSquare, User, Bot, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ConversationsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getConversations({ page, limit: 15 })
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const loadDetail = (sessionId: string) => {
    setSelected(sessionId)
    setDetailLoading(true)
    getConversationDetail(sessionId)
      .then(setDetail).catch(console.error).finally(() => setDetailLoading(false))
  }

  const totalPages = Math.ceil(data.total / 15)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử hội thoại</h1>
        <p className="text-gray-400 text-sm">{data.total} phiên hội thoại</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Session list */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Danh sách phiên</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Đang tải...</div>
            ) : data.data.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={40} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Chưa có hội thoại nào</p>
              </div>
            ) : data.data.map((s: any) => (
              <div key={s.session_id}
                onClick={() => loadDetail(s.session_id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selected === s.session_id ? 'bg-orange-50 border-l-2 border-orange-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-gray-500 truncate max-w-[120px]">{s.session_id}</p>
                      <p className="text-xs text-gray-400">{s.message_count} tin nhắn</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(s.last_message_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                {s.last_user_message && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1 pl-10">{s.last_user_message}</p>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Trang {page}/{totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1 rounded border border-gray-200 disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1 rounded border border-gray-200 disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat detail */}
        <div className="lg:col-span-3 card p-0 overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-mono text-gray-500">Session: {selected}</p>
                {detail && <p className="text-xs text-gray-400">{detail.messages?.length} tin nhắn</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {detailLoading ? (
                  <div className="text-center py-8 text-gray-400">Đang tải...</div>
                ) : detail?.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'user' ? 'bg-orange-500' : 'bg-gray-200'
                      }`}>
                        {msg.sender === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-gray-500" />}
                      </div>
                      <div>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          msg.sender === 'user'
                            ? 'bg-orange-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.message}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                          <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString('vi-VN')}</p>
                          {msg.intent && (
                            <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">
                              {msg.intent} ({Math.round((msg.confidence || 0) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3" />
                <p>Chọn một phiên để xem hội thoại</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
