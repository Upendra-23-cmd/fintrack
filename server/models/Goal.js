const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Goal = sequelize.define('Goal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  targetAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  deadline: { type: DataTypes.DATEONLY },
  color: { type: DataTypes.STRING, defaultValue: '#0F6E56' },
  icon: { type: DataTypes.STRING, defaultValue: 'target' },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
});

User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId' });

module.exports = Goal;
