const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSubscription extends Model {
    static associate(models) {
      UserSubscription.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      UserSubscription.belongsTo(models.PromoCode, { foreignKey: 'promo_code_id', as: 'promo_code' });
    }
  }

  UserSubscription.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tier: {
      type: DataTypes.ENUM('free', 'premium', 'elite'),
      defaultValue: 'free'
    },
    promo_code_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'promo_codes',
        key: 'id'
      }
    },
    starts_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    auto_renew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'user_subscriptions',
    timestamps: true,
    underscored: true
  });

  return UserSubscription;
};
