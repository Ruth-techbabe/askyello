const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        googleId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: true,
        },
         password: {  
          type: DataTypes.STRING,
          allowNull: true,
         },
        email: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
          validate: {
            isEmail: true,
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        picture: {
          type: DataTypes.STRING,
        },
        role: {
          type: DataTypes.ENUM('user', 'provider', 'admin'),
          defaultValue: 'user',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
         emailVerified: {  
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        lastLogin: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
      }
    );
  }
}

module.exports = User;