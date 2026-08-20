import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, UserPlus, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(from, { replace: true });
      } else {
        if (!fullName.trim()) throw new Error('Vui lòng nhập họ tên');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMode('login');
      }
    } catch (err) {
      const e = err as Error;
      if (e.message?.includes('Invalid login credentials')) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (e.message?.includes('User already registered')) {
        setError('Email này đã được đăng ký. Hãy đăng nhập.');
      } else {
        setError(e.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-primary rounded-custom flex items-center justify-center shadow-card">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-slate-900">Shop<span className="text-primary">AI</span></span>
          </Link>
          <h1 className="text-slate-500 mt-3 text-sm font-medium">
            {mode === 'login' ? 'Đăng nhập để xem đơn hàng của bạn' : 'Tạo tài khoản mới'}
          </h1>
        </div>

        <div className="bg-white rounded-custom shadow-card border border-slate-100 p-6 md:p-8">
          {/* Mode Tabs */}
          <div className="flex rounded-pill border border-slate-200 p-1 mb-8 bg-surface">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-pill transition-all ${
                mode === 'login' ? 'bg-white shadow-card text-primary' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-1.5" />
              Đăng nhập
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-pill transition-all ${
                mode === 'register' ? 'bg-white shadow-card text-primary' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" />
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-custom text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              leftIcon={!isLoading ? (mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />) : undefined}
            >
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/" className="hover:text-primary transition-colors font-medium">← Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
};
