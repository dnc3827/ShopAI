export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  price: number;
  type: 'account' | 'family';
  inventory_count?: number; // Mock extra field for UI
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url?: string; // Additional field for UI mock
  variants: ProductVariant[];
}

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Tài khoản AI', slug: 'ai-accounts' },
  { id: '2', name: 'Giải trí', slug: 'entertainment' },
  { id: '3', name: 'Làm việc', slug: 'productivity' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    category_id: '1',
    name: 'ChatGPT Plus',
    description: 'Tài khoản ChatGPT Plus (GPT-4) sử dụng chung hoặc riêng. Tốc độ phản hồi cực nhanh, truy cập các tính năng mới nhất.',
    image_url: 'https://images.unsplash.com/photo-1676299081847-824916de030a?q=80&w=600&auto=format&fit=crop',
    variants: [
      { id: 'v1_1', product_id: 'p1', variant_name: 'Sử dụng chung (1 Tháng)', price: 99000, type: 'account', inventory_count: 3 },
      { id: 'v1_2', product_id: 'p1', variant_name: 'Gói riêng tư (1 Tháng)', price: 450000, type: 'account', inventory_count: 15 },
    ]
  },
  {
    id: 'p2',
    category_id: '1',
    name: 'Midjourney Pro',
    description: 'Tài khoản Midjourney tạo ảnh AI chất lượng cao. Fast GPU hours, thư giãn sáng tạo không giới hạn.',
    image_url: 'https://images.unsplash.com/photo-1684369175836-e6bf963e1850?q=80&w=600&auto=format&fit=crop',
    variants: [
      { id: 'v2_1', product_id: 'p2', variant_name: 'Gói Standard (1 Tháng)', price: 250000, type: 'account', inventory_count: 0 },
      { id: 'v2_2', product_id: 'p2', variant_name: 'Gói Pro (1 Tháng)', price: 650000, type: 'account', inventory_count: 8 },
    ]
  },
  {
    id: 'p3',
    category_id: '2',
    name: 'Netflix Premium',
    description: 'Xem phim chất lượng 4K HDR. Hỗ trợ xem trên nhiều thiết bị. Gói family add member an toàn.',
    image_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop',
    variants: [
      { id: 'v3_1', product_id: 'p3', variant_name: 'Slot Family (1 Tháng)', price: 65000, type: 'family', inventory_count: 99 },
    ]
  },
  {
    id: 'p4',
    category_id: '2',
    name: 'Spotify Premium',
    description: 'Nghe nhạc không quảng cáo, tải nhạc offline, chất lượng âm thanh cao cấp nhất. Mời vào Family Plan chính chủ.',
    image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=600&auto=format&fit=crop',
    variants: [
      { id: 'v4_1', product_id: 'p4', variant_name: 'Slot Family (1 Tháng)', price: 29000, type: 'family', inventory_count: 4 },
      { id: 'v4_2', product_id: 'p4', variant_name: 'Slot Family (6 Tháng)', price: 150000, type: 'family', inventory_count: 10 },
    ]
  },
];
