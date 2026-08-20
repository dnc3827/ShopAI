import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Package, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' | 'POLLING';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20; // 20 × 3s = 60s

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get('orderCode');

  const [status, setStatus] = useState<OrderStatus>('POLLING');
  const [attempt, setAttempt] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderCode) { setStatus('PENDING'); return; }

    let attempts = 0;

    const poll = async () => {
      try {
        const res = await api.get<{ success: boolean; data: { status: string } }>(
          `/orders/status/${orderCode}`
        );
        const s = res.data.data.status as OrderStatus;
        setStatus(s);
        setAttempt(attempts);

        if (s === 'FULFILLED') {
          // Auto-redirect to dashboard after 2s
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }

        if (s === 'CANCELLED' || s === 'EXPIRED' || attempts >= POLL_MAX_ATTEMPTS) {
          return; // Stop polling
        }
      } catch {
        // Network error — keep polling
      }

      attempts++;
      setAttempt(attempts);

      if (attempts < POLL_MAX_ATTEMPTS) {
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        setStatus('PAID'); // Timed out, show paid state
      }
    };

    timerRef.current = setTimeout(poll, 1500); // Start after 1.5s

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderCode, navigate]);

  const progress = Math.min((attempt / POLL_MAX_ATTEMPTS) * 100, 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-surface">
      <div className="max-w-lg w-full bg-white rounded-custom shadow-card border border-slate-100 p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'FULFILLED' ? (
            <div className="w-20 h-20 bg-green-100 rounded-pill flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          ) : status === 'CANCELLED' || status === 'EXPIRED' ? (
            <div className="w-20 h-20 bg-red-100 rounded-pill flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          ) : status === 'PAID' ? (
            <div className="w-20 h-20 bg-amber-100 rounded-pill flex items-center justify-center mx-auto">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-blue-50 rounded-pill flex items-center justify-center mx-auto">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        {status === 'FULFILLED' && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Giao hàng thành công!</h2>
            <p className="mb-6 text-slate-600">
              Tài khoản của bạn đã sẵn sàng. Đang chuyển đến trang đơn hàng...
            </p>
          </>
        )}
        {status === 'PAID' && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Thanh toán đã xác nhận</h2>
            <p className="mb-6 text-slate-600">
              Đơn hàng đang được xử lý. Kiểm tra <strong>Đơn hàng của tôi</strong> để xem kết quả.
              Nếu là gói Family, admin sẽ xử lý trong 1–2 giờ.
            </p>
          </>
        )}
        {(status === 'CANCELLED' || status === 'EXPIRED') && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {status === 'EXPIRED' ? 'Đơn hàng đã hết hạn' : 'Thanh toán bị huỷ'}
            </h2>
            <p className="mb-6 text-slate-600">
              Đơn hàng chưa được thanh toán. Bạn có thể quay lại sản phẩm và tạo đơn thanh toán mới.
            </p>
          </>
        )}
        {(status === 'POLLING' || status === 'PENDING') && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Đang xác nhận thanh toán...</h2>
            <p className="mb-6 text-slate-600">
              Hệ thống đang kiểm tra trạng thái. Vui lòng không đóng trang này.
            </p>
          </>
        )}

        {/* Order code */}
        {orderCode && (
          <div className="mb-6 py-2.5 px-5 bg-surface rounded-custom inline-block border border-slate-100">
            <span className="text-sm text-slate-500">Mã đơn: </span>
            <span className="font-mono font-bold text-slate-900">{orderCode}</span>
          </div>
        )}

        {/* Progress bar (while polling) */}
        {(status === 'POLLING' || status === 'PENDING') && (
          <div className="mb-6 w-full bg-slate-100 rounded-pill h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-pill transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button size="lg" leftIcon={<Package className="w-5 h-5" />}>
              Xem đơn hàng của tôi
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline">
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const CheckoutCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-surface">
      <div className="max-w-lg w-full bg-white rounded-custom shadow-card border border-slate-100 p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-pill flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Thanh toán bị huỷ</h2>
        {orderCode && (
          <div className="mb-4 py-2.5 px-5 bg-surface rounded-custom inline-block border border-slate-100">
            <span className="text-sm text-slate-500">Mã đơn: </span>
            <span className="font-mono font-bold text-slate-900">{orderCode}</span>
          </div>
        )}
        <p className="mb-8 text-slate-600 leading-normal">
          Giao dịch đã bị huỷ. Đơn hàng chưa được thanh toán và không ảnh hưởng đến tài khoản của bạn.
        </p>
        <Link to="/">
          <Button size="lg">Quay về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
};
