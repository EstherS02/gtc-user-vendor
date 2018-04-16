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
            onDelete: 'NO ACTION'
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
            onDelete: 'NO ACTION'
        },
        refresh_token: {
            type: DataTypes.TEXT,
            field: 'refresh_token',
            allowNull: true
        },
        admin_id: {
            type: DataTypes.BIGINT,
            field: 'admin_id',
            allowNull: true,
            references: {
                model: 'admin',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        }
    }, {
        tableName: 'user_token'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const UserToken = model.UserToken;
    const User = model.User;
    const Appclient = model.Appclient;
    const Admin = model.Admin;

    UserToken.belongsTo(User, {
        foreignKey: 'user_id'
    });

    UserToken.belongsTo(Appclient, {
        foreignKey: 'client_id'
    });

    UserToken.belongsTo(Admin, {
        foreignKey: 'admin_id'
    });

};
