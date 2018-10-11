/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Payment', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.DATE,
            field: 'date',
            allowNull: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'amount',
            allowNull: true
        },
        payment_method: {
            type: DataTypes.INTEGER,
            field: 'payment_method',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        payment_response: {
            type: DataTypes.TEXT,
            field: 'payment_response',
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
        tableName: 'payment',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Payment = model.Payment;
    const FeaturedProduct = model.FeaturedProduct;
    const OrderPayment = model.OrderPayment;
    const OrderPaymentEscrow = model.OrderPaymentEscrow;
    const VendorPlan = model.VendorPlan;
    const UserPlan = model.UserPlan;
    const ProductAdsSetting = model.ProductAdsSetting;
    const Order = model.Order;

    Payment.hasMany(OrderPayment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(OrderPaymentEscrow, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Order, {
        through: OrderPayment,
        foreignKey: 'payment_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasOne(VendorPlan, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasOne(UserPlan, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Order, {
        through: OrderPaymentEscrow,
        foreignKey: 'payment_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasOne(FeaturedProduct, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasOne(ProductAdsSetting, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
};