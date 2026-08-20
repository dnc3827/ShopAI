import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Settings, Menu, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProducts } from '../../lib/api';
import type { ApiProduct } from '../../lib/api';

export const Header: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      const catsMap = new Map<string, { id: string; name: string }>();
      data.forEach(p => {
        if (p.categories && !catsMap.has(p.categories.id)) {
          catsMap.set(p.categories.id, { id: p.categories.id, name: p.categories.name });
        }
      });
      const catsArray = Array.from(catsMap.values());
      setCategories(catsArray);
      if (catsArray.length > 0) {
        setHoveredCategory(catsArray[0].id);
      }
    }).catch(err => console.error('Failed to fetch products:', err));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Left: Logo & Mega Menu */}
        <div className="flex items-center gap-3 sm:gap-6 h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Shop<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Mega Menu Dropdown - desktop only */}
          <div className="hidden md:block group h-full">
            <div className="h-full flex items-center">
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-custom font-medium transition-colors">
                <Menu className="w-5 h-5" />
                <span>Danh mục</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {/* Dropdown Content */}
              <div className="absolute top-[100%] left-0 pt-2 w-[800px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left -translate-y-2 group-hover:translate-y-0 z-50">
                <div className="flex bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[300px]">
                  {/* Left: Categories */}
                  <div className="w-[35%] bg-slate-50 py-3 border-r border-slate-100 flex flex-col relative z-10">
                    {categories.map(cat => (
                      <div 
                        key={cat.id} 
                        onMouseEnter={() => setHoveredCategory(cat.id)}
                        className={`px-6 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                          hoveredCategory === cat.id 
                            ? 'bg-white text-primary font-medium shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] relative z-20 w-[calc(100%+1px)]' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${hoveredCategory === cat.id ? 'text-primary translate-x-1' : 'text-slate-300'}`} />
                      </div>
                    ))}
                  </div>

                  {/* Right: Products */}
                  <div className="w-[65%] p-8 bg-white">
                    {hoveredCategory && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                          {categories.find(c => c.id === hoveredCategory)?.name}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {products.filter(p => p.category_id === hoveredCategory).map(p => (
                            <Link 
                              key={p.id} 
                              to={`/product/${p.id}`}
                              className="px-4 py-2 rounded-custom border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all text-sm font-medium shadow-sm hover:shadow"
                            >
                              {p.name}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth section + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.email?.split('@')[0]}
                </span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors font-medium"
                >
                  <Settings className="w-3 h-3" />
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors px-3 py-2 rounded-custom"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          {/* Hamburger button - mobile only */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-custom text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
          {/* Danh mục accordion */}
          <button
            onClick={() => setMobileCategoryOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-primary" />
              Danh mục sản phẩm
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileCategoryOpen && (
            <div className="px-4 pb-2 space-y-1">
              {categories.map(cat => (
                <div key={cat.id}>
                  <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.name}</p>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
                    {products.filter(p => p.category_id === cat.id).map(p => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-1.5 text-sm rounded-custom border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all"
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 mx-4" />

          {/* Auth actions */}
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-pill text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  <User className="w-5 h-5 text-primary" />
                  Đơn hàng của tôi
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-pill text-amber-700 hover:bg-amber-50 font-medium transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Trang Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-pill text-red-500 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-pill bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                <User className="w-5 h-5" />
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
