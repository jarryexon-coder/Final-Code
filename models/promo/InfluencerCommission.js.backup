const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class InfluencerCommission extends Model {
    static associate(models) {
      InfluencerCommission.belongsTo(models.User, { foreignKey: 'influencer_id', as: 'influencer' });
      InfluencerCommission.belongsTo(models.User, { foreignKey: 'referred_user_id', as: 'referred_user' });
      InfluencerCommission.belongsTo(models.PromoCode, { foreignKey: 'promo_code_id', as: 'promo_code' });
    }
  }

  InfluencerCommission.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    influencer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    referred_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    promo_code_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'promo_codes',
        key: 'id'
      }
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 15.00
    },
    commission_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      defaultValue: 'pending'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'InfluencerCommission',
    tableName: 'influencer_commissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['influencer_id', 'status']
      },
      {
        fields: ['status']
      }
    ]
  });

  return InfluencerCommission;
};
