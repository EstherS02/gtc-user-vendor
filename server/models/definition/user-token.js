/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserToken', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'CASCADE'
        },
        client_id: {
            type: DataTypes.BIGINT,
            field: 'client_id',
            allowNull: true,
            references: {
                model: 'appclients',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'CASCADE'
        },
        refresh_token: {
            type: DataTypes.TEXT,
            field: 'refresh_token',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        }
    }, {
        tableName: 'user_token',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const UserToken = model.UserToken;
    const User = model.User;
    const Appclient = model.Appclient;

    UserToken.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

    UserToken.belongsTo(Appclient, {
        foreignKey: 'client_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

};
