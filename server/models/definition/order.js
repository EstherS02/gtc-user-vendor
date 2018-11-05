/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Order', {
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
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        invoice_id: {
            type: DataTypes.STRING(64),
            field: 'invoice_id',
            allowNull: false
        },
        purchase_order_id: {
            type: DataTypes.STRING(64),
            field: 'purchase_order_id',
            allowNull: false
        },
        po_number: {
            type: DataTypes.INTEGER,
            field: 'po_number',
            allowNull: true
        },
        total_order_items: {
            type: DataTypes.INTEGER,
            field: 'total_order_items',
            allowNull: false
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'total_price',
            allowNull: false
        },
        ordered_date: {
            type: DataTypes.DATE,
            field: 'ordered_date',
            allowNull: false
        },
        payment_id: {
            type: DataTypes.BIGINT,
            field: 'payment_id',
            allowNull: false,
            references: {
                model: 'payment',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        shipping_id: {
            type: DataTypes.BIGINT,
            field: 'shipping_id',
            allowNull: true,
            references: {
                model: 'shipping',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        shipping_address_id: {
            type: DataTypes.BIGINT,
            field: 'shipping_address_id',
            allowNull: false,
            references: {
                model: 'address',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        billing_address_id: {
            type: DataTypes.BIGINT,
            field: 'billing_address_id',
            allowNull: false,
            references: {
                model: 'address',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        created_by: {
            type: DataTypes.STRING(64),
            field: 'created_by',
            allowNull: false
        },
        created_on: {
            type: DataTypes.DATE,
            field: 'created_on',
            allowNull: false
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
        tableName: 'order',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Order = model.Order;
    const OrderItem = model.OrderItem;
    const OrderVendor = model.OrderVendor;
    const User = model.User;
    const Payment = model.Payment;
    const Shipping = model.Shipping;
    const Address = model.Address;
    const Coupon = model.Coupon;

    Order.hasMany(OrderItem, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.hasMany(OrderVendor, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Payment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Shipping, {
        foreignKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Address, {
        as: "shippingAddress1",
        foreignKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Address, {
        as: "billingAddress1",
        foreignKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsToMany(Coupon, {
        through: OrderItem,
        foreignKey: 'order_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsToMany(Shipping, {
        through: OrderVendor,
        foreignKey: 'order_id',
        otherKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
