const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, type, category,
      startDate, endDate, accountId, search,
    } = req.query;

    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (category) where.category = category;
    if (accountId) where.accountId = accountId;
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };
    if (search) where.description = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Account, attributes: ['id', 'name', 'type'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      transactions: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/transactions
router.post(
  '/',
  [
    body('accountId').isUUID(),
    body('type').isIn(['income', 'expense', 'transfer']),
    body('amount').isFloat({ min: 0.01 }),
    body('category').notEmpty(),
    body('description').trim().notEmpty(),
    body('date').isDate(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const account = await Account.findOne({ where: { id: req.body.accountId, userId: req.user.id } });
      if (!account) return res.status(404).json({ message: 'Account not found' });

      const transaction = await Transaction.create({ ...req.body, userId: req.user.id });

      // Update account balance
      const delta = req.body.type === 'income' ? parseFloat(req.body.amount) : -parseFloat(req.body.amount);
      await account.increment('balance', { by: delta });

      res.status(201).json(transaction);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await transaction.update(req.body);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse account balance
    const account = await Account.findByPk(transaction.accountId);
    if (account) {
      const delta = transaction.type === 'income' ? -parseFloat(transaction.amount) : parseFloat(transaction.amount);
      await account.increment('balance', { by: delta });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
