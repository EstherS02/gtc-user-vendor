/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrdersItemsNew', {
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
                model: 'orders_new',
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
        price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'price',
            allowNull: false
        },
        shipping_cost: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'shipping_cost',
            allowNull: false
        },
        gtc_fees: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'gtc_fees',
            allowNull: false
        },
        plan_fees: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'plan_fees',
            allowNull: true
        },
        is_coupon_applied: {
            type: DataTypes.INTEGER,
            field: 'is_coupon_applied',
            allowNull: false
        },
        coupon_id: {
            type: DataTypes.BIGINT,
            field: 'coupon_id',
            allowNull: true,
            references: {
                model: 'coupon',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        coupon_amount: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'coupon_amount',
            allowNull: true
        },
        is_on_sale_item: {
            type: DataTypes.INTEGER,
            field: 'is_on_sale_item',
            allowNull: false
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'discount_amount',
            allowNull: true
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'final_price',
            allowNull: false
        },
        order_item_status: {
            type: DataTypes.INTEGER,
            field: 'order_item_status',
            allowNull: false
        },
        item_confirmed_on: {
            type: DataTypes.DATE,
            field: 'item_confirmed_on',
            allowNull: true
        },
        shipped_on: {
            type: DataTypes.DATE,
            field: 'shipped_on',
            allowNull: true
        },
        expected_delivery_date: {
            type: DataTypes.DATE,
            field: 'expected_delivery_date',
            allowNull: true
        },
        cancelled_on: {
            type: DataTypes.DATE,
            field: 'cancelled_on',
            allowNull: true
        },
        reason_for_cancel: {
            type: DataTypes.STRING(255),
            field: 'reason_for_cancel',
            allowNull: true
        },
        delivered_on: {
            type: DataTypes.DATE,
            field: 'delivered_on',
            allowNull: true
        },
        request_for_return_on: {
            type: DataTypes.DATE,
            field: 'request_for_return_on',
            allowNull: true
        },
        approved_request_for_return_on: {
            type: DataTypes.DATE,
            field: 'approved_request_for_return_on',
            allowNull: true
        },
        return_received_on: {
            type: DataTypes.DATE,
            field: 'return_received_on',
            allowNull: true
        },
        reason_for_return: {
            type: DataTypes.STRING(255),
            field: 'reason_for_return',
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
        tableName: 'orders_items_new',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const OrdersItemsNew = model.OrdersItemsNew;
    const OrderItemPayout = model.OrderItemPayout;
    const OrdersNew = model.OrdersNew;
    const Product = model.Product;
    const Coupon = model.Coupon;

    OrdersItemsNew.belongsTo(OrdersNew, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrdersItemsNew.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrdersItemsNew.hasMany(OrderItemPayout, {
        foreignKey: 'order_item_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrdersItemsNew.belongsTo(Coupon, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
