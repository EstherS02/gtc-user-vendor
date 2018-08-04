/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderItemsOverview', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.BIGINT,
            field: 'order_id',
            allowNull: false
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: false
        },
        product_name: {
            type: DataTypes.STRING(128),
            field: 'product_name',
            allowNull: false
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: false
        },
        order_status: {
            type: DataTypes.INTEGER,
            field: 'order_status',
            allowNull: false
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: false
        },
        marketplace_name: {
            type: DataTypes.STRING(128),
            field: 'marketplace_name',
            allowNull: false
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: false
        },
        marketplace_type_name: {
            type: DataTypes.STRING(128),
            field: 'marketplace_type_name',
            allowNull: false
        },
        category_id: {
            type: DataTypes.BIGINT,
            field: 'category_id',
            allowNull: false
        },
        category_name: {
            type: DataTypes.STRING(128),
            field: 'category_name',
            allowNull: false
        },
        sub_category_id: {
            type: DataTypes.BIGINT,
            field: 'sub_category_id',
            allowNull: false
        },
        sub_category_name: {
            type: DataTypes.STRING(128),
            field: 'sub_category_name',
            allowNull: false
        },        
        item_created_on: {
            type: DataTypes.DATEONLY,
            field: 'item_created_on',
            allowNull: false
        }
    }, {
        tableName: 'order_items_overview',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
