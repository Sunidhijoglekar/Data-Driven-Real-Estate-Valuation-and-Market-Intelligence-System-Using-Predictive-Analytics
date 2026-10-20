import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readStore, writeStore } from '../database/storage.js';

const accounts = readStore('accounts', {});
const sessions = new Map();
const digest = token => createHash('sha256').update(token).digest('hex');

export function authenticate(req, res, next) {
  const session = sessions.get(digest(req.headers.authorization?.replace(/^Bearer /, '') || ''));
  if (!session || session.expires < Date.now()) return res.status(401).json({ error: 'Please sign in again.' });
  req.user = session.user;
  next();
}

export const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: `${role} access required` });
  next();
};

export function getSession(req, res) {
  res.json({ user: req.user });
}

export function authenticateAccount(req, res) {
  const { password, role } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8 || !['Buyer', 'Seller', 'Investor'].includes(role)) {
    return res.status(400).json({ error: 'Valid email, role and password of at least 8 characters are required.' });
  }
  let account = accounts[email];
  if (req.path === '/register') {
    if (Object.hasOwn(accounts, email)) return res.status(409).json({ error: 'Account already exists. Please sign in.' });
    const salt = randomBytes(16).toString('hex');
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 100) : '';
    account = { email, role, name: name || email.split('@')[0], salt, hash: scryptSync(password, salt, 64).toString('hex') };
    accounts[email] = account;
    try { writeStore('accounts', accounts); }
    catch (error) { delete accounts[email]; return res.status(500).json({ error: 'Unable to save account' }); }
  } else if (!Object.hasOwn(accounts, email) || account.role !== role || !timingSafeEqual(Buffer.from(account.hash, 'hex'), scryptSync(password, account.salt, 64))) {
    return res.status(401).json({ error: 'Invalid credentials. Create an account first if you are new.' });
  }
  const user = { id: email, email, role: account.role, name: account.name };
  const token = randomBytes(32).toString('hex');
  sessions.set(digest(token), { user, expires: Date.now() + 12 * 60 * 60 * 1000 });
  res.json({ user: { ...user, token } });
}

export function logout(req, res) {
  sessions.delete(digest(req.headers.authorization?.replace(/^Bearer /, '') || ''));
  res.json({ success: true });
}
