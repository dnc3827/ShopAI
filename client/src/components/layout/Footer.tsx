import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <span className="font-bold text-xl tracking-tight text-slate-900">Shop<span className="text-primary">AI</span></span>
            <p className="mt-4 text-sm text-slate-500">
              Hệ thống bán lẻ tài khoản AI & SaaS tự động hóa 100%. Nhanh chóng, uy tín và bảo mật.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Sản phẩm</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">Tài khoản AI</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tài khoản Giải trí</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Công cụ làm việc</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn sử dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo hành</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Email: support@shopai.com</li>
              <li>Telegram: @shopai_support</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center flex-col sm:flex-row text-sm text-slate-400">
          <p>© {new Date().getFullYear()} ShopAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
