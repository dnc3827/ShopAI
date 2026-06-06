import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { ProductCard } from '../components/ui/ProductCard';

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
      <div className="bg-slate-50 min-h-screen flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 md:p-12 text-center text-white mb-10 shadow-lg shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3 max-w-3xl mx-auto leading-tight">
            Nền tảng cung cấp tài khoản AI
          </h1>
          <p className="text-blue-100 text-base md:text-lg font-medium">
            Giao hàng tự động tức thì 24/7
          </p>
        </div>

        {/* Filter / Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 text-sm rounded-full font-medium border transition-all cursor-pointer ${activeCategory === 'all'
                ? 'bg-blue-50 text-primary border-blue-200 shadow-sm font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
          >
            Tất cả
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2 text-sm rounded-full font-medium border transition-all cursor-pointer ${activeCategory === category.id
                  ? 'bg-blue-50 text-primary border-blue-200 shadow-sm font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500 font-medium">
            Chưa có sản phẩm nào trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
