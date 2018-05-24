/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('FeaturedproductSalesRating', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: false
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
        marketplace: {
            type: DataTypes.STRING(64),
            field: 'marketplace',
            allowNull: false
        },
        marketplace_type: {
            type: DataTypes.STRING(64),
            field: 'marketplace_type',
            allowNull: false
        },
        moq: {
            type: DataTypes.INTEGER,
            field: 'moq',
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
        quantity_available: {
            type: DataTypes.INTEGER,
            field: 'quantity_available',
            allowNull: false
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: true
        },
        position: {
            type: DataTypes.STRING(45),
            field: 'position',
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATEONLY,
            field: 'start_date',
            allowNull: false
        },
        impression: {
            type: DataTypes.INTEGER,
            field: 'impression',
            allowNull: true
        },
        clicks: {
            type: DataTypes.INTEGER,
            field: 'clicks',
            allowNull: true
        },  
        sales_count: {
            type: DataTypes.BIGINT,
            field: 'sales_count',
            allowNull: true
        },
        rating: {
            type: DataTypes.INTEGER,
            field: 'rating',
            allowNull: true
        },
        product_slug: {
            type: DataTypes.STRING(128),
            field: 'product_slug',
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
        tableName: 'featuredproduct_sales_rating',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
