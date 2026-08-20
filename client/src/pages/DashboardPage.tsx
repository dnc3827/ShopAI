import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, Eye, EyeOff, Copy, CheckCheck, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

// ── Types ────────────────────────────────────────────────────

interface PurchasedItem {
  id: string;
  email: string;
  pass: string;
  link: string | null;
  created_at: string;
  expiry_date: string | null;
}

interface OrderItem {
  price: number;
  product_variants: { variant_name: string; type: string } | null;
  products: { name: string } | null;
}

interface Order {
  id: string;
  order_code: string;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  family_email_capture: string | null;
  created_at: string;
  order_items: OrderItem[];
  purchased_items: PurchasedItem[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

// ── Status Badge ─────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ thanh toán', variant: 'default'  as const, cls: 'bg-slate-100 text-slate-600' },
  PAID:      { label: 'Đã thanh toán',  variant: 'warning'  as const, cls: 'bg-amber-100 text-amber-700' },
  FULFILLED: { label: 'Đã giao',        variant: 'success'  as const, cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã huỷ',         variant: 'error'    as const, cls: 'bg-red-100 text-red-600'    },
  EXPIRED:   { label: 'Đã hết hạn',     variant: 'default'  as const, cls: 'bg-slate-200 text-slate-700' },
};

const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Password Cell (Reveal toggle + Copy) ─────────────────────

const SecretCell: React.FC<{ value: string }> = ({ value }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-slate-700">
        {revealed ? value : '••••••••'}
      </span>
      <button
        onClick={() => setRevealed(r => !r)}
        className="text-slate-400 hover:text-primary transition-colors"
        title={revealed ? 'Ẩn' : 'Hiện'}
      >
        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        onClick={handleCopy}
        className="text-slate-400 hover:text-primary transition-colors"
        title="Copy"
      >
        {copied ? <CheckCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ── Order Card ───────────────────────────────────────────────

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const item = order.order_items?.[0];
  const purchased = order.purchased_items?.[0];

  return (
    <div className="bg-white rounded-custom border border-slate-100 shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Mã đơn: <span className="font-mono font-semibold text-slate-700">{order.order_code}</span>
            </p>
            <p className="font-semibold text-slate-900">
              {item?.products?.name || 'Sản phẩm'} — {item?.product_variants?.variant_name || ''}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary text-lg">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item?.price || 0)}
            </span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Delivered account info */}
        {order.status === 'FULFILLED' && purchased && (
          <div className="mt-4 p-4 bg-green-50 rounded-custom border border-green-100 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                ✅ Thông tin tài khoản
              </p>
              {purchased.expiry_date && (() => {
                const daysLeft = (new Date(purchased.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                if (daysLeft <= 0) return <Badge variant="error">Hết hạn</Badge>;
                if (daysLeft <= 7) return <Badge variant="warning">Sắp hết hạn</Badge>;
                return <Badge variant="success">Còn hạn</Badge>;
              })()}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
                <div className="mt-1"><SecretCell value={purchased.email} /></div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mật khẩu</span>
                <div className="mt-1"><SecretCell value={purchased.pass} /></div>
              </div>
              {purchased.link && (
                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invite Link</span>
                  <a
                    href={purchased.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-primary text-sm hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở link
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Family order waiting */}
        {order.status === 'PAID' && item?.product_variants?.type === 'family' && (
          <div className="mt-4 p-4 bg-amber-50 rounded-custom border border-amber-100">
            <p className="text-sm text-amber-700 font-medium">
              ⏳ Đơn Family đang được xử lý. Admin sẽ mời email <strong>{order.family_email_capture}</strong> trong 1-2 giờ.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Dashboard Page ──────────────────────────────────────

type Tab = 'orders' | 'profile';

export const DashboardPage: React.FC = () => {
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/dashboard' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: Order[] }>('/user/orders'),
      api.get<{ success: boolean; data: Profile }>('/user/profile'),
    ])
      .then(([ordersRes, profileRes]) => {
        setOrders(ordersRes.data.data);
        setProfile(profileRes.data.data);
      })
      .catch(err => console.error('[Dashboard] Fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản của tôi</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm">Trang Admin</Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>Đăng xuất</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8">
          {([['orders', 'Đơn hàng', Package], ['profile', 'Tài khoản', User]] as const).map(
            ([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  tab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === 'orders' && orders.length > 0 && (
                  <span className="ml-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-pill">
                    {orders.length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-custom border border-slate-100 shadow-card">
                    <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg font-semibold">Chưa có đơn hàng nào</p>
                    <p className="mt-2 text-sm text-slate-500">
                      <Link to="/" className="text-primary hover:underline font-medium">Mua sắm ngay →</Link>
                    </p>
                  </div>
                ) : (
                  orders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && profile && (
              <div className="bg-white rounded-custom border border-slate-100 shadow-card p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-custom bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xl text-slate-900">{profile.full_name || 'Người dùng'}</p>
                    <p className="text-slate-500 text-sm">{profile.email}</p>
                    {profile.is_admin && (
                      <Badge variant="warning" className="mt-1">Admin</Badge>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</span>
                    <p className="mt-1.5 font-semibold text-slate-900">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng đơn hàng</span>
                    <p className="mt-1.5 font-semibold text-slate-900">{orders.length} đơn</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
