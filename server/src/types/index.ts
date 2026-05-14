// src/types/index.ts
// Shared TypeScript types for the server

export interface OrderStatus {
  PENDING: 'PENDING';
  PAID: 'PAID';
  FULFILLED: 'FULFILLED';
  CANCELLED: 'CANCELLED';
}

export interface InventoryStatus {
  AVAILABLE: 'AVAILABLE';
  SOLD: 'SOLD';
}

export interface CreateOrderPayload {
  variantId: string;
  productId: string;
  familyEmail?: string; // required when variant.type === 'family'
}

export interface PayOSPaymentData {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface WebhookPayload {
  code: string;
  success: boolean;
  data: {
    orderCode: number | string;
    amount: number;
    description: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl?: string;
    transactionDateTime?: string;
    [key: string]: unknown;
  };
  signature: string;
}
