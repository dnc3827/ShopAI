import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { Badge } from '../components/ui/Badge';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
    }).catch(err => {
      console.error('Failed to fetch products:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
        <p className="mt-4 text-slate-500">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {products.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Chưa có sản phẩm nào trong hệ thống. Hãy thêm sản phẩm ở trang quản trị!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const variants = product.product_variants || [];
            const startingPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
            const totalInventory = variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0);
            const isLowStock = totalInventory > 0 && totalInventory < 5;
            const isOutOfStock = totalInventory === 0;

            const imageUrl = product.thumbnail_url;
            console.log('thumbnail_url:', product.thumbnail_url);
            return (
              <Link key={product.id} to={`/product/${product.id}`} className="group h-full">
                <article className="relative flex h-full overflow-hidden rounded-[20px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
                  <div className="relative w-[38%] sm:w-[42%] aspect-square flex-shrink-0 overflow-hidden bg-slate-50">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-2xl font-bold text-slate-400">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute left-5 top-5 flex flex-col gap-2">
                      {isOutOfStock && <Badge variant="error" className="bg-red-50/95 text-red-700 shadow-sm px-2 py-1">Hết hàng</Badge>}
                      {isLowStock && <Badge variant="warning" className="bg-amber-50/95 text-amber-700 shadow-sm px-2 py-1">Sắp hết hàng</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex min-w-0 flex-1 flex-col gap-2 bg-white px-4 py-5">
                    <h2 className="min-h-[52px] text-[18px] font-bold leading-[1.2] text-slate-800 transition-colors line-clamp-2 group-hover:text-primary">
                      {product.name}
                    </h2>

                    <div>
                      <span className="inline-flex w-fit max-w-full items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-center text-xs font-bold uppercase leading-tight text-slate-600 shadow-sm whitespace-normal">
                        {product.categories?.name || 'Danh mục khác'}
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <span className="text-[18px] font-extrabold leading-none text-slate-950">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(startingPrice)}
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
