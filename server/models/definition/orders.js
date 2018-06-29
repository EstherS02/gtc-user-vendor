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
       /* vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: true,
            references: {
                model: 'vendor',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },*/
        invoice_id: {
            type: DataTypes.STRING(64),
            field: 'invoice_id',
            allowNull: false
        },
        purchase_order_id: {
            type: DataTypes.INTEGER,
            field: 'purchase_order_id',
            allowNull: true
        },
        po_number: {
            type: DataTypes.INTEGER,
            field: 'po_number',
            allowNull: true
        },
        ordered_date: {
            type: DataTypes.DATEONLY,
            field: 'ordered_date',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        expected_delivery_date: {
            type: DataTypes.DATEONLY,
            field: 'expected_delivery_date',
            allowNull: true
        },
        shipped_on: {
            type: DataTypes.DATE,
            field: 'shipped_on',
            allowNull: true
        },
        cancelled_on: {
            type: DataTypes.DATE,
            field: 'cancelled_on',
            allowNull: true
        },
        delivered_on: {
            type: DataTypes.DATE,
            field: 'delivered_on',
            allowNull: true
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
        total_price: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'total_price',
            allowNull: true
        },
        coupon_id: {
            type: DataTypes.BIGINT,
            field: 'coupon_id',
            allowNull: false,
            references: {
                model: 'coupon',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        coupon_amount: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'coupon_amount',
            allowNull: false
        },
        coupon_applied_on: {
            type: DataTypes.DATE,
            field: 'coupon_applied_on',
            allowNull: false
        },
        tracking_id: {
            type: DataTypes.INTEGER,
            field: 'tracking_id',
            allowNull: false
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
        tableName: 'orders',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Order = model.Order;
    const OrderItem = model.OrderItem;
    const OrderPayment = model.OrderPayment;
    const User = model.User;
    const Vendor = model.Vendor;
    const Shipping = model.Shipping;
    const Address = model.Address;
    const Product = model.Product;
    const Coupon = model.Coupon;
    const Tax = model.Tax;
    const PaymentSetting = model.PaymentSetting;

    Order.hasMany(OrderItem, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.hasMany(OrderPayment, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
   /* Order.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });*/

    Order.belongsTo(Shipping, {
        foreignKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Address, {
        foreignKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Address, {
        foreignKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsTo(Coupon, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Order.belongsToMany(PaymentSetting, {
        through: OrderPayment,
        foreignKey: 'order_id',
        otherKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
