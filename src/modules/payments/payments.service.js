const { v4: uuidv4 } = require('uuid');

// In-memory store for payment attempts (replace with DB repository as needed)
const paymentAttempts = new Map();

/**
 * Resolve the active payment adapter.
 * Extend this to support multiple providers (Stripe, PayPal, etc.)
 */
function getActiveAdapter() {
  // Default stub adapter — replace with real provider integration
  return {
    async initiate(payload) {
      return {
        providerReference: `prov_${uuidv4()}`,
        redirectUrl: null,
        status: 'pending',
        raw: payload,
      };
    },
    async processCallback(payload) {
      return {
        providerReference: payload.providerReference || payload.reference || null,
        status: payload.status || 'completed',
        raw: payload,
      };
    },
  };
}

/**
 * Persist a payment attempt record.
 */
function persistAttempt(attempt) {
  paymentAttempts.set(attempt.paymentId, attempt);
  return attempt;
}

/**
 * Retrieve a payment attempt by ID.
 */
function findAttemptById(paymentId) {
  return paymentAttempts.get(paymentId) || null;
}

/**
 * Initiate a new payment.
 * REQ-32
 */
async function initiatePayment(payload) {
  const adapter = getActiveAdapter();
  const providerResponse = await adapter.initiate(payload);

  const attempt = persistAttempt({
    paymentId: uuidv4(),
    orderId: payload.orderId || null,
    amount: payload.amount,
    currency: payload.currency,
    provider: 'default',
    status: providerResponse.status,
    providerReference: providerResponse.providerReference,
    redirectUrl: providerResponse.redirectUrl,
    metadata: payload.metadata || {},
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return attempt;
}

/**
 * Handle a payment provider callback/webhook.
 * REQ-33
 */
async function handleCallback(payload) {
  const adapter = getActiveAdapter();
  const providerResult = await adapter.processCallback(payload);

  // Attempt to locate the existing payment attempt by provider reference
  let existingAttempt = null;
  for (const attempt of paymentAttempts.values()) {
    if (attempt.providerReference === providerResult.providerReference) {
      existingAttempt = attempt;
      break;
    }
  }

  if (existingAttempt) {
    existingAttempt.status = providerResult.status;
    existingAttempt.updatedAt = new Date().toISOString();
    persistAttempt(existingAttempt);
    return existingAttempt;
  }

  // If no matching attempt found, record a new one from the callback
  const newAttempt = persistAttempt({
    paymentId: uuidv4(),
    orderId: payload.orderId || null,
    amount: payload.amount || null,
    currency: payload.currency || null,
    provider: 'default',
    status: providerResult.status,
    providerReference: providerResult.providerReference,
    redirectUrl: null,
    metadata: payload.metadata || {},
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return newAttempt;
}

/**
 * Retrieve a payment attempt by ID.
 * REQ-32
 */
async function getPaymentById(paymentId) {
  return findAttemptById(paymentId);
}

/**
 * Retry a failed payment.
 * REQ-34
 */
async function retryPayment(paymentId, payload) {
  const attempt = findAttemptById(paymentId);

  if (!attempt) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.status === 'completed') {
    const error = new Error('Cannot retry a completed payment.');
    error.statusCode = 400;
    throw error;
  }

  const adapter = getActiveAdapter();
  const providerResponse = await adapter.initiate({
    ...attempt,
    ...payload,
  });

  attempt.status = providerResponse.status;
  attempt.providerReference = providerResponse.providerReference;
  attempt.redirectUrl = providerResponse.redirectUrl;
  attempt.attempts += 1;
  attempt.updatedAt = new Date().toISOString();

  persistAttempt(attempt);

  return attempt;
}

module.exports = {
  initiatePayment,
  handleCallback,
  getPaymentById,
  retryPayment,
};
