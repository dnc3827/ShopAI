import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, Plus, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Headline, Title } from '../components/ui/Typography';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <Title>Nạp kho — {variantName}</Title>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {(['manual', 'csv'] as const).map(t => (
            <button key={t} onClick={() => setModalTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                modalTab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500'
              }`}>
              {t === 'manual' ? '✏️ Nhập thủ công' : '📄 Upload CSV'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Manual Tab */}
          {modalTab === 'manual' && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide px-1">
                <div className="col-span-4">Email</div>
                <div className="col-span-4">Password</div>
                <div className="col-span-3">Invite Link (tuỳ chọn)</div>
              </div>
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input value={row.email} onChange={e => updateRow(i, 'email', e.target.value)}
                    placeholder="user@example.com" type="email"
                    className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  <input value={row.pass} onChange={e => updateRow(i, 'pass', e.target.value)}
                    placeholder="password"
                    className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  <input value={row.link} onChange={e => updateRow(i, 'link', e.target.value)}
                    placeholder="https://..."
                    className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  <button onClick={() => removeRow(i)} disabled={rows.length === 1}
                    className="col-span-1 text-slate-400 hover:text-red-500 disabled:opacity-20 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addRow}>
                Thêm dòng
              </Button>
            </div>
          )}

          {/* CSV Tab */}
          {modalTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                <p className="font-medium mb-1">Format CSV:</p>
                <code className="text-xs">email,password,invite_link</code>
                <p className="text-xs text-slate-400 mt-1">Mỗi dòng là 1 tài khoản. invite_link có thể để trống.</p>
              </div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => fileRef.current?.click()}>
                  Chọn file CSV
                </Button>
                {csvParsed.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {validCount} hợp lệ / {csvParsed.length} dòng
                  </span>
                )}
              </div>
              {csvParsed.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-500">Email</th>
                          <th className="px-3 py-2 text-left text-slate-500">Pass</th>
                          <th className="px-3 py-2 text-left text-slate-500">Link</th>
                          <th className="px-3 py-2 text-left text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.map((row, i) => (
                          <tr key={i} className={row.error ? 'bg-red-50' : 'bg-white'}>
                            <td className="px-3 py-2 font-mono">{row.email}</td>
                            <td className="px-3 py-2 font-mono">{row.pass ? '••••••' : '—'}</td>
                            <td className="px-3 py-2 truncate max-w-[120px]">{row.link || '—'}</td>
                            <td className="px-3 py-2">
                              {row.error
                                ? <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{row.error}</span>
                                : <span className="text-green-600">✓ OK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {hasErrors && (
                <p className="text-xs text-amber-600">⚠️ Các dòng lỗi sẽ bị bỏ qua khi nạp.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100">
          {submitError && <p className="text-red-500 text-sm mb-3">{submitError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Huỷ</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>Nạp kho</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Admin Page ───────────────────────────────────────────────

type AdminTab = 'products' | 'inventory' | 'orders';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('products');
  const [stats, setStats] = useState<InventoryStat[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filterVariant, setFilterVariant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restockTarget, setRestockTarget] = useState<InventoryStat | null>(null);

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

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <Headline className="text-2xl">Admin Dashboard</Headline>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        {(['products', 'inventory', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'products' ? '🛒 Sản phẩm' : t === 'inventory' ? '📦 Kho hàng' : '🧾 Đơn hàng'}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {tab === 'products' && <ProductCRUD />}

      {/* ── INVENTORY TAB ── */}
      {tab === 'inventory' && (
        <div className="space-y-8">
          {/* Stats table */}
          <Card>
            <CardBody className="p-0">
              <div className="p-5 border-b border-slate-100">
                <Title className="text-lg">Thống kê tồn kho</Title>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-slate-500 font-medium">Sản phẩm / Gói</th>
                      <th className="px-5 py-3 text-center text-slate-500 font-medium">Tồn kho</th>
                      <th className="px-5 py-3 text-center text-slate-500 font-medium">Đã bán</th>
                      <th className="px-5 py-3 text-right text-slate-500 font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.map(s => (
                      <tr key={s.variant_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">{s.product_name}</p>
                          <p className="text-xs text-slate-500">{s.variant_name}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${s.available_count < 5 ? 'text-red-600' : 'text-slate-900'}`}>
                            {s.available_count < 5 && <AlertTriangle className="w-4 h-4" />}
                            {s.available_count}
                          </span>
                          {s.available_count < 5 && (
                            <Badge variant="error" className="ml-2">Sắp hết</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-500">{s.sold_count}</td>
                        <td className="px-5 py-4 text-right">
                          <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => setRestockTarget(s)}>
                            Nạp kho
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {stats.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Chưa có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Inventory list with filters */}
          <Card>
            <CardBody className="p-0">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
                <Title className="text-lg flex-1">Danh sách kho</Title>
                <select value={filterVariant} onChange={e => setFilterVariant(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Tất cả gói</option>
                  {stats.map(s => <option key={s.variant_id} value={s.variant_id}>{s.variant_name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Tất cả</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="SOLD">SOLD</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-slate-500 font-medium">Email</th>
                      <th className="px-5 py-3 text-left text-slate-500 font-medium">Gói</th>
                      <th className="px-5 py-3 text-center text-slate-500 font-medium">Trạng thái</th>
                      <th className="px-5 py-3 text-left text-slate-500 font-medium">Ngày thêm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-slate-700">{item.email}</td>
                        <td className="px-5 py-3 text-slate-600">{item.product_variants?.variant_name || '—'}</td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={item.status === 'AVAILABLE' ? 'success' : 'default'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-slate-500 font-medium">Mã đơn</th>
                    <th className="px-5 py-3 text-left text-slate-500 font-medium">Khách hàng</th>
                    <th className="px-5 py-3 text-left text-slate-500 font-medium">Sản phẩm</th>
                    <th className="px-5 py-3 text-center text-slate-500 font-medium">Trạng thái</th>
                    <th className="px-5 py-3 text-left text-slate-500 font-medium">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => {
                    const item = order.order_items?.[0];
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-slate-100 text-slate-600',
                      PAID: 'bg-amber-100 text-amber-700',
                      FULFILLED: 'bg-green-100 text-green-700',
                      CANCELLED: 'bg-red-100 text-red-600',
                    };
                    return (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono font-semibold text-slate-700">{order.order_code}</td>
                        <td className="px-5 py-3">
                          <p className="text-slate-900">{order.profiles?.full_name || '—'}</p>
                          <p className="text-xs text-slate-500">{order.profiles?.email}</p>
                          {order.family_email_capture && (
                            <p className="text-xs text-amber-600 mt-0.5">📧 {order.family_email_capture}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-slate-900">{item?.products?.name || '—'}</p>
                          <p className="text-xs text-slate-500">{item?.product_variants?.variant_name}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Chưa có đơn hàng</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

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
