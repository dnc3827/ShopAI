import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, UserPlus, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardBody } from '../components/ui/Card';
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
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
        setSuccessMsg('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-slate-900">Shop<span className="text-primary">AI</span></span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === 'login' ? 'Đăng nhập để xem đơn hàng của bạn' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardBody className="p-8">
            {/* Mode Tabs */}
            <div className="flex rounded-custom border border-slate-200 p-1 mb-8 bg-slate-50">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-1.5" />
                Đăng nhập
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1.5" />
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-custom text-red-700 text-sm">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-custom text-green-700 text-sm">
                  {successMsg}
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
          </CardBody>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/" className="hover:text-primary transition-colors">← Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
};
