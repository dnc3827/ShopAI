import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { fetchProducts } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { Headline, Body } from '../components/ui/Typography';
import { Badge } from '../components/ui/Badge';

export const HomePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      
      // Extract unique categories from products
      const catsMap = new Map<string, { id: string; name: string }>();
      data.forEach(p => {
        if (p.categories && !catsMap.has(p.categories.id)) {
          catsMap.set(p.categories.id, { id: p.categories.id, name: p.categories.name });
        }
      });
      setCategories(Array.from(catsMap.values()));
    }).catch(err => {
      console.error('Failed to fetch products:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === activeCategory);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
        <p className="mt-4 text-slate-500">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <Headline className="mb-4">Phần mềm & Tài khoản bản quyền</Headline>
        <Body className="max-w-2xl mx-auto text-lg">
          Nền tảng cung cấp tài khoản tự động 100%. Giao hàng ngay lập tức sau khi thanh toán.
        </Body>
      </div>

      <div id="categories" className="flex flex-wrap items-center justify-center gap-4 mb-12">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
            activeCategory === 'all' 
              ? 'bg-slate-900 text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tất cả
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
              activeCategory === category.id 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Chưa có sản phẩm nào trong hệ thống. Hãy thêm sản phẩm ở trang quản trị!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const variants = product.product_variants || [];
            const startingPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
            const totalInventory = variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0);
            const isLowStock = totalInventory > 0 && totalInventory < 5;
            const isOutOfStock = totalInventory === 0;

            // Optional: fallback image logic if product table doesn't have image_url
            // Currently ApiProduct interface doesn't have image_url, but we handle gracefully
            const imageUrl = (product as any).image_url;

            return (
              <Link key={product.id} to={`/product/${product.id}`} className="group h-full">
                <article className="relative flex h-full min-h-[188px] overflow-hidden rounded-[20px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
                  <div className="relative w-[49%] flex-shrink-0 overflow-hidden bg-slate-200">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-lg font-semibold text-slate-400">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute left-5 top-5 flex flex-col gap-2">
                      {isOutOfStock && <Badge variant="error" className="bg-red-50/95 text-red-700 shadow-sm">Hết hàng</Badge>}
                      {isLowStock && <Badge variant="warning" className="bg-amber-50/95 text-amber-700 shadow-sm">Sắp hết hàng</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex min-w-0 flex-1 flex-col bg-white px-3.5 py-4 sm:px-4">
                    <h2 className="mb-4 min-h-[52px] text-[18px] font-bold leading-[1.2] text-slate-950 transition-colors line-clamp-2 group-hover:text-primary">
                      {product.name}
                    </h2>

                    <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                      <span className="min-w-0 rounded-full border border-slate-100 bg-white px-3 py-2 text-[10px] font-bold uppercase leading-tight text-slate-400 shadow-sm line-clamp-2">
                        {product.categories?.name || 'Danh mục khác'}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <ShoppingCart className="h-5 w-5 text-slate-400" />
                        {totalInventory}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-end justify-between gap-3">
                      <span className="text-[18px] font-extrabold leading-none text-slate-950">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(startingPrice)}
                      </span>
                      <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-lime-500 text-white shadow-[0_0_0_8px_rgba(132,204,22,0.20),0_8px_18px_rgba(101,163,13,0.35)] transition-transform duration-300 group-hover:scale-105">
                        <ShoppingCart className="h-7 w-7" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
