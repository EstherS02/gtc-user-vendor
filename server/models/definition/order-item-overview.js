/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderItemOverview', {
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
            allowNull: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: true
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: true
        },
        product_name: {
            type: DataTypes.STRING(255),
            field: 'product_name',
            allowNull: true
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: true
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: true
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'final_price',
            allowNull: true
        },
        order_item_status: {
            type: DataTypes.INTEGER,
            field: 'order_item_status',
            allowNull: true
        },
        marketplace_name: {
            type: DataTypes.STRING(64),
            field: 'marketplace_name',
            allowNull: true
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: true
        },
        marketplace_type_name: {
            type: DataTypes.STRING(64),
            field: 'marketplace_type_name',
            allowNull: true
        },
        category_id: {
            type: DataTypes.BIGINT,
            field: 'category_id',
            allowNull: true
        },
        category_name: {
            type: DataTypes.STRING(128),
            field: 'category_name',
            allowNull: true
        },
        sub_category_id: {
            type: DataTypes.BIGINT,
            field: 'sub_category_id',
            allowNull: true
        },
        sub_category_name: {
            type: DataTypes.STRING(128),
            field: 'sub_category_name',
            allowNull: true
        },
        item_created_on: {
            type: DataTypes.DATE,
            field: 'item_created_on',
            allowNull: true
        }
    }, {
        tableName: 'order_item_overview',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
