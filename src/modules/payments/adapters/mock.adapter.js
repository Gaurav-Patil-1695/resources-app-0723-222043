'use strict';

const PaymentAdapterInterface = require('./payment.adapter.interface');

/**
 * MockAdapter
 *
 * A test-mode payment adapter that returns configurable success or failure
 * responses without making any real network calls.
 *
 * Usage:
 *
 *   const adapter = new MockAdapter();
 *
 *   // Default — all operations succeed
 *   adapter.initialize({});
 *
 *   // Force all operations to fail
 *   adapter.initialize({ shouldFail: true, errorMessage: 'Card declined.' });
 *
 *   // Override individual operations
 *   adapter.setOperationResult('createPayment', { success: false, errorCode: 'INSUFFICIENT_FUNDS' });
 *
 *   // Introduce artificial latency (ms)
 *   adapter.initialize({ latency: 200 });
 */
class MockAdapter extends PaymentAdapterInterface {
  constructor() {
    super();

    /** @type {boolean} */
    this._shouldFail = false;

    /** @type {string} */
    this._errorMessage = 'Mock payment failure.';

    /** @type {string} */
    this._errorCode = 'MOCK_FAILURE';

    /** @type {number} Artificial delay in milliseconds */
    this._latency = 0;

    /**
     * Per-operation overrides.
     * Keys match method names; values are merged into the default response.
     * @type {Map<string, Object>}
     */
    this._operationOverrides = new Map();

    /** @type {number} Auto-incrementing counter for generated IDs */
    this._idCounter = 1;
  }

  // ---------------------------------------------------------------------------
  // Configuration helpers
  // ---------------------------------------------------------------------------

  /**
   * Initialise the mock adapter with optional behaviour configuration.
   *
   * @param {Object}  [config]
   * @param {boolean} [config.shouldFail=false]             - When true all operations return failure.
   * @param {string}  [config.errorMessage]                 - Error message used in failure responses.
   * @param {string}  [config.errorCode]                    - Error code used in failure responses.
   * @param {number}  [config.latency=0]                    - Artificial latency in milliseconds.
   */
  initialize(config = {}) {
    this._shouldFail = Boolean(config.shouldFail);
    this._errorMessage = config.errorMessage || 'Mock payment failure.';
    this._errorCode = config.errorCode || 'MOCK_FAILURE';
    this._latency = typeof config.latency === 'number' && config.latency >= 0 ? config.latency : 0;
    this._operationOverrides.clear();
    this._idCounter = 1;
  }

  /**
   * Override the result for a specific operation.
   *
   * @param {string} operationName - One of: createPayment, capturePayment, voidPayment,
   *                                          refundPayment, getPaymentStatus, validateWebhook.
   * @param {Object} resultOverride - Partial result object merged into the default response.
   */
  setOperationResult(operationName, resultOverride) {
    if (typeof operationName !== 'string' || !operationName) {
      throw new TypeError('operationName must be a non-empty string.');
    }
    if (typeof resultOverride !== 'object' || resultOverride === null) {
      throw new TypeError('resultOverride must be a plain object.');
    }
    this._operationOverrides.set(operationName, resultOverride);
  }

  /**
   * Clear the per-operation override for a specific operation.
   *
   * @param {string} operationName
   */
  clearOperationResult(operationName) {
    this._operationOverrides.delete(operationName);
  }

  /**
   * Reset all overrides and counters without re-reading config.
   */
  reset() {
    this._operationOverrides.clear();
    this._idCounter = 1;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /** @returns {string} */
  _nextId(prefix) {
    return `${prefix}_mock_${String(this._idCounter++).padStart(8, '0')}`;
  }

  /** @returns {Promise<void>} */
  _delay() {
    if (this._latency <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this._latency));
  }

  /**
   * Resolve the final response for an operation, honouring:
   *   1. Global shouldFail flag.
   *   2. Per-operation override (merged on top of the default success response).
   *
   * @param {string} operationName
   * @param {Object} successResponse
   * @param {Object} failureResponse
   * @returns {Object}
   */
  _resolve(operationName, successResponse, failureResponse) {
    const override = this._operationOverrides.get(operationName);

    if (this._shouldFail) {
      const base = { ...failureResponse };
      return override ? { ...base, ...override } : base;
    }

    const base = { ...successResponse };
    return override ? { ...base, ...override } : base;
  }

  // ---------------------------------------------------------------------------
  // PaymentAdapterInterface implementation
  // ---------------------------------------------------------------------------

  /** @returns {string} */
  getName() {
    return 'mock';
  }

  /**
   * @param {Object} paymentData
   * @returns {Promise<Object>}
   */
  async createPayment(paymentData = {}) {
    await this._delay();

    const transactionId = this._nextId('txn');
    const amount = paymentData.amount || 0;
    const currency = paymentData.currency || 'USD';

    const success = {
      success: true,
      transactionId,
      status: 'authorised',
      amount,
      currency,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, amount, currency, status: 'authorised' },
      },
    };

    const failure = {
      success: false,
      transactionId: null,
      status: 'failed',
      amount,
      currency,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      providerResponse: {
        provider: 'mock',
        raw: { status: 'failed', errorCode: this._errorCode, errorMessage: this._errorMessage },
      },
    };

    return this._resolve('createPayment', success, failure);
  }

  /**
   * @param {string} transactionId
   * @param {number} [amount]
   * @returns {Promise<Object>}
   */
  async capturePayment(transactionId, amount) {
    await this._delay();

    const success = {
      success: true,
      transactionId,
      status: 'captured',
      capturedAmount: amount || 0,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, capturedAmount: amount || 0, status: 'captured' },
      },
    };

    const failure = {
      success: false,
      transactionId,
      status: 'failed',
      capturedAmount: 0,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'failed', errorCode: this._errorCode },
      },
    };

    return this._resolve('capturePayment', success, failure);
  }

  /**
   * @param {string} transactionId
   * @returns {Promise<Object>}
   */
  async voidPayment(transactionId) {
    await this._delay();

    const success = {
      success: true,
      transactionId,
      status: 'voided',
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'voided' },
      },
    };

    const failure = {
      success: false,
      transactionId,
      status: 'failed',
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'failed', errorCode: this._errorCode },
      },
    };

    return this._resolve('voidPayment', success, failure);
  }

  /**
   * @param {string} transactionId
   * @param {number} [amount]
   * @param {string} [reason]
   * @returns {Promise<Object>}
   */
  async refundPayment(transactionId, amount, reason) {
    await this._delay();

    const refundId = this._nextId('ref');

    const success = {
      success: true,
      refundId,
      transactionId,
      status: 'refunded',
      refundedAmount: amount || 0,
      reason: reason || null,
      providerResponse: {
        provider: 'mock',
        raw: { refundId, transactionId, refundedAmount: amount || 0, status: 'refunded' },
      },
    };

    const failure = {
      success: false,
      refundId: null,
      transactionId,
      status: 'failed',
      refundedAmount: 0,
      reason: reason || null,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'failed', errorCode: this._errorCode },
      },
    };

    return this._resolve('refundPayment', success, failure);
  }

  /**
   * @param {string} transactionId
   * @returns {Promise<Object>}
   */
  async getPaymentStatus(transactionId) {
    await this._delay();

    const success = {
      success: true,
      transactionId,
      status: 'captured',
      amount: 0,
      currency: 'USD',
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'captured' },
      },
    };

    const failure = {
      success: false,
      transactionId,
      status: 'unknown',
      amount: 0,
      currency: 'USD',
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      providerResponse: {
        provider: 'mock',
        raw: { transactionId, status: 'unknown', errorCode: this._errorCode },
      },
    };

    return this._resolve('getPaymentStatus', success, failure);
  }

  /**
   * @param {Object} payload
   * @param {Object} headers
   * @param {string} [secret]
   * @returns {Promise<Object>}
   */
  async validateWebhook(payload = {}, headers = {}, secret) { // eslint-disable-line no-unused-vars
    await this._delay();

    const transactionId = (payload && payload.transactionId) || null;
    const event = (payload && payload.event) || 'payment.updated';

    const success = {
      valid: true,
      event,
      transactionId,
      data: payload,
    };

    const failure = {
      valid: false,
      event,
      transactionId,
      data: payload,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
    };

    return this._resolve('validateWebhook', success, failure);
  }
}

module.exports = MockAdapter;
