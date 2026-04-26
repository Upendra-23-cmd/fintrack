const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Account = sequelize.define('Account', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM('savings', 'current', 'investment', 'wallet', 'credit'),
    allowNull: false,
  },
  balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  institution: { type: DataTypes.STRING },
  color: { type: DataTypes.STRING, defaultValue: '#185FA5' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId' });

module.exports = Account;
