import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Shop<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors text-sm">
            Trang chủ
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-slate-600 hover:text-primary font-medium transition-colors text-sm">
              Admin
            </Link>
          )}
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
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
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 transition-colors px-4 py-2 rounded-custom"
            >
              <User className="w-4 h-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
