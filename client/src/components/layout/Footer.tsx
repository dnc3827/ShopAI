import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Footer: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <span className="font-bold text-xl tracking-tight text-slate-900">Shop<span className="text-primary">AI</span></span>
            <p className="mt-4 text-sm text-slate-500">
              Hệ thống bán lẻ tài khoản AI & SaaS tự động hóa 100%. Nhanh chóng, uy tín và bảo mật.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Đăng nhập / Đăng ký</Link></li>
              {isAdmin && (
                <li><Link to="/admin" className="hover:text-primary transition-colors">Quản trị hệ thống</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/policy" className="hover:text-primary transition-colors">Chính sách bảo hành</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Email: <a href="mailto:support@shopai.com" className="hover:text-primary transition-colors">support@shopai.com</a></li>
              <li>Telegram: <a href="https://t.me/shopai_support" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@shopai_support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center flex-col sm:flex-row text-sm text-slate-400">
          <p>© {new Date().getFullYear()} ShopAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
