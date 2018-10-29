/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderVendorPaymentEscrow', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        order_vendor_id: {
            type: DataTypes.BIGINT,
            field: 'order_vendor_id',
            allowNull: false,
            references: {
                model: 'order_vendor',
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
                model: 'payment',
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
        tableName: 'order_vendor_payment_escrow',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const OrderVendorPaymentEscrow = model.OrderVendorPaymentEscrow;
    const OrderVendor = model.OrderVendor;
    const Payment = model.Payment;

    OrderVendorPaymentEscrow.belongsTo(OrderVendor, {
        foreignKey: 'order_vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    OrderVendorPaymentEscrow.belongsTo(Payment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};