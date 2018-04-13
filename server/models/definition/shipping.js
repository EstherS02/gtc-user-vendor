/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Shipping', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        provider_name: {
            type: DataTypes.STRING(128),
            field: 'provider_name',
            allowNull: false
        },
        tracking_url: {
            type: DataTypes.TEXT,
            field: 'tracking_url',
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
        tableName: 'shipping'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Shipping = model.Shipping;
    const Order = model.Order;
    const User = model.User;
    const Address = model.Address;

    Shipping.hasMany(Order, {
        foreignKey: 'shipping_id'
    });

    Shipping.belongsToMany(User, {
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'user_id'
    });

    Shipping.belongsToMany(Address, {
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'shipping_address_id'
    });

    Shipping.belongsToMany(Address, {
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'billing_address_id'
    });

};
