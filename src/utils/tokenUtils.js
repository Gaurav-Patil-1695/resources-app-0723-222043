const crypto = require('crypto');

const TOKEN_BYTE_LENGTH = 32;

/**
 * Generate a cryptographically secure random reset token.
 *
 * @returns {{ rawToken: string, hashedToken: string }}
 *   rawToken    - Hex string sent to the user (stored in email / response)
 *   hashedToken - SHA-256 hex digest stored in the database for comparison
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, hashedToken };
};

/**
 * Hash a raw token using SHA-256 so it can be compared with the stored hash.
 *
 * @param {string} rawToken - Hex token string received from the user
 * @returns {string} SHA-256 hex digest
 */
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Verify that a raw token matches a previously stored hashed token.
 *
 * @param {string} rawToken    - Hex token string received from the user
 * @param {string} hashedToken - SHA-256 hex digest stored in the database
 * @returns {boolean}
 */
const verifyResetToken = (rawToken, hashedToken) => {
  const computed = hashToken(rawToken);
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(hashedToken, 'hex')
  );
};

module.exports = { generateResetToken, hashToken, verifyResetToken };
