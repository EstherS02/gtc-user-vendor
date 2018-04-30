/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Vendor', {
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
        vendor_name: {
            type: DataTypes.STRING(64),
            field: 'vendor_name',
            allowNull: false
        },
        contact_email: {
            type: DataTypes.STRING(128),
            field: 'contact_email',
            allowNull: true
        },
        base_location: {
            type: DataTypes.BIGINT,
            field: 'base_location',
            allowNull: true,
            references: {
                model: 'country',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        vendor_cover_pic_url: {
            type: DataTypes.TEXT,
            field: 'vendor_cover_pic_url',
            allowNull: true
        },
        vendor_profile_pic_url: {
            type: DataTypes.TEXT,
            field: 'vendor_profile_pic_url',
            allowNull: true
        },
        facebook_url: {
            type: DataTypes.TEXT,
            field: 'facebook_url',
            allowNull: true
        },
        google_plus_url: {
            type: DataTypes.TEXT,
            field: 'google_plus_url',
            allowNull: true
        },
        twitter_url: {
            type: DataTypes.TEXT,
            field: 'twitter_url',
            allowNull: true
        },
        linkedin_url: {
            type: DataTypes.TEXT,
            field: 'linkedin_url',
            allowNull: true
        },
        youtube_url: {
            type: DataTypes.TEXT,
            field: 'youtube_url',
            allowNull: true
        },
        instagram_url: {
            type: DataTypes.TEXT,
            field: 'instagram_url',
            allowNull: true
        },
        flickr_url: {
            type: DataTypes.TEXT,
            field: 'flickr_url',
            allowNull: true
        },
        currency_id: {
            type: DataTypes.BIGINT,
            field: 'currency_id',
            allowNull: true,
            references: {
                model: 'currency',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        timezone_id: {
            type: DataTypes.BIGINT,
            field: 'timezone_id',
            allowNull: true,
            references: {
                model: 'timezone',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
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
        // schema: 'public',
        tableName: 'vendor',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Vendor = model.Vendor;
    const BusinessHour = model.BusinessHour;
    const DiscussionBoard = model.DiscussionBoard;
    const Product = model.Product;
    const TalkSetting = model.TalkSetting;
    const VendorFollower = model.VendorFollower;
    const VendorNotificationSetting = model.VendorNotificationSetting;
    const VendorPlan = model.VendorPlan;
    const VendorShippingLocation = model.VendorShippingLocation;
    const VendorVerification = model.VendorVerification;
    const User = model.User;
    const Country = model.Country;
    const Currency = model.Currency;
    const Timezone = model.Timezone;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedium = model.ProductMedium;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const State = model.State;
    const Plan = model.Plan;

    Vendor.hasMany(BusinessHour, {
        as: 'FkBusinessHours1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(DiscussionBoard, {
        as: 'FkDiscussionBoard1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(Product, {
        as: 'FkProduct1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(TalkSetting, {
        as: 'FkTalkSetting1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorFollower, {
        as: 'FkVendorFollower1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorNotificationSetting, {
        as: 'FkVendorNotificationSetting1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorPlan, {
        as: 'FkVendorPlan1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorShippingLocation, {
        as: 'FkVendorShippingLocation1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorVerification, {
        as: 'FkVendorVerification1s',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(User, {
        as: 'User',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Country, {
        as: 'RelatedBaseLocation',
        foreignKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Currency, {
        as: 'Currency',
        foreignKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Timezone, {
        as: 'Timezone',
        foreignKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Marketplace, {
        as: 'ProductMarketplaces',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(MarketplaceType, {
        as: 'ProductMarketplaceTypes',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(ProductMedium, {
        as: 'ProductProductMedia',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_media_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Category, {
        as: 'ProductProductCategories',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(SubCategory, {
        as: 'ProductSubCategories',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Country, {
        as: 'ProductProductLocations',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(State, {
        as: 'ProductStates',
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(User, {
        as: 'VendorFollowerUsers',
        through: VendorFollower,
        foreignKey: 'vendor_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Plan, {
        as: 'VendorPlanPlans',
        through: VendorPlan,
        foreignKey: 'vendor_id',
        otherKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Country, {
        as: 'VendorShippingLocationCountries',
        through: VendorShippingLocation,
        foreignKey: 'vendor_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
