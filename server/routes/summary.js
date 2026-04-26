const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/db');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/summary - Net worth, monthly income/expenses, category breakdown
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Net worth from all accounts
    const accounts = await Account.findAll({ where: { userId, isActive: true } });
    const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // Monthly transactions
    const monthlyTxns = await Transaction.findAll({
      where: { userId, date: { [Op.between]: [startOfMonth, endOfMonth] } },
      attributes: ['type', 'amount', 'category'],
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const categoryTotals = {};

    monthlyTxns.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') monthlyIncome += amt;
      if (t.type === 'expense') {
        monthlyExpense += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }
    });

    // Last 6 months trend
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const txns = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [start, end] } },
        attributes: ['type', 'amount'],
      });
      let inc = 0, exp = 0;
      txns.forEach((t) => {
        if (t.type === 'income') inc += parseFloat(t.amount);
        if (t.type === 'expense') exp += parseFloat(t.amount);
      });
      trend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        income: inc,
        expense: exp,
        savings: inc - exp,
      });
    }

    res.json({
      netWorth,
      monthlyIncome,
      monthlyExpense,
      savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0,
      categoryBreakdown: Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => ({ category, amount })),
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
