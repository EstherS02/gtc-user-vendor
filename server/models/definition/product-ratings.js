/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductRatings', {
        product_id : {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        product_rating: {
            type: DataTypes.INTEGER,
            field: 'product_rating',
            allowNull: true
        },
        sku: {
            type: DataTypes.STRING(32),
            field: 'sku',
            allowNull: false
        },
        product_name: {
            type: DataTypes.STRING(255),
            field: 'product_name',
            allowNull: false
        },
        product_slug: {
            type: DataTypes.STRING(255),
            field: 'product_slug',
            allowNull: true
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: false
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: true
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: false
        },
        product_category_id: {
            type: DataTypes.BIGINT,
            field: 'product_category_id',
            allowNull: false
        },
        quantity_available: {
            type: DataTypes.INTEGER,
            field: 'quantity_available',
            allowNull: false
        },
        sub_category_id: {
            type: DataTypes.BIGINT,
            field: 'sub_category_id',
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 1),
            field: 'price',
            allowNull: true
        },
        shipping_cost: {
            type: DataTypes.DECIMAL(10, 1),
            field: 'shipping_cost',
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
            allowNull: false
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
