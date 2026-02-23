const { Model, DataTypes } = require('sequelize');

class ReviewFingerprint extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        providerId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'providers',
            key: 'id',
          },
        },
        ipHash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        deviceHash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userAgent: {
          type: DataTypes.TEXT,
        },
        lastReviewAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        reviewCount: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: 'review_fingerprints',
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['providerId', 'ipHash', 'deviceHash'],
          },
        ],
      }
    );
  }
}

module.exports = ReviewFingerprint;