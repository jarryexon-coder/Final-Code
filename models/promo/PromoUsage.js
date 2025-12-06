const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PromoUsage extends Model {
    static associate(models) {
      PromoUsage.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      PromoUsage.belongsTo(models.PromoCode, { foreignKey: 'promo_code_id', as: 'promo_code' });
    }
  }

  PromoUsage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    promo_code_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'promo_codes',
        key: 'id'
      }
    },
    discount_applied: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'PromoUsage',
    tableName: 'promo_usage',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'promo_code_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return PromoUsage;
};
