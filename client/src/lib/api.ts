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
