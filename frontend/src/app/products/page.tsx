'use client'
import { useEffect, useState, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api'
import { Plus, Search, Edit2, Trash2, X, Package, ChevronLeft, ChevronRight } from 'lucide-react'

const BRANDS = ['Apple', 'Samsung', 'OPPO', 'Xiaomi', 'Realme', 'Vivo', 'OnePlus']

const EMPTY_FORM = {
  name: '', brand: 'Apple', price: '', original_price: '',
  stock: '', warranty_months: 12, image_url: '',
  specs: { cpu: '', ram: '', storage: '', camera: '', battery: '', screen: '', os: '' },
  features: ''
}

export default function ProductsPage() {
  const [data, setData] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getProducts({ page, limit: 10, search: search || undefined, brand: brand || undefined })
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page, search, brand])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setModal('create')
  }

  const openEdit = (product: any) => {
    setForm({
      name: product.name, brand: product.brand,
      price: product.price, original_price: product.original_price || '',
      stock: product.stock, warranty_months: product.warranty_months,
      image_url: product.image_url || '',
      specs: product.specs || { cpu: '', ram: '', storage: '', camera: '', battery: '', screen: '', os: '' },
      features: (product.features || []).join(', ')
    })
    setEditTarget(product)
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseInt(form.price),
        original_price: form.original_price ? parseInt(form.original_price) : null,
        stock: parseInt(form.stock),
        features: form.features ? form.features.split(',').map((f: string) => f.trim()) : []
      }
      if (modal === 'create') await createProduct(payload)
      else await updateProduct(editTarget.id, payload)
      setModal(null)
      load()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Xoá sản phẩm "${name}"?`)) return
    await deleteProduct(id)
    load()
  }

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫'
  const totalPages = Math.ceil(data.total / 10)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-400 text-sm">{data.total} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          value={brand} onChange={e => { setBrand(e.target.value); setPage(1) }}
        >
          <option value="">Tất cả thương hiệu</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Sản phẩm</th>
                <th className="table-header">Thương hiệu</th>
                <th className="table-header">Giá bán</th>
                <th className="table-header">Tồn kho</th>
                <th className="table-header">Bảo hành</th>
                <th className="table-header">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Package size={40} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400">Không có sản phẩm nào</p>
                </td></tr>
              ) : data.data.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">ID: {p.id}</p>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-blue-50 text-blue-600">{p.brand}</span>
                  </td>
                  <td className="table-cell">
                    <p className="font-semibold text-orange-600">{formatVND(p.price)}</p>
                    {p.original_price && (
                      <p className="text-xs text-gray-400 line-through">{formatVND(p.original_price)}</p>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${p.stock > 5 ? 'bg-green-50 text-green-600' : p.stock > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
                      {p.stock} chiếc
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">{p.warranty_months} tháng</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tên sản phẩm *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Thương hiệu</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tồn kho</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Giá bán (VNĐ) *</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Giá gốc (VNĐ)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Thông số kỹ thuật</p>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                  {Object.entries(form.specs).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 capitalize block mb-1">{key}</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-white"
                        value={val as string}
                        onChange={e => setForm({...form, specs: {...form.specs, [key]: e.target.value}})} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tính năng nổi bật (cách nhau bằng dấu phẩy)</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  rows={2} value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">URL hình ảnh</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setModal(null)} className="btn-secondary">Huỷ</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[100px]">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
