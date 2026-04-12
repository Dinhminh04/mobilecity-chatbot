import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Dashboard
export const getDashboardStats = () => api.get('/api/dashboard/stats').then(r => r.data)

// Products
export const getProducts = (params?: any) => api.get('/api/products', { params }).then(r => r.data)
export const getProduct = (id: number) => api.get(`/api/products/${id}`).then(r => r.data)
export const createProduct = (data: any) => api.post('/api/products', data).then(r => r.data)
export const updateProduct = (id: number, data: any) => api.put(`/api/products/${id}`, data).then(r => r.data)
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}`).then(r => r.data)

// Orders
export const getOrders = (params?: any) => api.get('/api/orders', { params }).then(r => r.data)
export const updateOrderStatus = (id: number, status: string) =>
  api.put(`/api/orders/${id}/status`, { status }).then(r => r.data)

// Conversations
export const getConversations = (params?: any) => api.get('/api/conversations', { params }).then(r => r.data)
export const getConversationDetail = (sessionId: string) =>
  api.get(`/api/conversations/${sessionId}`).then(r => r.data)

// Handoffs
export const getHandoffs = (params?: any) => api.get('/api/handoffs', { params }).then(r => r.data)
export const updateHandoff = (id: number, data: any) => api.put(`/api/handoffs/${id}`, data).then(r => r.data)

export default api
