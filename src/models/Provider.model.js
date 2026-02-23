const { Model, DataTypes } = require('sequelize');

class Provider extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        businessName: {
          type: DataTypes.STRING,
          allowNull: false,
          unique:true,
        },
        description: {
          type: DataTypes.TEXT,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        subCategories: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('subCategories');
            return value || [];  
          }
        },
        phoneNumber: {
          type: DataTypes.STRING,
        },
        whatsappNumber: {
          type: DataTypes.STRING,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
        placeId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull:true,
        },
        images: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('images');
            return value || [];
          }
        },
        workingHours: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('workingHours');
            return value || {};
          }
        },
        services: {
          type: DataTypes.JSON,
          get() {
            const value = this.getDataValue('services');
            return value || [];
          }
        },
        averageRating: {
          type: DataTypes.DECIMAL(2, 1),
          defaultValue: 0.0,
        },
        totalReviews: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        verificationOTP: {
          type: DataTypes.STRING(6),
          allowNull: true,
        },
        otpExpiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        otpVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        verificationStatus: {
          type: DataTypes.ENUM('pending', 'verified', 'rejected'),
          defaultValue: 'pending',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'providers',
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['businessName'],  
          },
          {
            fields: ['category'],
          },
          {
            fields: ['latitude', 'longitude'],
          },
          {
            fields: ['averageRating'],
          },
        ],
      }
    );
  }
}

module.exports = Provider;