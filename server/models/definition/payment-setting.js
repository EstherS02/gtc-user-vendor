/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PaymentSetting', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
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
        paypal_email: {
            type: DataTypes.STRING(128),
            field: 'paypal_email',
            allowNull: true
        },
        stripe_card_id: {
            type: DataTypes.INTEGER,
            field: 'stripe_card_id',
            allowNull: true
        },
        stripe_customer_id: {
            type: DataTypes.INTEGER,
            field: 'stripe_customer_id',
            allowNull: true
        },
        card_type: {
            type: DataTypes.STRING(45),
            field: 'card_type',
            allowNull: true
        },
        isactive: {
            type: DataTypes.INTEGER,
            field: 'isactive',
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
        // schema: 'public',
        tableName: 'payment_setting',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const PaymentSetting = model.PaymentSetting;
    const OrderPayment = model.OrderPayment;
    const User = model.User;
    const Order = model.Order;

    PaymentSetting.hasMany(OrderPayment, {
        as: 'FkOrderPayment2s',
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    PaymentSetting.belongsTo(User, {
        as: 'User',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    PaymentSetting.belongsToMany(Order, {
        as: 'OrderPaymentOrders',
        through: OrderPayment,
        foreignKey: 'payment_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
