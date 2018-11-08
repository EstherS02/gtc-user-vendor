/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PaymentSetting', {
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
        paypal_email: {
            type: DataTypes.STRING(128),
            field: 'paypal_email',
            allowNull: true
        },
        stripe_card_id: {
            type: DataTypes.STRING(255),
            field: 'stripe_card_id',
            allowNull: true
        },
        stripe_customer_id: {
            type: DataTypes.STRING(255),
            field: 'stripe_customer_id',
            allowNull: true
        },
        card_type: {
            type: DataTypes.STRING(45),
            field: 'card_type',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        is_primary: {
            type: DataTypes.INTEGER,
            field: 'is_primary',
            allowNull: true,
            defaultValue: "0"
        },
        card_details: {
            type: DataTypes.TEXT,
            field: 'card_details',
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
        tableName: 'payment_setting',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const PaymentSetting = model.PaymentSetting;
    const User = model.User;

    PaymentSetting.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
