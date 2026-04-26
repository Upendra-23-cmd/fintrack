const express = require('express');
const { body, validationResult } = require('express-validator');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.user.id, isActive: true },
      order: [['createdAt', 'ASC']],
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/accounts
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['savings', 'current', 'investment', 'wallet', 'credit']),
    body('balance').isFloat(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const account = await Account.create({ ...req.body, userId: req.user.id });
      res.status(201).json(account);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/accounts/:id
router.put('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await account.update(req.body);
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/accounts/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await account.update({ isActive: false });
    res.json({ message: 'Account removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
