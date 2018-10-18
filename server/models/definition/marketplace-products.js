/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('MarketplaceProduct', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        product_price: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'product_price',
            allowNull: true
        },
        product_description: {
            type: DataTypes.TEXT,
            field: 'product_description',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: true
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: true
        },
        marketplace: {
            type: DataTypes.STRING(64),
            field: 'marketplace',
            allowNull: true
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: true
        },
        stock_keep_unit: {
            type: DataTypes.STRING(32),
            field: 'stock_keep_unit',
            allowNull: true
        },
        minimum_order_quantity: {
            type: DataTypes.INTEGER,
            field: 'minimum_order_quantity',
            allowNull: true
        },
        product_quantity: {
            type: DataTypes.INTEGER,
            field: 'product_quantity',
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
        is_featured_product: {
            type: DataTypes.INTEGER,
            field: 'is_featured_product',
            allowNull: true
        },
        product_base_image: {
            type: DataTypes.TEXT,
            field: 'product_base_image',
            allowNull: true
        },
        featured_position_homepage: {
            type: DataTypes.INTEGER,
            field: 'featured_position_homepage',
            allowNull: true
        },
        featured_position_searchresult: {
            type: DataTypes.INTEGER,
            field: 'featured_position_searchresult',
            allowNull: true
        },
        featured_position_profilepage: {
            type: DataTypes.INTEGER,
            field: 'featured_position_profilepage',
            allowNull: true
        },
        featured_position_wholesale_landing: {
            type: DataTypes.INTEGER,
            field: 'featured_position_wholesale_landing',
            allowNull: true
        },
        featured_position_shop_landing: {
            type: DataTypes.INTEGER,
            field: 'featured_position_shop_landing',
            allowNull: true
        },
        featured_position_service_landing: {
            type: DataTypes.INTEGER,
            field: 'featured_position_service_landing',
            allowNull: true
        },
        featured_position_subscription_landing: {
            type: DataTypes.INTEGER,
            field: 'featured_position_subscription_landing',
            allowNull: true
        },
        feature_start_date: {
            type: DataTypes.DATEONLY,
            field: 'feature_start_date',
            allowNull: true
        },
        feature_end_date: {
            type: DataTypes.DATEONLY,
            field: 'feature_end_date',
            allowNull: true
        },
        feature_impression: {
            type: DataTypes.INTEGER,
            field: 'feature_impression',
            allowNull: true
        },
        feature_clicks: {
            type: DataTypes.INTEGER,
            field: 'feature_clicks',
            allowNull: true
        },
        product_location_id: {
            type: DataTypes.BIGINT,
            field: 'product_location_id',
            allowNull: true
        },
        product_selling_count: {
            type: DataTypes.DECIMAL(32),
            field: 'product_selling_count',
            allowNull: true
        },
        product_rating: {
            type: DataTypes.DECIMAL(36, 4),
            field: 'product_rating',
            allowNull: true
        },
        country_name: {
            type: DataTypes.STRING(128),
            field: 'country_name',
            allowNull: true
        },
        state_name: {
            type: DataTypes.STRING(128),
            field: 'state_name',
            allowNull: true
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: true
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: true
        },
        vendor_name: {
            type: DataTypes.STRING(64),
            field: 'vendor_name',
            allowNull: true
        },
        vendor_profile_pic_url: {
            type: DataTypes.TEXT,
            field: 'vendor_profile_pic_url',
            allowNull: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING(64),
            field: 'first_name',
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
        tableName: 'marketplace_products',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
