const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const limiter = new RateLimiterMemory({ points: 10, duration: 60 });

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      await limiter.consume(req.ip);
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password } = req.body;
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already registered' });

      const user = await User.create({ name, email, password });
      const token = generateToken(user.id);

      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, currency: user.currency },
      });
    } catch (err) {
      if (err.constructor.name === 'RateLimiterRes') {
        return res.status(429).json({ message: 'Too many requests' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      await limiter.consume(req.ip);
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, currency: user.currency },
      });
    } catch (err) {
      if (err.constructor.name === 'RateLimiterRes') {
        return res.status(429).json({ message: 'Too many requests' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
