import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Package, XCircle, Clock } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Headline, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'POLLING';

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

        if (s === 'CANCELLED' || attempts >= POLL_MAX_ATTEMPTS) {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-surface">
      <Card className="max-w-lg w-full shadow-xl border-slate-200">
        <CardBody className="p-10 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'FULFILLED' ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-once">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
            ) : status === 'CANCELLED' ? (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-error" />
              </div>
            ) : status === 'PAID' ? (
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Title */}
          {status === 'FULFILLED' && (
            <>
              <Headline className="mb-2 text-success">Giao hàng thành công!</Headline>
              <Body className="mb-6 text-slate-600">
                Tài khoản của bạn đã sẵn sàng. Đang chuyển đến trang đơn hàng...
              </Body>
            </>
          )}
          {status === 'PAID' && (
            <>
              <Headline className="mb-2">Thanh toán đã xác nhận</Headline>
              <Body className="mb-6 text-slate-600">
                Đơn hàng đang được xử lý. Kiểm tra <strong>Đơn hàng của tôi</strong> để xem kết quả.
                Nếu là gói Family, admin sẽ xử lý trong 1–2 giờ.
              </Body>
            </>
          )}
          {(status === 'POLLING' || status === 'PENDING') && (
            <>
              <Headline className="mb-2">Đang xác nhận thanh toán...</Headline>
              <Body className="mb-6 text-slate-600">
                Hệ thống đang kiểm tra trạng thái. Vui lòng không đóng trang này.
              </Body>
            </>
          )}

          {/* Order code */}
          {orderCode && (
            <div className="mb-6 py-2 px-4 bg-slate-100 rounded-lg inline-block">
              <span className="text-sm text-slate-500">Mã đơn: </span>
              <span className="font-mono font-bold text-slate-900">{orderCode}</span>
            </div>
          )}

          {/* Progress bar (while polling) */}
          {(status === 'POLLING' || status === 'PENDING') && (
            <div className="mb-6 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
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
        </CardBody>
      </Card>
    </div>
  );
};

export const CheckoutCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-surface">
      <Card className="max-w-lg w-full shadow-xl border-slate-200">
        <CardBody className="p-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-slate-400" />
          </div>
          <Headline className="mb-3">Thanh toán bị huỷ</Headline>
          {orderCode && (
            <div className="mb-4 py-2 px-4 bg-slate-100 rounded-lg inline-block">
              <span className="text-sm text-slate-500">Mã đơn: </span>
              <span className="font-mono font-bold text-slate-900">{orderCode}</span>
            </div>
          )}
          <Body className="mb-8 text-slate-600">
            Giao dịch đã bị huỷ. Đơn hàng chưa được thanh toán và không ảnh hưởng đến tài khoản của bạn.
          </Body>
          <Link to="/">
            <Button size="lg">Quay về trang chủ</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
};
