import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import { fetchProducts } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { ProductCard } from '../components/ui/ProductCard';

export const HomePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Logic Chọn Sản Phẩm Nổi Bật (Ưu tiên sản phẩm bán chạy nhất)
  let featuredProduct = null;
  if (products.length > 0) {
    const maxSold = Math.max(...products.map(p => p.sold_count || 0));

    if (maxSold > 0) {
      // Có data bán hàng thật → lấy sản phẩm bán chạy nhất
      const topSellingProducts = products.filter(p => (p.sold_count || 0) === maxSold);
      // Nếu có nhiều sản phẩm cùng lượt bán, chọn ngẫu nhiên 1 cái
      featuredProduct = topSellingProducts[Math.floor(Math.random() * topSellingProducts.length)];
    } else {
      // Chưa có lượt bán nào → lấy sản phẩm đầu tiên (ổn định, không nhảy lung tung)
      featuredProduct = products[0];
    }
  }

  // Tính toán dữ liệu cho featuredProduct
  const featuredVariants = featuredProduct?.product_variants || [];
  const featuredStartingPrice = featuredVariants.length > 0 ? Math.min(...featuredVariants.map(v => v.price)) : 0;
  const featuredTotalInventory = featuredVariants.reduce((acc, v) => acc + (v.inventory_count || 0), 0);
  const featuredIsLowStock = featuredTotalInventory > 0 && featuredTotalInventory < 5;
  const featuredIsOutOfStock = featuredTotalInventory === 0;
  const featuredImageUrl = featuredProduct?.thumbnail_url;
  const featuredIsComingSoon = featuredProduct?.status === 'coming_soon';

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

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12">
        
        {/* Hero Section - Split Layout */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-pill p-6 md:p-10 text-white mb-6 shadow-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Decorative glowing blobs */}
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-y-1/2"></div>
          
          {/* Left Column: Text & Search */}
          <div className="flex-1 w-full md:max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white/90 mb-4">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tài khoản AI chất lượng cao</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Khám phá thế giới <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white">Tài khoản AI</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl font-medium mb-8 max-w-lg">
              Giao hàng tự động tức thì 24/7. Trải nghiệm các công cụ phần mềm hàng đầu với chi phí tối ưu nhất.
            </p>
            
            {/* Glassmorphism Search Bar */}
            <div className="relative max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm (vd: ChatGPT, Quizlet...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-white/95 backdrop-blur text-slate-900 rounded-custom focus:ring-4 focus:ring-primary/30 focus:border-primary border-none shadow-lg placeholder-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          {/* Right Column: Featured Product */}
          {featuredProduct && (
            <div className="hidden md:block flex-shrink-0 w-72 relative z-10 perspective-1000 animate-featured-float group">
              {/* Ánh sáng hắt đằng sau */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-amber-400 via-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Sparkles icon top-left */}
              <div className="absolute -left-6 -top-4 text-amber-300 animate-pulse pointer-events-none z-20">
                <Sparkles className="w-7 h-7 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)] fill-amber-300/30" />
              </div>
              {/* Zap icon bottom-right */}
              <div className="absolute -right-6 -bottom-4 text-blue-300 animate-bounce pointer-events-none z-20" style={{ animationDuration: '4s' }}>
                <Zap className="w-6 h-6 drop-shadow-[0_0_10px_rgba(147,197,253,0.6)] fill-blue-300/30" />
              </div>

              {/* Thẻ sản phẩm với hiệu ứng nghiêng */}
              <div className="relative transform rotate-y-[-12deg] rotate-x-[6deg] group-hover:rotate-y-0 group-hover:rotate-x-0 group-hover:scale-[1.03] transition-all duration-500 ease-out">
                {/* Nổi bật Badge */}
                <div className="absolute -top-3.5 -right-3.5 z-20">
                  <span className="relative flex">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                    <span className="relative inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-lg border border-amber-300/50">
                      <Sparkles className="w-3 h-3 text-amber-100 fill-amber-100 animate-pulse" />
                      Nổi bật
                    </span>
                  </span>
                </div>
                
                {/* Thẻ mẫu - thiết kế Glassmorphism trong suốt như ảnh 2 */}
                <div className="shadow-2xl rounded-2xl p-[3px] bg-gradient-to-br from-white/30 via-white/10 to-white/5 group-hover:from-white/50 group-hover:via-white/20 group-hover:to-white/10 transition-colors duration-500">
                  <div className="bg-white/10 backdrop-blur-xl rounded-[13px] overflow-hidden shine-effect border border-white/10">
                    <Link to={`/product/${featuredProduct.id}`} className="group flex flex-col h-full">
                      <article className="relative bg-transparent flex flex-col h-full overflow-hidden">
                        {/* Image / Thumbnail Section */}
                        <div className="p-3 bg-transparent">
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                            {featuredImageUrl ? (
                              <img
                                src={featuredImageUrl}
                                alt={featuredProduct.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-2xl font-bold text-white/30">
                                {featuredProduct.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Badges overlaid on image */}
                            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
                              {featuredIsComingSoon && (
                                <span className="inline-flex items-center rounded-custom bg-amber-400/80 px-2 py-0.5 text-xs font-semibold text-slate-900 border border-amber-300 backdrop-blur shadow-sm">
                                  Sắp ra mắt
                                </span>
                              )}
                              {!featuredIsComingSoon && featuredIsOutOfStock && (
                                <span className="inline-flex items-center rounded-custom bg-red-500/80 px-2 py-0.5 text-xs font-semibold text-white border border-red-400 backdrop-blur shadow-sm">
                                  Hết hàng
                                </span>
                              )}
                              {!featuredIsComingSoon && featuredIsLowStock && (
                                <span className="inline-flex items-center rounded-custom bg-amber-500/80 px-2 py-0.5 text-xs font-semibold text-white border border-amber-400 backdrop-blur shadow-sm">
                                  Sắp hết
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex flex-col flex-1 p-4 pt-1 gap-2 bg-transparent">
                          {/* Category Badge */}
                          <div>
                            <span className="inline-flex items-center rounded-custom bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-200 border border-white/10 backdrop-blur-sm">
                              {featuredProduct.categories?.name || 'Danh mục khác'}
                            </span>
                          </div>

                          {/* Product Name */}
                          <h3 className="text-lg font-bold text-white transition-colors group-hover:text-amber-300 line-clamp-2 min-h-[56px] leading-normal">
                            {featuredProduct.name}
                          </h3>

                          {/* Description */}
                          {featuredProduct.description && (
                            <p className="text-sm text-orange-100/70 line-clamp-2 mb-2 leading-normal font-normal">
                              {stripHtml(featuredProduct.description)}
                            </p>
                          )}

                          {/* Price Section */}
                          <div className="mt-auto pt-2.5 border-t border-white/10 flex justify-between items-center">
                            <span className="text-amber-300 font-extrabold text-xl drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(featuredStartingPrice)}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 group-hover:text-amber-300 transition-colors">
                              Mua ngay &rarr;
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-custom p-4 border border-slate-100 shadow-card flex items-center gap-4 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{products.length}+</p>
              <p className="text-sm font-medium text-slate-500">Sản phẩm chất lượng</p>
            </div>
          </div>
          <div className="bg-white rounded-custom p-4 border border-slate-100 shadow-card flex items-center gap-4 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
              <p className="text-sm font-medium text-slate-500">Danh mục chuyên biệt</p>
            </div>
          </div>
          <div className="bg-white rounded-custom p-4 border border-slate-100 shadow-card flex items-center gap-4 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">24/7</p>
              <p className="text-sm font-medium text-slate-500">Giao hàng tự động</p>
            </div>
          </div>
        </div>

        {/* Filter / Categories Pills */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10 sticky top-20 z-30 bg-slate-50/90 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 text-sm rounded-pill font-semibold border transition-all duration-200 cursor-pointer ${activeCategory === 'all'
                ? 'bg-primary text-white border-primary shadow-card'
                : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-primary border-slate-200 hover:border-primary shadow-card'
              }`}
          >
            Tất cả
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2 text-sm rounded-pill font-semibold border transition-all duration-200 cursor-pointer ${activeCategory === category.id
                  ? 'bg-primary text-white border-primary shadow-card'
                  : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-primary border-slate-200 hover:border-primary shadow-card'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-pill border border-slate-100 shadow-card">
            <div className="w-16 h-16 bg-surface rounded-pill flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy sản phẩm</h3>
            <p className="text-slate-500 font-medium">Vui lòng thử nghiệm bằng từ khóa khác hoặc bỏ chọn danh mục.</p>
          </div>
        ) : (
          /* Render theo section nếu ở trang "Tất cả" và không có search, ngược lại render lưới phẳng */
          (activeCategory === 'all' && searchQuery === '') ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                
                return (
                  <section key={cat.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {cat.name}
                        <span className="text-sm font-semibold bg-orange-100 text-primary px-2 py-0.5 rounded-pill">
                          {catProducts.length}
                        </span>
                      </h2>
                      <button 
                        onClick={() => {
                          setActiveCategory(cat.id);
                          window.scrollTo({ top: 500, behavior: 'smooth' });
                        }}
                        className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                      >
                        Xem tất cả &rarr;
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {catProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
