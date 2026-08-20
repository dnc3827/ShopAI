import React from 'react';
import { ShieldCheck, Clock, RefreshCcw, AlertTriangle } from 'lucide-react';

export const PolicyPage: React.FC = () => {
  return (
    <div className="bg-surface min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Chính Sách Bảo Hành</h1>
          <p className="text-lg text-slate-600">Cam kết chất lượng và dịch vụ hậu mãi tốt nhất dành cho khách hàng.</p>
        </div>

        <div className="bg-white rounded-custom shadow-card border border-slate-100 p-6 md:p-10">
          <div className="space-y-10">
            {/* Mục 1 */}
            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Thời Gian Bảo Hành</h2>
                <p className="text-slate-600 leading-normal">
                  Tất cả các tài khoản phần mềm do hệ thống ShopAI cung cấp đều được bảo hành xuyên suốt thời gian gói cước (ví dụ: gói 1 tháng sẽ được bảo hành 30 ngày, gói 1 năm bảo hành 365 ngày). Thời gian bảo hành được tính từ thời điểm đơn hàng chuyển sang trạng thái <strong>Đã giao (FULFILLED)</strong>.
                </p>
              </div>
            </section>

            {/* Mục 2 */}
            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center text-primary">
                  <RefreshCcw className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Quy Định Đổi Trả 1-1</h2>
                <p className="text-slate-600 leading-normal mb-3">
                  Trong trường hợp tài khoản gặp sự cố không thể truy cập, mất quyền Premium/Plus, hoặc bị thay đổi mật khẩu do lỗi từ phía hệ thống, khách hàng sẽ được cấp tài khoản mới hoặc tài khoản thay thế với thời hạn tương đương hoàn toàn miễn phí.
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  <li>Thời gian xử lý bảo hành: <strong>Từ 1 - 12 giờ</strong> kể từ lúc nhận được báo cáo.</li>
                  <li>Nếu không thể cung cấp tài khoản thay thế, chúng tôi sẽ hoàn lại số tiền tương ứng với thời gian chưa sử dụng.</li>
                </ul>
              </div>
            </section>

            {/* Mục 3 */}
            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center text-primary">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Trường Hợp Từ Chối Bảo Hành</h2>
                <p className="text-slate-600 leading-normal">
                  ShopAI xin phép từ chối bảo hành đối với các trường hợp sau:
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-2 mt-3">
                  <li>Khách hàng tự ý thay đổi mật khẩu, email khôi phục hoặc thông tin định danh của tài khoản được cung cấp (trừ khi tài khoản cấp riêng).</li>
                  <li>Tài khoản bị khóa do khách hàng vi phạm Điều khoản dịch vụ của ứng dụng (ví dụ: dùng chung cho quá nhiều người quy định, spam, sử dụng thẻ tín dụng lậu gia hạn thêm).</li>
                  <li>Sự cố phát sinh sau khi thời hạn gói cước đã kết thúc.</li>
                </ul>
              </div>
            </section>

            {/* Mục 4 */}
            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-custom bg-orange-50 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Hỗ Trợ Và Giải Quyết Tranh Chấp</h2>
                <p className="text-slate-600 leading-normal">
                  Với kim chỉ nam đặt uy tín lên hàng đầu, ShopAI cam kết đứng về phía khách hàng. Nếu bạn gặp bất cứ rắc rối nào không nằm trong thỏa thuận trên, vui lòng liên hệ <strong>Telegram: @shopai_support</strong> để chúng tôi linh động giải quyết và bồi thường thỏa đáng.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
