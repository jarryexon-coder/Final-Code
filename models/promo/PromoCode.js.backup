const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PromoCode extends Model {
    static associate(models) {
      PromoCode.belongsTo(models.User, { foreignKey: 'influencer_id', as: 'influencer' });
      PromoCode.hasMany(models.PromoUsage, { foreignKey: 'promo_code_id', as: 'usages' });
    }
  }

  PromoCode.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed', 'trial'),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    max_uses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    uses_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    influencer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    starts_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PromoCode',
    tableName: 'promo_codes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['active', 'is_public']
      }
    ]
  });

  return PromoCode;
};
