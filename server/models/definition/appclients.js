/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Appclient', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
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
        }
    }, {
        // schema: 'public',
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
        as: 'FkUserToken2s',
        foreignKey: 'client_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Appclient.belongsToMany(User, {
        as: 'UserTokenUsers',
        through: UserToken,
        foreignKey: 'client_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
