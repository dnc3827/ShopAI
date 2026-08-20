import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Sau khi thanh toán thành công, tôi sẽ nhận tài khoản trong bao lâu?',
    answer: 'Hệ thống của chúng tôi là tự động 100%. Ngay sau khi bạn thanh toán thành công qua chuyển khoản hoặc quét mã QR, tài khoản sẽ được cấp ngay lập tức trên màn hình và gửi một bản sao về email của bạn (nếu có cung cấp). Tốc độ xử lý thường chỉ từ 1 - 3 phút.'
  },
  {
    question: 'Tôi có thể đổi mật khẩu tài khoản sau khi mua không?',
    answer: 'Điều này tùy thuộc vào loại tài khoản bạn mua. Nếu sản phẩm ghi rõ "Tài khoản cấp riêng (Private)", bạn hoàn toàn có thể đổi mật khẩu và thông tin. Ngược lại, nếu là "Tài khoản dùng chung (Shared)", bạn KHÔNG được tự ý đổi mật khẩu để đảm bảo quyền lợi của những người dùng khác. Việc cố tình đổi mật khẩu tài khoản shared sẽ làm mất hiệu lực bảo hành.'
  },
  {
    question: 'Nếu tài khoản bị lỗi hoặc không đăng nhập được thì phải làm sao?',
    answer: 'Bạn đừng lo lắng! Hãy truy cập mục "Chính sách bảo hành" để xem quy định đổi trả. Chỉ cần nhắn tin cho đội ngũ hỗ trợ qua Telegram (@shopai_support) hoặc Email, cung cấp mã đơn hàng, chúng tôi sẽ cấp tài khoản mới hoặc khắc phục lỗi cho bạn trong vòng 1-12 giờ làm việc.'
  },
  {
    question: 'Shop có hỗ trợ gia hạn tài khoản trên chính email của tôi không?',
    answer: 'Có! Một số sản phẩm đặc thù (ví dụ: YouTube Premium, Spotify Premium, hoặc nâng cấp ChatGPT Plus trên mail chính chủ), chúng tôi có hỗ trợ dịch vụ gia hạn hoặc nâng cấp trực tiếp. Vui lòng đọc kỹ phần Mô tả sản phẩm để biết ứng dụng đó có hỗ trợ nâng cấp trên mail cá nhân hay không.'
  },
  {
    question: 'Tôi có thể yêu cầu hoàn tiền không?',
    answer: 'ShopAI cam kết hoàn tiền 100% (theo số ngày chưa sử dụng) nếu sản phẩm bị lỗi trong thời gian bảo hành và chúng tôi không thể khắc phục hoặc cung cấp tài khoản thay thế. Đối với các đơn hàng mua nhầm, chúng tôi không hỗ trợ hoàn tiền nếu tài khoản đã được cấp xuất.'
  }
];

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-surface min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-pill bg-orange-100 text-primary mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Câu Hỏi Thường Gặp</h1>
          <p className="text-lg text-slate-600">Những thắc mắc phổ biến của khách hàng khi mua sắm tại ShopAI.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-custom border transition-all duration-200 ${
                openIndex === index ? 'border-primary ring-1 ring-primary/20 shadow-card' : 'border-slate-200 shadow-card hover:border-primary'
              }`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-semibold text-slate-900 pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'transform rotate-180 text-primary' : ''
                  }`} 
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2 text-slate-600 leading-normal border-t border-slate-50">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
