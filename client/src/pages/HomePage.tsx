import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { htmlToPlainText } from '../lib/text';
import { Card, CardBody } from '../components/ui/Card';
import { Headline, Title, Body, Label } from '../components/ui/Typography';
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
            const descriptionText = htmlToPlainText(product.description);

            return (
              <Link key={product.id} to={`/product/${product.id}`} className="group h-full">
                <Card className="h-full hover:shadow-md transition-shadow border-slate-200 hover:border-primary/30 flex flex-col">
                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200 font-medium">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {isOutOfStock && <Badge variant="error">Hết hàng</Badge>}
                      {isLowStock && <Badge variant="warning">Sắp hết hàng</Badge>}
                    </div>
                  </div>
                  
                  <CardBody className="flex flex-col flex-grow p-5">
                    <div className="mb-1">
                      <Label className="text-xs text-primary font-semibold tracking-wider uppercase">
                        {product.categories?.name || 'Danh mục khác'}
                      </Label>
                    </div>
                    <Title className="text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</Title>
                    <Body className="text-sm line-clamp-2 mb-4 flex-grow">{descriptionText}</Body>
                    
                    <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                      <span className="text-sm text-slate-500">Giá từ</span>
                      <span className="font-bold text-lg text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(startingPrice)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
