import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mock';
import { Card, CardBody } from '../components/ui/Card';
import { Headline, Title, Body, Label } from '../components/ui/Typography';
import { Badge } from '../components/ui/Badge';

export const HomePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = activeCategory === 'all' 
    ? MOCK_PRODUCTS 
    : MOCK_PRODUCTS.filter(p => p.category_id === activeCategory);

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
        {MOCK_CATEGORIES.map(category => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const startingPrice = Math.min(...product.variants.map(v => v.price));
          const totalInventory = product.variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0);
          const isLowStock = totalInventory > 0 && totalInventory < 5;
          const isOutOfStock = totalInventory === 0;

          return (
            <Link key={product.id} to={`/product/${product.id}`} className="group h-full">
              <Card className="h-full hover:shadow-md transition-shadow border-slate-200 hover:border-primary/30 flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      No Image
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
                      {MOCK_CATEGORIES.find(c => c.id === product.category_id)?.name}
                    </Label>
                  </div>
                  <Title className="text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</Title>
                  <Body className="text-sm line-clamp-2 mb-4 flex-grow">{product.description}</Body>
                  
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
    </div>
  );
};
