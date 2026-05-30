// client/src/lib/api.ts
// Axios instance with Supabase JWT auto-attach

import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Auto-attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Standard response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ---- API functions ----

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  category_id: string;
  thumbnail_url: string | null;
  categories: { id: string; name: string; slug: string } | null;
  product_variants: Array<{
    id: string;
    variant_name: string;
    price: number;
    type: 'account' | 'family';
    inventory_count: number;
  }>;
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  const res = await api.get<{ success: boolean; data: ApiProduct[] }>('/products');
  return res.data.data;
}

export async function fetchProductById(id: string): Promise<ApiProduct> {
  const res = await api.get<{ success: boolean; data: ApiProduct }>(`/products/${id}`);
  return res.data.data;
}

export interface CreateOrderResponse {
  orderId: string;
  orderCode: string;
  checkoutUrl: string;
  qrCode: string;
}

export async function createOrder(params: {
  variantId: string;
  productId: string;
  familyEmail?: string;
}): Promise<CreateOrderResponse> {
  const res = await api.post<{ success: boolean; data: CreateOrderResponse }>('/orders/create', params);
  return res.data.data;
}

// ---- Admin API functions ----

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiVariant {
  id: string;
  variant_name: string;
  price: number;
  type: 'account' | 'family';
  duration_days: number;
  product_id: string;
}

export interface AdminApiProduct {
  id: string;
  name: string;
  description: string;
  category_id: string;
  thumbnail_url: string | null;
  status: string;
  is_featured: boolean;
  slug: string;
  created_at: string;
  categories: { name: string } | null;
}

// Admin: Categories
export async function fetchAdminCategories(): Promise<ApiCategory[]> {
  const res = await api.get<{ success: boolean; data: ApiCategory[] }>('/admin/categories');
  return res.data.data;
}
export async function createAdminCategory(data: { name: string; slug: string }): Promise<ApiCategory> {
  const res = await api.post<{ success: boolean; data: ApiCategory }>('/admin/categories', data);
  return res.data.data;
}
export async function updateAdminCategory(id: string, data: { name?: string; slug?: string }): Promise<ApiCategory> {
  const res = await api.patch<{ success: boolean; data: ApiCategory }>(`/admin/categories/${id}`, data);
  return res.data.data;
}
export async function deleteAdminCategory(id: string): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

// Admin: Products
export async function fetchAdminProducts(): Promise<AdminApiProduct[]> {
  const res = await api.get<{ success: boolean; data: AdminApiProduct[] }>('/admin/products');
  return res.data.data;
}
export async function createAdminProduct(data: { name: string; description: string; category_id: string; thumbnail_url?: string; status: string; is_featured: boolean; slug?: string; }): Promise<AdminApiProduct> {
  const res = await api.post<{ success: boolean; data: AdminApiProduct }>('/admin/products', data);
  return res.data.data;
}
export async function updateAdminProduct(id: string, data: Partial<{ name: string; description: string; category_id: string; thumbnail_url: string; status: string; is_featured: boolean; slug: string; }>): Promise<AdminApiProduct> {
  const res = await api.patch<{ success: boolean; data: AdminApiProduct }>(`/admin/products/${id}`, data);
  return res.data.data;
}
export async function replaceAdminProduct(
  id: string,
  data: { name: string; description: string; category_id: string; thumbnail_url?: string; status: string; is_featured: boolean; slug: string; }
): Promise<AdminApiProduct> {
  const res = await api.put<{ success: boolean; data: AdminApiProduct }>(`/admin/products/${id}`, data);
  return res.data.data;
}
export async function deleteAdminProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

// Admin: Variants
export async function fetchAdminVariants(productId: string): Promise<ApiVariant[]> {
  const res = await api.get<{ success: boolean; data: ApiVariant[] }>(`/admin/variants/${productId}`);
  return res.data.data;
}
export async function createAdminVariant(data: { product_id: string; variant_name: string; price: number; type: 'account' | 'family'; duration_days: number; }): Promise<ApiVariant> {
  const res = await api.post<{ success: boolean; data: ApiVariant }>('/admin/variants', data);
  return res.data.data;
}
export async function updateAdminVariant(id: string, data: Partial<{ variant_name: string; price: number; type: 'account' | 'family'; duration_days: number; }>): Promise<ApiVariant> {
  const res = await api.patch<{ success: boolean; data: ApiVariant }>(`/admin/variants/${id}`, data);
  return res.data.data;
}
export async function replaceAdminVariant(
  id: string,
  data: { variant_name: string; price: number; type: 'account' | 'family'; duration_days: number; }
): Promise<ApiVariant> {
  const res = await api.put<{ success: boolean; data: ApiVariant }>(`/admin/variants/${id}`, data);
  return res.data.data;
}
export async function deleteAdminVariant(id: string): Promise<void> {
  await api.delete(`/admin/variants/${id}`);
}
