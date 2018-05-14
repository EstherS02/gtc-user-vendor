/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductSales', {
        sales_count: {
            type: DataTypes.BIGINT,
            field: 'sales_count',
            allowNull: true
        },
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        product_name: {
            type: DataTypes.STRING(128),
            field: 'product_name',
            allowNull: true
        },
        vendor_name: {
            type: DataTypes.STRING(64),
            field: 'vendor_name',
            allowNull: false
        },
        owner_name: {
            type: DataTypes.STRING(64),
            field: 'owner_name',
            allowNull: false
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: false
        },
        marketplace: {
            type: DataTypes.STRING(64),
            field: 'marketplace',
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10,1),
            field: 'price',
            allowNull: false
        },
        url: {
            type: DataTypes.TEXT,
            field: 'url',
            allowNull: false
        },
        origin: {
            type: DataTypes.STRING(128),
            field: 'origin',
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(128),
            field: 'category',
            allowNull: false
        },
        sub_category: {
            type: DataTypes.STRING(128),
            field: 'sub_category',
            allowNull: false
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: true
        },
        sku: {
            type: DataTypes.INTEGER,
            field: 'sku',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
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
        tableName: 'product_sales',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
