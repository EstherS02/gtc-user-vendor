/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Subscription', {
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
        purchased_on: {
            type: DataTypes.DATEONLY,
            field: 'purchased_on',
            allowNull: false
        },
        last_order_placed_on: {
            type: DataTypes.DATEONLY,
            field: 'last_order_placed_on',
            allowNull: true
        },
        next_order_place_on: {
            type: DataTypes.DATEONLY,
            field: 'next_order_place_on',
            allowNull: true
        },
        end_date: {
            type: DataTypes.DATEONLY,
            field: 'end_date',
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
        tableName: 'subscription',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Subscription = model.Subscription;
    const User = model.User;
    const Product = model.Product;

    Subscription.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Subscription.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
