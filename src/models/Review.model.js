const { Model, DataTypes } = require('sequelize');

class Review extends Model {
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
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5,
          },
        },
        comment: {
          type: DataTypes.TEXT,
        },
        images: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('images');
            return value || [];
          }
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
          defaultValue: 'pending',
        },
        weight: {
          type: DataTypes.DECIMAL(2, 1),
          defaultValue: 1.0,
        },
        sentimentScore: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: true,
        },
        aiFlags: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('aiFlags');
            return value || {};
          }
        },
        fingerprintId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'reviews',
        timestamps: true,
        indexes: [
          {
            fields: ['providerId'],
          },
          {
            fields: ['status'],
          },
          {
            fields: ['createdAt'],
          },
        ],
      }
    );
  }
}

module.exports = Review;