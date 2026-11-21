import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rentease_super_secure_jwt_secret_key_2026';

const makeToken = user => jwt.sign(
  { id: user._id, name: user.name, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Enter your name, email and a password of at least 6 characters.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ message: 'Could not create account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Incorrect email or password.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (e) {
    console.error('Auth me error:', e);
    res.status(500).json({ message: 'Could not fetch user profile.' });
  }
});

export default router;
