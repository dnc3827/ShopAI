import React from 'react';
import { Link } from 'react-router-dom';
import type { ApiProduct } from '../../lib/api';
import { Badge } from './Badge';

interface ProductCardProps {
  product: ApiProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const variants = product.product_variants || [];
  const startingPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
  const totalInventory = variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0);
  const isLowStock = totalInventory > 0 && totalInventory < 5;
  const isOutOfStock = totalInventory === 0;

  const imageUrl = product.thumbnail_url;
  const isComingSoon = product.status === 'coming_soon';

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col h-full">
      <article className="relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full overflow-hidden">
        {/* Image / Thumbnail Section */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-50 flex-shrink-0">
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

          {/* Badges overlaid on image */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
            {isComingSoon && (
              <Badge variant="warning" className="bg-amber-50/95 text-amber-700 shadow-sm px-2 py-0.5">
                Sắp ra mắt
              </Badge>
            )}
            {!isComingSoon && isOutOfStock && (
              <Badge variant="error" className="bg-red-50/95 text-red-700 shadow-sm px-2 py-0.5">
                Hết hàng
              </Badge>
            )}
            {!isComingSoon && isLowStock && (
              <Badge variant="warning" className="bg-amber-50/95 text-amber-700 shadow-sm px-2 py-0.5">
                Sắp hết
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-4 gap-2 bg-white">
          {/* Category Badge */}
          <div>
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-100">
              {product.categories?.name || 'Danh mục khác'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-lg font-semibold text-slate-800 transition-colors group-hover:text-primary line-clamp-2 min-h-[56px] leading-snug">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-2 leading-relaxed">
              {stripHtml(product.description)}
            </p>
          )}

          {/* Price Section */}
          <div className="mt-auto pt-2 border-t border-slate-50">
            <span className="text-blue-600 font-bold text-lg">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(startingPrice)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};
