const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
    });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/goals
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('targetAmount').isFloat({ min: 1 }),
    body('currentAmount').optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const goal = await Goal.create({ ...req.body, userId: req.user.id });
      res.status(201).json(goal);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/goals/:id
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.update(req.body);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.destroy();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
