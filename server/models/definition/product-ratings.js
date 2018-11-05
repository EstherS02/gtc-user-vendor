/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductRating', {
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: true
        },
        product_rating: {
            type: DataTypes.DECIMAL(14, 4),
            field: 'product_rating',
            allowNull: true
        },
        sku: {
            type: DataTypes.STRING(32),
            field: 'sku',
            allowNull: true
        },
        product_name: {
            type: DataTypes.STRING(255),
            field: 'product_name',
            allowNull: true
        },
        product_slug: {
            type: DataTypes.STRING(255),
            field: 'product_slug',
            allowNull: true
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: true
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: true
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: true
        },
        product_category_id: {
            type: DataTypes.BIGINT,
            field: 'product_category_id',
            allowNull: true
        },
        quantity_available: {
            type: DataTypes.INTEGER,
            field: 'quantity_available',
            allowNull: true
        },
        sub_category_id: {
            type: DataTypes.BIGINT,
            field: 'sub_category_id',
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'price',
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: true
        },
        product_location: {
            type: DataTypes.BIGINT,
            field: 'product_location',
            allowNull: true
        },
        state_id: {
            type: DataTypes.BIGINT,
            field: 'state_id',
            allowNull: true
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: true
        },
        moq: {
            type: DataTypes.INTEGER,
            field: 'moq',
            allowNull: true
        },
        individual_sale_only: {
            type: DataTypes.INTEGER,
            field: 'individual_sale_only',
            allowNull: true
        },
        exclusive_sale: {
            type: DataTypes.INTEGER,
            field: 'exclusive_sale',
            allowNull: true
        },
        exchanging_product_quantity: {
            type: DataTypes.INTEGER,
            field: 'exchanging_product_quantity',
            allowNull: true
        },
        exchanging_product: {
            type: DataTypes.STRING(255),
            field: 'exchanging_product',
            allowNull: true
        },
        shipping_cost: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'shipping_cost',
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
        tableName: 'product_ratings',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
