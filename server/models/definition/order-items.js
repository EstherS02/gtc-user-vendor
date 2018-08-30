/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderItem', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.BIGINT,
            field: 'order_id',
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: false,
            references: {
                model: 'product',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        quantity: {
            type: DataTypes.INTEGER,
            field: 'quantity',
            allowNull: false
        },
        tax_id: {
            type: DataTypes.BIGINT,
            field: 'tax_id',
            allowNull: true,
            references: {
                model: 'tax',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        tax_amount: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'tax_amount',
            allowNull: true
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'subtotal',
            allowNull: false
        },
        shipping_total: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'shipping_total',
            allowNull: false
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'final_price',
            allowNull: false
        },
        reason_for_cancellation: {
            type: DataTypes.STRING(64),
            field: 'reason_for_cancellation',
            allowNull: true
        },
        order_item_status: {
            type: DataTypes.INTEGER,
            field: 'order_item_status',
            allowNull: true
        },
        cancelled_on: {
            type: DataTypes.DATE,
            field: 'cancelled_on',
            allowNull: true
        },
        reason_for_return: {
            type: DataTypes.STRING(64),
            field: 'reason_for_return',
            allowNull: true
        },
        return_requested_on: {
            type: DataTypes.DATE,
            field: 'return_requested_on',
            allowNull: true
        },
        return_approved_on: {
            type: DataTypes.DATE,
            field: 'return_approved_on',
            allowNull: true
        },
        return_received_on: {
            type: DataTypes.DATE,
            field: 'return_received_on',
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
        tableName: 'order_items',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const OrderItem = model.OrderItem;
    const Order = model.Order;
    const Product = model.Product;
    const Coupon = model.Coupon;
    const Tax = model.Tax;

    OrderItem.belongsTo(Order, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    }); 

    OrderItem.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderItem.belongsTo(Tax, {
        foreignKey: 'tax_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
};