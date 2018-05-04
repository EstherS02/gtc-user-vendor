/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Shipping', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
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
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
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
        // schema: 'public',
        tableName: 'shipping',
        timestamps: false
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
        as: 'FkOrder2s',
        foreignKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Shipping.belongsToMany(User, {
        as: 'OrderUsers',
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Shipping.belongsToMany(Address, {
        as: 'OrderShippingAddresses',
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Shipping.belongsToMany(Address, {
        as: 'OrderBillingAddresses',
        through: Order,
        foreignKey: 'shipping_id',
        otherKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
