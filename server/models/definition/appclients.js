/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Appclient', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        secret: {
            type: DataTypes.STRING(255),
            field: 'secret',
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: true
        },
        type: {
            type: DataTypes.STRING(8),
            field: 'type',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        }
    }, {
        tableName: 'appclients',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Appclient = model.Appclient;
    const UserToken = model.UserToken;
    const User = model.User;

    Appclient.hasMany(UserToken, {
        foreignKey: 'client_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

    Appclient.belongsToMany(User, {
        through: UserToken,
        foreignKey: 'client_id',
        otherKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

};
