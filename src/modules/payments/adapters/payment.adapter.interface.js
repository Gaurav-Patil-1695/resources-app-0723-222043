/**
 * PaymentAdapterInterface
 *
 * Duck-type contract that every payment provider adapter must satisfy.
 * Extend or implement this class and override all methods.
 *
 * All methods must return a Promise that resolves to a result object
 * containing at minimum the fields documented on each method.
 */
class PaymentAdapterInterface {
  /**
   * Initialise the adapter with provider-specific configuration.
   *
   * @param {Object} config - Provider configuration (API keys, URLs, etc.)
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  initialize(config) {
    throw new Error('PaymentAdapterInterface.initialize() must be implemented by subclass.');
  }

  /**
   * Create a new payment / charge.
   *
   * @param {Object} paymentData
   * @param {number}  paymentData.amount       - Amount in the smallest currency unit (e.g. cents).
   * @param {string}  paymentData.currency     - ISO 4217 currency code (e.g. "USD").
   * @param {string}  paymentData.description  - Human-readable payment description.
   * @param {Object}  paymentData.metadata     - Arbitrary key/value metadata.
   * @param {Object}  [paymentData.customer]   - Optional customer information.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   transactionId: string,
   *   status: string,
   *   amount: number,
   *   currency: string,
   *   providerResponse: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createPayment(paymentData) {
    throw new Error('PaymentAdapterInterface.createPayment() must be implemented by subclass.');
  }

  /**
   * Capture a previously authorised payment.
   *
   * @param {string} transactionId - The transaction identifier returned by createPayment.
   * @param {number} [amount]      - Amount to capture (defaults to the full authorised amount).
   *
   * @returns {Promise<{
   *   success: boolean,
   *   transactionId: string,
   *   status: string,
   *   capturedAmount: number,
   *   providerResponse: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async capturePayment(transactionId, amount) {
    throw new Error('PaymentAdapterInterface.capturePayment() must be implemented by subclass.');
  }

  /**
   * Void / cancel an authorised payment that has not yet been captured.
   *
   * @param {string} transactionId - The transaction identifier returned by createPayment.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   transactionId: string,
   *   status: string,
   *   providerResponse: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async voidPayment(transactionId) {
    throw new Error('PaymentAdapterInterface.voidPayment() must be implemented by subclass.');
  }

  /**
   * Refund a captured payment, in full or partially.
   *
   * @param {string} transactionId - The transaction identifier returned by createPayment.
   * @param {number} [amount]      - Amount to refund (defaults to the full captured amount).
   * @param {string} [reason]      - Optional reason for the refund.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   refundId: string,
   *   transactionId: string,
   *   status: string,
   *   refundedAmount: number,
   *   providerResponse: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async refundPayment(transactionId, amount, reason) {
    throw new Error('PaymentAdapterInterface.refundPayment() must be implemented by subclass.');
  }

  /**
   * Retrieve the current status of a payment.
   *
   * @param {string} transactionId - The transaction identifier returned by createPayment.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   transactionId: string,
   *   status: string,
   *   amount: number,
   *   currency: string,
   *   providerResponse: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async getPaymentStatus(transactionId) {
    throw new Error('PaymentAdapterInterface.getPaymentStatus() must be implemented by subclass.');
  }

  /**
   * Validate a webhook payload received from the provider.
   *
   * @param {Object} payload   - Raw webhook body.
   * @param {Object} headers   - HTTP request headers (used for signature verification).
   * @param {string} [secret]  - Webhook signing secret.
   *
   * @returns {Promise<{
   *   valid: boolean,
   *   event: string,
   *   transactionId: string,
   *   data: Object
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async validateWebhook(payload, headers, secret) {
    throw new Error('PaymentAdapterInterface.validateWebhook() must be implemented by subclass.');
  }

  /**
   * Return the canonical adapter name used for logging and diagnostics.
   *
   * @returns {string}
   */
  getName() {
    throw new Error('PaymentAdapterInterface.getName() must be implemented by subclass.');
  }
}

module.exports = PaymentAdapterInterface;
