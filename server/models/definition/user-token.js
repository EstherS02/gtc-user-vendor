/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserToken', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
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
        }
    }, {
        // schema: 'public',
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
        as: 'User',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    UserToken.belongsTo(Appclient, {
        as: 'Client',
        foreignKey: 'client_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
