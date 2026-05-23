import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Settings, Loader2 } from 'lucide-react';
import type {
  ApiCategory, AdminApiProduct, ApiVariant,
} from '../../lib/api';
import {
  fetchAdminCategories, createAdminCategory, deleteAdminCategory,
  fetchAdminProducts, createAdminProduct, deleteAdminProduct,
  fetchAdminVariants, createAdminVariant, deleteAdminVariant
} from '../../lib/api';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { Title } from '../ui/Typography';
import { RichTextEditor } from './RichTextEditor';

export const ProductCRUD: React.FC = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<AdminApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [activeProductForVariants, setActiveProductForVariants] = useState<AdminApiProduct | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await deleteAdminCategory(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa danh mục');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await deleteAdminProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa sản phẩm');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Categories */}
      <Card>
        <CardBody className="p-0">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <Title className="text-lg">Danh mục sản phẩm</Title>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCatModal(true)}>
              Thêm danh mục
            </Button>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-3">
              {categories.map(c => (
                <div key={c.id} className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-3">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <span className="text-slate-400 text-sm">Chưa có danh mục nào</span>}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products */}
      <Card>
        <CardBody className="p-0">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <Title className="text-lg">Sản phẩm</Title>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowProdModal(true)}>
              Thêm sản phẩm
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-slate-500 font-medium">Tên sản phẩm</th>
                  <th className="px-5 py-3 text-left text-slate-500 font-medium">Danh mục</th>
                  <th className="px-5 py-3 text-right text-slate-500 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {p.categories?.name || '—'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button size="sm" variant="outline" leftIcon={<Settings className="w-4 h-4" />} onClick={() => setActiveProductForVariants(p)}>
                        Cấu hình gói (Variants)
                      </Button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400">Chưa có sản phẩm nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      {showCatModal && (
        <CategoryModal onClose={() => setShowCatModal(false)} onSuccess={loadData} />
      )}
      {showProdModal && (
        <ProductModal categories={categories} onClose={() => setShowProdModal(false)} onSuccess={loadData} />
      )}
      {activeProductForVariants && (
        <VariantsModal product={activeProductForVariants} onClose={() => setActiveProductForVariants(null)} />
      )}
    </div>
  );
};

// --- Modals ---

const CategoryModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAdminCategory({ name, slug: slug || name.toLowerCase().replace(/ /g, '-') });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between p-5 border-b">
          <Title className="text-lg">Thêm danh mục</Title>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="VD: Giải trí" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="VD: giai-tri (Tự động tạo nếu để trống)" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" isLoading={loading}>Thêm</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{ categories: ApiCategory[], onClose: () => void, onSuccess: () => void }> = ({ categories, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [img, setImg] = useState('');
  const [status, setStatus] = useState('visible');
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAdminProduct({ 
        name, 
        slug: slug || undefined,
        description: desc, 
        category_id: catId, 
        thumbnail_url: img,
        status,
        is_featured: isFeatured
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between p-5 border-b">
          <Title className="text-lg">Thêm sản phẩm mới</Title>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Tự tạo nếu trống" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục *</label>
              <select required value={catId} onChange={e => setCatId(e.target.value)} className="w-full border p-2 rounded-lg">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-2 rounded-lg">
                <option value="visible">Hiển thị</option>
                <option value="hidden">Ẩn</option>
                <option value="coming_soon">Sắp ra mắt</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hình ảnh (URL)</label>
              <input value={img} onChange={e => setImg(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="https://..." />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" id="is_featured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="is_featured" className="text-sm font-medium">Sản phẩm nổi bật (Featured)</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <RichTextEditor value={desc} onChange={setDesc} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" isLoading={loading}>Thêm</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VariantsModal: React.FC<{ product: AdminApiProduct, onClose: () => void }> = ({ product, onClose }) => {
  const [variants, setVariants] = useState<ApiVariant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'account' | 'family'>('account');
  const [duration, setDuration] = useState('30');
  const [adding, setAdding] = useState(false);

  const loadVariants = async () => {
    try {
      const data = await fetchAdminVariants(product.id);
      setVariants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVariants(); }, [product.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await createAdminVariant({ 
        product_id: product.id, 
        variant_name: name, 
        price: Number(price), 
        type, 
        duration_days: Number(duration) 
      });
      setName('');
      setPrice('');
      setDuration('30');
      loadVariants();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm gói');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa gói này?')) return;
    try {
      await deleteAdminVariant(id);
      loadVariants();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa gói');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between p-5 border-b">
          <Title className="text-lg">Cấu hình gói - {product.name}</Title>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3 mb-8">
              {variants.map(v => (
                <div key={v.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-medium text-slate-900">{v.variant_name}</div>
                    <div className="text-sm text-slate-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)} • 
                      {v.type === 'family' ? ' Family' : ' Account'} • {v.duration_days} ngày
                    </div>
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {variants.length === 0 && <p className="text-slate-500 text-center text-sm py-4">Chưa có gói nào.</p>}
            </div>
          )}

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h4 className="font-medium mb-3">Thêm gói mới</h4>
            <form onSubmit={handleAdd} className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-3">
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Tên gói (VD: 1 Tháng)" className="w-full border p-2 rounded-lg text-sm" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Giá (VNĐ)" className="w-full border p-2 rounded-lg text-sm" />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border p-2 rounded-lg text-sm bg-white">
                  <option value="account">Account</option>
                  <option value="family">Family</option>
                </select>
              </div>
              <div className="col-span-12 sm:col-span-2">
                <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Số ngày" className="w-full border p-2 rounded-lg text-sm" />
              </div>
              <div className="col-span-12 sm:col-span-2 flex items-end">
                <Button type="submit" isLoading={adding} className="w-full h-full py-2">Thêm</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
