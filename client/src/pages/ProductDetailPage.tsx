import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { fetchProductById, createOrder } from '../lib/api';
import type { ApiProduct } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Headline, Title, Label } from '../components/ui/Typography';
import { Badge } from '../components/ui/Badge';

type Variant = ApiProduct['product_variants'][0];

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyEmailError, setFamilyEmailError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoadingProduct(true);

    fetchProductById(id)
      .then(setProduct)
      .catch(err => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      })
      .finally(() => setIsLoadingProduct(false));
  }, [id]);

  useEffect(() => {
    if (product && product.product_variants.length > 0) {
      setSelectedVariant(product.product_variants[0]);
      setFamilyEmail('');
      setFamilyEmailError('');
      setCheckoutUrl('');
    }
  }, [product]);

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Headline>Không tìm thấy sản phẩm</Headline>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  const category = product.categories;
  const isOutOfStock = (selectedVariant?.inventory_count ?? 0) === 0;
  const isFamilyVariant = selectedVariant?.type === 'family';

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setFamilyEmail('');
    setFamilyEmailError('');
    setCheckoutUrl('');
    setCheckoutError('');
  };

  const handleCheckout = async () => {
    if (!selectedVariant) return;

    // Validate family email
    if (isFamilyVariant) {
      if (!familyEmail || !familyEmail.includes('@')) {
        setFamilyEmailError('Vui lòng nhập email hợp lệ (có chứa @)');
        return;
      }
    }

    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutUrl('');

    try {
      const result = await createOrder({
        variantId: selectedVariant.id,
        productId: product.id,
        familyEmail: isFamilyVariant ? familyEmail : undefined,
      });

      setCheckoutUrl(result.checkoutUrl);
      // Scroll to checkout area
      setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes('auth') || error.message?.includes('token')) {
        setCheckoutError('Bạn cần đăng nhập để thanh toán');
      } else {
        setCheckoutError(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        {category && (
          <>
            <span>{category.name}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
          </>
        )}
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="aspect-[16/9] w-full rounded-custom overflow-hidden bg-slate-100 mb-8 border border-slate-200">
            {product.thumbnail_url ? (
              <img 
                src={product.thumbnail_url} 
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <span className="text-6xl">🤖</span>
              </div>
            )}
          </div>

            <div className="mb-12">
            {category && (
              <Label className="text-primary font-bold tracking-wider uppercase mb-2 block">
                {category.name}
              </Label>
            )}
            <Headline className="mb-6">{product.name}</Headline>
            {product.description ? (
              <div
                className="prose prose-slate max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-lg text-slate-600 leading-relaxed">Chưa có mô tả.</p>
            )}
            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Thông tin chi tiết</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> Giao hàng tự động 100% sau khi thanh toán</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> Bảo hành 1 đổi 1 trong thời gian sử dụng</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> Hỗ trợ kỹ thuật qua Telegram</li>
            </ul>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="border-t border-slate-200 pt-10">
            <Title className="mb-6">Câu hỏi thường gặp</Title>
            <div className="space-y-4">
              {[
                { q: 'Tôi nhận tài khoản bằng cách nào?', a: 'Sau khi thanh toán thành công, tài khoản sẽ hiển thị ngay trong trang "Đơn hàng của tôi".' },
                { q: 'Có được đổi trả không?', a: 'Chúng tôi áp dụng chính sách bảo hành 1 đổi 1 nếu tài khoản lỗi trong thời gian sử dụng đúng quy định.' },
                { q: 'Gói Family khác gì gói Thường?', a: 'Gói Family yêu cầu email để mời vào nhóm gia đình (xử lý thủ công bởi admin). Gói thường là tài khoản nạp sẵn (email/pass), giao tự động ngay lập tức.' },
              ].map((faq, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-custom border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-slate-600 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sticky */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24">
            <Card className="shadow-lg border-slate-200">
              <CardBody className="p-6 md:p-8">
                <Title className="mb-6 border-b border-slate-100 pb-4">Chọn gói sản phẩm</Title>

                {/* Variant Selector */}
                <div className="space-y-3 mb-6">
                  {product.product_variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const outOfStock = variant.inventory_count === 0;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        disabled={outOfStock}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 ${
                          isSelected
                            ? 'border-primary bg-blue-50/50'
                            : outOfStock
                            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                            {variant.variant_name}
                          </span>
                          {outOfStock ? (
                            <Badge variant="error">Hết hàng</Badge>
                          ) : variant.inventory_count < 5 ? (
                            <Badge variant="warning">Còn {variant.inventory_count}</Badge>
                          ) : null}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">
                            {variant.type === 'family' ? '📧 Mời qua Email' : '🔑 Tài khoản nạp sẵn'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Family Email Input */}
                {isFamilyVariant && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email của bạn (để nhận lời mời Family) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={familyEmail}
                      onChange={(e) => {
                        setFamilyEmail(e.target.value);
                        if (familyEmailError) setFamilyEmailError('');
                      }}
                      placeholder="yourname@gmail.com"
                      className={`w-full px-4 py-3 border rounded-custom text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        familyEmailError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                    />
                    {familyEmailError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {familyEmailError}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Admin sẽ mời email này vào nhóm Family trong vòng 1-2 giờ.
                    </p>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-slate-50 p-4 rounded-xl mb-4 flex justify-between items-center border border-slate-100">
                  <span className="text-slate-600 font-medium">Tổng thanh toán:</span>
                  <span className="text-2xl font-bold text-primary">
                    {selectedVariant
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVariant.price)
                      : '0 đ'}
                  </span>
                </div>

                {/* Error message */}
                {checkoutError && (
                  <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{checkoutError}</p>
                  </div>
                )}

                {/* Checkout button */}
                {!checkoutUrl ? (
                  <Button
                    size="lg"
                    className="w-full text-lg shadow-md"
                    onClick={handleCheckout}
                    disabled={isOutOfStock || !selectedVariant || isCheckingOut}
                    isLoading={isCheckingOut}
                  >
                    {isOutOfStock ? 'Tạm thời hết hàng' : 'Thanh toán ngay'}
                  </Button>
                ) : (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-custom bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Mở trang thanh toán PayOS
                  </a>
                )}

                {/* PayOS QR hint */}
                {checkoutUrl && (
                  <div ref={checkoutRef} className="mt-4 text-center text-sm text-slate-500">
                    Quét QR hoặc click link trên để thanh toán. Đơn sẽ được giao tự động sau khi xác nhận.
                  </div>
                )}

                {/* Family warning */}
                {isFamilyVariant && !checkoutUrl && (
                  <p className="mt-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Gói Family xử lý thủ công (1-2 giờ). Admin sẽ mời email của bạn sau khi thanh toán.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
