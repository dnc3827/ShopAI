import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { X, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cancelOrder, pollOrderStatus } from '../../lib/api';

interface QRPaymentModalProps {
  qrCode: string;
  orderCode: string;
  amount: number;
  productName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 3000;
const EXPIRE_SECONDS = 10 * 60; // 10 minutes

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  qrCode,
  orderCode,
  amount,
  productName,
  onSuccess,
  onError,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(EXPIRE_SECONDS);
  const [status, setStatus] = useState<'polling' | 'fulfilled' | 'cancelled' | 'expired'>('polling');
  const [isCancelling, setIsCancelling] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeWithError = useCallback((nextStatus: 'cancelled' | 'expired', message: string) => {
    cleanup();
    setStatus(nextStatus);
    closeTimerRef.current = setTimeout(() => onError(message), 1200);
  }, [cleanup, onError]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          closeWithError('expired', 'QR đã hết hạn. Vui lòng tạo đơn thanh toán mới.');
          cancelOrder(orderCode).catch(() => {});
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return cleanup;
  }, [cleanup, closeWithError, orderCode]);

  // Polling order status
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const s = await pollOrderStatus(orderCode);
        if (s === 'FULFILLED') {
          cleanup();
          setStatus('fulfilled');
          closeTimerRef.current = setTimeout(onSuccess, 1500); // Short delay to show success state
        } else if (s === 'CANCELLED') {
          closeWithError('cancelled', 'Đơn hàng đã được hủy. Vui lòng thử lại khi bạn sẵn sàng thanh toán.');
        } else if (s === 'EXPIRED') {
          closeWithError('expired', 'Đơn hàng đã hết hạn. Vui lòng tạo đơn thanh toán mới.');
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderCode, onSuccess, cleanup, closeWithError]);

  const handleCancel = async () => {
    if (isCancelling) return;
    cleanup();
    setIsCancelling(true);
    try {
      await cancelOrder(orderCode);
    } catch {
      // ignore — order may have already changed status
    }
    onClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    // Backdrop
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Thanh toán QR</h2>
          {status === 'polling' && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col items-center gap-4">

          {/* Status: fulfilled */}
          {status === 'fulfilled' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-700">Thanh toán thành công!</p>
              <p className="text-sm text-slate-500 text-center">Tài khoản đang được giao. Đang chuyển đến đơn hàng...</p>
            </div>
          )}

          {/* Status: cancelled / expired */}
          {(status === 'cancelled' || status === 'expired') && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-xl font-bold text-red-600">
                {status === 'expired' ? 'QR đã hết hạn' : 'Đơn hàng đã hủy'}
              </p>
              <p className="text-sm text-slate-500 text-center">Vui lòng thử lại từ đầu.</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Status: polling (main view) */}
          {status === 'polling' && (
            <>
              {/* Product name */}
              <p className="text-sm text-slate-500 text-center font-medium">{productName}</p>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
                <QRCode
                  value={qrCode}
                  size={200}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  viewBox="0 0 256 256"
                />
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-0.5">Số tiền thanh toán</p>
                <p className="text-3xl font-extrabold text-primary">{formatVND(amount)}</p>
              </div>

              {/* Polling indicator */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Đang chờ xác nhận thanh toán...</span>
              </div>

              {/* Countdown */}
              <div className={`flex items-center gap-2 text-sm font-bold ${secondsLeft < 60 ? 'text-red-500' : 'text-slate-600'}`}>
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>QR hết hạn sau: {formatTime(secondsLeft)}</span>
              </div>

              {/* Order code */}
              <div className="w-full bg-slate-50 rounded-xl px-4 py-2.5 flex justify-between items-center border border-slate-100">
                <span className="text-xs text-slate-500">Mã đơn hàng</span>
                <span className="font-mono text-sm font-bold text-slate-800">{orderCode}</span>
              </div>

              {/* Cancel button */}
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {isCancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang hủy...
                  </span>
                ) : 'Hủy thanh toán'}
              </button>

              {/* Hint */}
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Dùng app ngân hàng quét mã QR ở trên để thanh toán.
                Đơn hàng sẽ được giao tự động ngay sau khi xác nhận.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
