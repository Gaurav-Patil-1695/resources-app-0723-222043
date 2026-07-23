const db = require('../../config/db');

const getAddressesByUserId = async (userId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at ASC',
    [userId]
  );
  return result.rows;
};

const getAddressById = async (userId, addressId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [addressId, userId]
  );
  return result.rows[0] || null;
};

const isPinCodeServiceable = async (pinCode) => {
  const result = await db.query(
    'SELECT 1 FROM serviceable_pin_codes WHERE pin_code = $1 AND is_active = TRUE LIMIT 1',
    [pinCode]
  );
  return result.rowCount > 0;
};

const unsetDefaultAddress = async (userId, client) => {
  await (client || db).query(
    'UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
};

const createAddress = async (userId, payload) => {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
  } = payload;

  const serviceable = await isPinCodeServiceable(pin_code);
  if (!serviceable) {
    const error = new Error('Delivery is not available at the provided pin code.');
    error.statusCode = 422;
    throw error;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await unsetDefaultAddress(userId, client);
    } else {
      const existing = await client.query(
        'SELECT 1 FROM addresses WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1',
        [userId]
      );
      if (existing.rowCount === 0) {
        payload.is_default = true;
      }
    }

    const result = await client.query(
      `INSERT INTO addresses
        (user_id, full_name, phone, address_line1, address_line2, city, state, pin_code, country, is_default, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING *`,
      [
        userId,
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        pin_code,
        country || 'India',
        payload.is_default || false,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateAddress = async (userId, addressId, payload) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) return null;

  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
  } = payload;

  if (pin_code && pin_code !== existing.pin_code) {
    const serviceable = await isPinCodeServiceable(pin_code);
    if (!serviceable) {
      const error = new Error('Delivery is not available at the provided pin code.');
      error.statusCode = 422;
      throw error;
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await unsetDefaultAddress(userId, client);
    }

    const result = await client.query(
      `UPDATE addresses SET
        full_name      = COALESCE($1, full_name),
        phone          = COALESCE($2, phone),
        address_line1  = COALESCE($3, address_line1),
        address_line2  = COALESCE($4, address_line2),
        city           = COALESCE($5, city),
        state          = COALESCE($6, state),
        pin_code       = COALESCE($7, pin_code),
        country        = COALESCE($8, country),
        is_default     = COALESCE($9, is_default),
        updated_at     = NOW()
       WHERE id = $10 AND user_id = $11 AND deleted_at IS NULL
       RETURNING *`,
      [
        full_name || null,
        phone || null,
        address_line1 || null,
        address_line2 !== undefined ? address_line2 : null,
        city || null,
        state || null,
        pin_code || null,
        country || null,
        is_default !== undefined ? is_default : null,
        addressId,
        userId,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteAddress = async (userId, addressId) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) return null;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE addresses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );

    if (existing.is_default) {
      await client.query(
        `UPDATE addresses SET is_default = TRUE, updated_at = NOW()
         WHERE id = (
           SELECT id FROM addresses
           WHERE user_id = $1 AND deleted_at IS NULL
           ORDER BY created_at ASC
           LIMIT 1
         )`,
        [userId]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
