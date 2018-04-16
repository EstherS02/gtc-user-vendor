/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Admin', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(128),
            field: 'email',
            allowNull: false
        },
        hashed_pwd: {
            type: DataTypes.TEXT,
            field: 'hashed_pwd',
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING(128),
            field: 'salt',
            allowNull: true
        },
        created_by: {
            type: DataTypes.STRING(64),
            field: 'created_by',
            allowNull: true
        },
        created_on: {
            type: DataTypes.DATE,
            field: 'created_on',
            allowNull: true
        },
        last_updated_by: {
            type: DataTypes.STRING(64),
            field: 'last_updated_by',
            allowNull: true
        },
        last_updated_on: {
            type: DataTypes.DATE,
            field: 'last_updated_on',
            allowNull: true
        },
        deleted_at: {
            type: DataTypes.DATE,
            field: 'deleted_at',
            allowNull: true
        }
    }, {
        tableName: 'admin'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Admin = model.Admin;
    const UserToken = model.UserToken;
    const User = model.User;
    const Appclient = model.Appclient;

    Admin.hasMany(UserToken, {
        foreignKey: 'admin_id'
    });

    Admin.belongsToMany(User, {
        through: UserToken,
        foreignKey: 'admin_id',
        otherKey: 'user_id'
    });

    Admin.belongsToMany(Appclient, {
        through: UserToken,
        foreignKey: 'admin_id',
        otherKey: 'client_id'
    });

};