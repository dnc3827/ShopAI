// services/payos.service.js
// PayOS integration service
// ⚠️ Key rules from TDD:
//   - order_code: Number when calling API, String when storing in DB
//   - description: max 25 chars
//   - Webhook: always return 200
//   - HMAC: sort keys of data before verifying

const { PayOS } = require('@payos/node');
const crypto = require('crypto');

// Lazy initialization to avoid requiring credentials at module load time
let _payos = null;

function getPayos() {
  if (!_payos) {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error('Missing PayOS environment variables: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY');
    }
    _payos = new PayOS({ clientId, apiKey, checksumKey });
  }
  return _payos;
}

async function createPaymentLink(params) {
  const payos = getPayos();
  const paymentData = {
    orderCode: params.orderCode, // ⚠️ Number type required by PayOS
    amount: params.amount,
    description: params.description.substring(0, 25), // ⚠️ Max 25 chars
    cancelUrl: params.cancelUrl,
    returnUrl: params.returnUrl,
    items: [
      {
        name: params.productName.substring(0, 25),
        quantity: 1,
        price: params.price,
      },
    ],
  };
  return await payos.paymentRequests.create(paymentData);
}

/**
 * Verify PayOS webhook HMAC signature
 * ⚠️ Keys MUST be sorted alphabetically before building the signing string
 */
function verifyWebhookSignature(data, receivedSignature) {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

  // Sort keys alphabetically and build query string
  const sortedKeys = Object.keys(data).sort();
  const signatureData = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&');

  const expectedSignature = crypto
    .createHmac('sha256', checksumKey)
    .update(signatureData)
    .digest('hex');

  return expectedSignature === receivedSignature;
}

module.exports = {
  getPayos,
  createPaymentLink,
  verifyWebhookSignature
};
