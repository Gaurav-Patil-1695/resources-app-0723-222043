const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getUserByEmail, createUser, updateUserPassword, savePasswordResetToken, getPasswordResetToken, deletePasswordResetToken } = require('../../repositories/user.repository');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const blacklistedTokens = new Set();

const issueToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const register = async ({ name, email, password }) => {
  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error('Email is already registered.');
    err.statusCode = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ name, email, password: hashedPassword, role: 'user' });
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  const user = await getUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const logout = async (token) => {
  if (token) {
    blacklistedTokens.add(token);
  }
};

const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

const forgotPassword = async (email) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return;
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await savePasswordResetToken({ userId: user.id, token: resetToken, expiresAt });
  // In a real application, send the resetToken via email here.
  // e.g. emailService.sendPasswordReset(user.email, resetToken);
};

const resetPassword = async ({ token, password }) => {
  const record = await getPasswordResetToken(token);
  if (!record) {
    const err = new Error('Invalid or expired password reset token.');
    err.statusCode = 400;
    throw err;
  }
  if (new Date() > new Date(record.expiresAt)) {
    await deletePasswordResetToken(token);
    const err = new Error('Invalid or expired password reset token.');
    err.statusCode = 400;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await updateUserPassword({ userId: record.userId, password: hashedPassword });
  await deletePasswordResetToken(token);
};

const guestRegister = async ({ name, email }) => {
  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error('Email is already registered.');
    err.statusCode = 409;
    throw err;
  }
  const temporaryPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
  const user = await createUser({ name, email, password: hashedPassword, role: 'guest' });
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

module.exports = {
  register,
  login,
  logout,
  isTokenBlacklisted,
  forgotPassword,
  resetPassword,
  guestRegister,
  verifyToken,
};
