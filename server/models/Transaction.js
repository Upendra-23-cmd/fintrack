const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Account = require('./Account');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  accountId: { type: DataTypes.UUID, allowNull: false, references: { model: Account, key: 'id' } },
  type: { type: DataTypes.ENUM('income', 'expense', 'transfer'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  category: {
    type: DataTypes.ENUM(
      'salary', 'freelance', 'investment', 'food', 'housing',
      'transport', 'utilities', 'shopping', 'health', 'entertainment',
      'education', 'travel', 'transfer', 'other'
    ),
    allowNull: false,
  },
  description: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
});

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });
Account.hasMany(Transaction, { foreignKey: 'accountId' });
Transaction.belongsTo(Account, { foreignKey: 'accountId' });

module.exports = Transaction;
