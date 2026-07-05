import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Loader2, Upload, Plus, X, AlertTriangle, 
  LayoutDashboard, ShoppingCart, Database, FolderTree, 
  ShoppingBag, Layers, Menu, LogOut, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductCRUD } from '../components/admin/ProductCRUD';

// ── Types ────────────────────────────────────────────────────

interface InventoryStat {
  variant_id: string;
  variant_name: string;
  product_name: string;
  available_count: number;
  sold_count: number;
}

interface InventoryItem {
  id: string;
  email: string;
  status: 'AVAILABLE' | 'SOLD';
  variant_id: string;
  created_at: string;
  product_variants: { variant_name: string } | null;
}

interface AdminOrder {
  id: string;
  order_code: string;
  status: string;
  created_at: string;
  family_email_capture: string | null;
  profiles: { email: string; full_name: string | null } | null;
  order_items: Array<{ products: { name: string } | null; product_variants: { variant_name: string } | null }>;
}

interface ManualRow { email: string; pass: string; link: string; }

// ── CSV Parser ───────────────────────────────────────────────

function parseCSV(text: string): Array<{ email: string; pass: string; link: string; error?: string }> {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [email = '', pass = '', link = ''] = line.split(',').map(s => s.trim());
      const error = !email.includes('@')
        ? `Dòng ${i + 1}: email không hợp lệ`
        : !pass
        ? `Dòng ${i + 1}: password trống`
        : undefined;
      return { email, pass, link, error };
    });
}

// ── Restock Modal ────────────────────────────────────────────

const RestockModal: React.FC<{
  variantId: string;
  variantName: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ variantId, variantName, onClose, onSuccess }) => {
  const [modalTab, setModalTab] = useState<'manual' | 'csv'>('manual');
  const [rows, setRows] = useState<ManualRow[]>([{ email: '', pass: '', link: '' }]);
  const [csvParsed, setCsvParsed] = useState<ReturnType<typeof parseCSV>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addRow = () => setRows(r => [...r, { email: '', pass: '', link: '' }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof ManualRow, val: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvParsed(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const items = modalTab === 'manual'
        ? rows.filter(r => r.email && r.pass)
        : csvParsed.filter(r => !r.error).map(r => ({ email: r.email, pass: r.pass, link: r.link }));

      if (items.length === 0) { setSubmitError('Không có dữ liệu hợp lệ để nạp.'); return; }

      await api.post('/admin/inventory/bulk', { variant_id: variantId, items });
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = csvParsed.some(r => r.error);
  const validCount = csvParsed.filter(r => !r.error).length;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-950">Nạp kho — <span className="text-primary">{variantName}</span></h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          {(['manual', 'csv'] as const).map(t => (
            <button key={t} onClick={() => setModalTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-[2px] ${
                modalTab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              {t === 'manual' ? '✏️ Nhập thủ công' : '📄 Tải lên file CSV'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Manual Tab */}
          {modalTab === 'manual' && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                <div className="col-span-4">Email</div>
                <div className="col-span-4">Password</div>
                <div className="col-span-3">Invite Link (tuỳ chọn)</div>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={row.email} onChange={e => updateRow(i, 'email', e.target.value)}
                      placeholder="user@example.com" type="email"
                      className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    <input value={row.pass} onChange={e => updateRow(i, 'pass', e.target.value)}
                      placeholder="mật khẩu"
                      className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    <input value={row.link} onChange={e => updateRow(i, 'link', e.target.value)}
                      placeholder="https://..."
                      className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    <button onClick={() => removeRow(i)} disabled={rows.length === 1}
                      className="col-span-1 text-slate-400 hover:text-red-500 disabled:opacity-20 flex items-center justify-center p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addRow}>
                Thêm tài khoản
              </Button>
            </div>
          )}

          {/* CSV Tab */}
          {modalTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200/60">
                <p className="font-semibold text-slate-800 mb-1">Định dạng CSV mẫu:</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200/50 block w-fit mb-2">email,password,invite_link</code>
                <p className="text-xs text-slate-500">Mỗi dòng đại diện cho một tài khoản. Trường <code className="font-mono text-xs">invite_link</code> có thể bỏ trống.</p>
              </div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => fileRef.current?.click()}>
                  Chọn file CSV / TXT
                </Button>
                {csvParsed.length > 0 && (
                  <span className="text-sm text-slate-500 font-medium">
                    Đã đọc: <span className="text-green-600 font-semibold">{validCount} hợp lệ</span> / {csvParsed.length} dòng
                  </span>
                )}
              </div>
              {csvParsed.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-500 font-medium">Email</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-medium">Pass</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-medium">Link</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-medium">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvParsed.map((row, i) => (
                          <tr key={i} className={row.error ? 'bg-red-50/50' : 'bg-white'}>
                            <td className="px-3 py-2 font-mono text-slate-700">{row.email}</td>
                            <td className="px-3 py-2 font-mono text-slate-400">{row.pass ? '••••••' : '—'}</td>
                            <td className="px-3 py-2 truncate max-w-[120px] text-slate-500">{row.link || '—'}</td>
                            <td className="px-3 py-2 font-medium">
                              {row.error
                                ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" />Lỗi định dạng</span>
                                : <span className="text-green-600">✓ Sẵn sàng</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {hasErrors && (
                <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">⚠️ Các dòng bị báo lỗi định dạng sẽ bị bỏ qua khi nạp.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          {submitError && <p className="text-red-500 text-sm mr-auto flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{submitError}</p>}
          <Button variant="outline" onClick={onClose}>Huỷ bỏ</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>Nạp kho ngay</Button>
        </div>
      </div>
    </div>
  );
};

// ── Admin Page ───────────────────────────────────────────────

type AdminTab = 'dashboard' | 'orders' | 'inventory' | 'categories' | 'products' | 'variants';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<InventoryStat[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filterVariant, setFilterVariant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restockTarget, setRestockTarget] = useState<InventoryStat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Guard: redirect non-admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth', { state: { from: '/admin' } });
      else if (!isAdmin) navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = async () => {
    setIsLoading(stats.length === 0 && inventory.length === 0 && orders.length === 0);
    try {
      const [statsRes, invRes, ordersRes] = await Promise.all([
        api.get<{ success: boolean; data: InventoryStat[] }>('/admin/inventory/stats'),
        api.get<{ success: boolean; data: InventoryItem[] }>('/admin/inventory'),
        api.get<{ success: boolean; data: AdminOrder[] }>('/admin/orders'),
      ]);
      setStats(statsRes.data.data);
      setInventory(invRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('[Admin] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user && isAdmin) loadData(); }, [user, isAdmin]);

  const filteredInventory = inventory.filter(item => {
    if (filterVariant && item.variant_id !== filterVariant) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  // Calculate summary counts
  const totalOrders = orders.length;
  const totalInventory = stats.reduce((acc, s) => acc + (s.available_count || 0), 0);
  const totalSold = stats.reduce((acc, s) => acc + (s.sold_count || 0), 0);

  const sidebarItems = [
    { id: 'dashboard', name: 'Tổng quan', icon: LayoutDashboard },
    { id: 'orders', name: 'Đơn hàng', icon: ShoppingCart },
    { id: 'inventory', name: 'Kho hàng', icon: Database },
    { id: 'categories', name: 'Danh mục', icon: FolderTree },
    { id: 'products', name: 'Sản phẩm', icon: ShoppingBag },
    { id: 'variants', name: 'Gói giá', icon: Layers },
  ] as const;

  const currentTabName = sidebarItems.find(item => item.id === tab)?.name || 'Admin';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      
      {/* ── SIDEBAR (DESKTOP) ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="text-white w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            Shop<span className="text-primary">AI</span> <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded ml-1 uppercase">Admin</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50/80 text-primary shadow-[0_2px_8px_rgba(59,130,246,0.06)]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            Về trang chủ
          </Link>
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4 text-red-400" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR (MOBILE DRAWER) ──────────────────────────── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"></div>
          
          <aside className="relative flex flex-col w-64 max-w-xs bg-white h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <span className="font-extrabold text-lg text-slate-900">Shop<span className="text-primary">AI</span> Admin</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50/80 text-primary' 
                        : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100 space-y-2">
              <Link to="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                Về trang chủ
              </Link>
              <button onClick={() => { signOut(); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut className="w-4 h-4 text-red-400" />
                Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">{currentTabName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tài khoản</p>
              <p className="text-sm font-bold text-slate-700">{user.email?.split('@')[0]}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shadow-sm select-none">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
          
          {/* ── 1. DASHBOARD OVERVIEW TAB ─────────────────────── */}
          {tab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Total Orders Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tổng đơn hàng</p>
                    {isLoading ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900">{totalOrders}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Inventory Stock Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tồn kho hiện có</p>
                    {isLoading ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900">{totalInventory}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Sold Products Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tài khoản đã bán</p>
                    {isLoading ? (
                      <div className="h-8 w-20 bg-slate-100 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900">{totalSold}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-950 mb-4">Lối tắt nhanh</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button onClick={() => setTab('products')} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-center transition-all group cursor-pointer">
                    <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">Sản phẩm</span>
                  </button>
                  <button onClick={() => setTab('inventory')} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-center transition-all group cursor-pointer">
                    <Database className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">Kho hàng</span>
                  </button>
                  <button onClick={() => setTab('categories')} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-center transition-all group cursor-pointer">
                    <FolderTree className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">Danh mục</span>
                  </button>
                  <button onClick={() => setTab('orders')} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-center transition-all group cursor-pointer">
                    <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">Đơn hàng</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. PRODUCTS TAB (Products view) ──────────────── */}
          {tab === 'products' && <ProductCRUD viewMode="products" />}

          {/* ── 3. CATEGORIES TAB ────────────────────────────── */}
          {tab === 'categories' && <ProductCRUD viewMode="categories" />}

          {/* ── 4. VARIANTS TAB ──────────────────────────────── */}
          {tab === 'variants' && <ProductCRUD viewMode="variants" />}

          {/* ── 5. INVENTORY TAB ─────────────────────────────── */}
          {tab === 'inventory' && (
            <div className="space-y-8">
              
              {/* Stats Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-950 text-base">Thống kê tồn kho</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left font-semibold">Sản phẩm / Gói</th>
                        <th className="px-6 py-3.5 text-center font-semibold">Tồn kho</th>
                        <th className="px-6 py-3.5 text-center font-semibold">Đã bán</th>
                        <th className="px-6 py-3.5 text-right font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        [...Array(3)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div><div className="h-3 bg-slate-100 rounded w-1/4"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-10 mx-auto"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-10 mx-auto"></div></td>
                            <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-20 ml-auto"></div></td>
                          </tr>
                        ))
                      ) : stats.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Database className="w-8 h-8 text-slate-350" />
                              <span>Chưa có dữ liệu tồn kho</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        stats.map(s => (
                          <tr key={s.variant_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{s.product_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{s.variant_name}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 font-bold">
                                {s.available_count < 5 && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                <span className={s.available_count < 5 ? 'text-amber-600' : 'text-slate-800'}>
                                  {s.available_count}
                                </span>
                                {s.available_count === 0 ? (
                                  <Badge variant="error" className="ml-2 font-bold px-1.5 py-0.5 text-[10px]">Hết hàng</Badge>
                                ) : s.available_count < 5 ? (
                                  <Badge variant="warning" className="ml-2 font-bold px-1.5 py-0.5 text-[10px]">Sắp hết</Badge>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-500 font-medium">{s.sold_count}</td>
                            <td className="px-6 py-4 text-right">
                              <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />}
                                onClick={() => setRestockTarget(s)}>
                                Nạp kho
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventory List Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-4">
                  <h3 className="font-bold text-slate-950 text-base flex-grow">Chi tiết tài khoản trong kho</h3>
                  <div className="flex gap-2">
                    <select value={filterVariant} onChange={e => setFilterVariant(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Tất cả gói</option>
                      {stats.map(s => <option key={s.variant_id} value={s.variant_id}>{s.variant_name}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Tất cả trạng thái</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="SOLD">SOLD</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left font-semibold">Tên tài khoản (Email)</th>
                        <th className="px-6 py-3.5 text-left font-semibold">Gói sản phẩm</th>
                        <th className="px-6 py-3.5 text-center font-semibold">Trạng thái</th>
                        <th className="px-6 py-3.5 text-left font-semibold">Ngày thêm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        [...Array(4)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                            <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-1/3"></div></td>
                            <td className="px-6 py-4.5"><div className="h-5 bg-slate-100 rounded w-16 mx-auto"></div></td>
                            <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                          </tr>
                        ))
                      ) : filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Database className="w-8 h-8 text-slate-350" />
                              <span>Không tìm thấy tài khoản nào khớp bộ lọc</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-800 font-medium">{item.email}</td>
                            <td className="px-6 py-4 text-slate-600">{item.product_variants?.variant_name || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination UI Placeholder (bottom right) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Hiển thị 1 - {filteredInventory.length} của {filteredInventory.length}</span>
                  <div className="flex gap-1 ml-4">
                    <button disabled className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Trước</button>
                    <button disabled className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Sau</button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── 6. ORDERS TAB ────────────────────────────────── */}
          {tab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-950 text-base">Nhật ký đơn hàng</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-semibold">Mã đơn</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Khách hàng</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Sản phẩm</th>
                      <th className="px-6 py-3.5 text-center font-semibold">Trạng thái</th>
                      <th className="px-6 py-3.5 text-left font-semibold">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                          <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-1/3 mb-1.5"></div><div className="h-3 bg-slate-100 rounded w-1/4"></div></td>
                          <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-1/3 mb-1.5"></div><div className="h-3 bg-slate-100 rounded w-1/4"></div></td>
                          <td className="px-6 py-4.5"><div className="h-5 bg-slate-100 rounded w-16 mx-auto"></div></td>
                          <td className="px-6 py-4.5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                        </tr>
                      ))
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShoppingCart className="w-8 h-8 text-slate-350" />
                            <span>Chưa có đơn hàng nào được tạo</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => {
                        const item = order.order_items?.[0];
                        const statusColors: Record<string, string> = {
                          PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
                          PAID: 'bg-blue-50 text-blue-700 border-blue-200/50',
                          FULFILLED: 'bg-green-50 text-green-700 border-green-200/50',
                          CANCELLED: 'bg-red-50 text-red-600 border-red-200/50',
                          EXPIRED: 'bg-slate-100 text-slate-400 border-slate-200/40',
                        };
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">{order.order_code}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{order.profiles?.full_name || 'Khách vãng lai'}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{order.profiles?.email}</p>
                              {order.family_email_capture && (
                                <p className="text-xs text-amber-600 font-semibold mt-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded w-fit flex items-center gap-1">
                                  <span>📧 Family:</span> {order.family_email_capture}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{item?.products?.name || '—'}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{item?.product_variants?.variant_name}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI Placeholder (bottom right) */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Hiển thị 1 - {orders.length} của {orders.length}</span>
                <div className="flex gap-1 ml-4">
                  <button disabled className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Trước</button>
                  <button disabled className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-md opacity-50 cursor-not-allowed">Sau</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Restock Modal */}
      {restockTarget && (
        <RestockModal
          variantId={restockTarget.variant_id}
          variantName={restockTarget.variant_name}
          onClose={() => setRestockTarget(null)}
          onSuccess={loadData}
        />
      )}

    </div>
  );
};
