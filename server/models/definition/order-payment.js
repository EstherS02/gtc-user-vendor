/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderPayment', {
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
        payment_id: {
            type: DataTypes.BIGINT,
            field: 'payment_id',
            allowNull: false,
            references: {
                model: 'payment_setting',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        paid_date: {
            type: DataTypes.DATE,
            field: 'paid_date',
            allowNull: true
        },
        amount_paid: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'amount_paid',
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
        tableName: 'order_payment',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const OrderPayment = model.OrderPayment;
    const OrderPaymentEscrow = model.OrderPaymentEscrow;
    const Order = model.Order;
    const PaymentSetting = model.PaymentSetting;

    OrderPayment.hasMany(OrderPaymentEscrow, {
        foreignKey: 'order_payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderPayment.belongsTo(Order, {
        foreignKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderPayment.belongsTo(PaymentSetting, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
