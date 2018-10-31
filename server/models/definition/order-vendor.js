/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderVendor', {
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
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: false,
            references: {
                model: 'vendor',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'total_price',
            allowNull: false
        },
        shipping_cost: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'shipping_cost',
            allowNull: true
        },
        gtc_fees: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'gtc_fees',
            allowNull: false
        },
        gtc_fees_percent: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'gtc_fees_percent',
            allowNull: false
        },
        plan_fees: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'plan_fees',
            allowNull: true
        },
        plan_fees_percent: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'plan_fees_percent',
            allowNull: true
        },
        coupon_amount: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'coupon_amount',
            allowNull: true
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'final_price',
            allowNull: false
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
        tableName: 'order_vendor',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const OrderVendor = model.OrderVendor;
    const OrderVendorPayout = model.OrderVendorPayout;
    const OrdersNew = model.OrdersNew;
    const Vendor = model.Vendor;

    OrderVendor.hasMany(OrderVendorPayout, {
        foreignKey: 'order_vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderVendor.belongsTo(OrdersNew, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderVendor.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
