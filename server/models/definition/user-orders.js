/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserOrder', {
        order_count: {
            type: DataTypes.BIGINT,
            field: 'order_count',
            allowNull: true
        },
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        role: {
            type: DataTypes.INTEGER,
            field: 'role',
            allowNull: true
        },
        email: {
            type: DataTypes.STRING(128),
            field: 'email',
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING(64),
            field: 'first_name',
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING(64),
            field: 'last_name',
            allowNull: true
        },
        provider: {
            type: DataTypes.INTEGER,
            field: 'provider',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        email_verified: {
            type: DataTypes.INTEGER,
            field: 'email_verified',
            allowNull: true
        },
        last_login_at: {
            type: DataTypes.DATE,
            field: 'last_login_at',
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
        tableName: 'user_orders',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
