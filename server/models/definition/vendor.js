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
        tableName: 'vendor'
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
    const Plan = model.Plan;
    const Currency = model.Currency;
    const Timezone = model.Timezone;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedia = model.ProductMedia;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const State = model.State;

    Vendor.hasMany(BusinessHour, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(DiscussionBoard, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(Product, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(TalkSetting, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(VendorFollower, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(VendorNotificationSetting, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(VendorPlan, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(VendorShippingLocation, {
        foreignKey: 'vendor_id'
    });

    Vendor.hasMany(VendorVerification, {
        foreignKey: 'vendor_id'
    });

    Vendor.belongsTo(User, {
        foreignKey: 'user_id'
    });

    Vendor.belongsTo(Country, {
        foreignKey: 'base_location'
    });

    Vendor.belongsTo(Currency, {
        foreignKey: 'currency_id'
    });

    Vendor.belongsTo(Timezone, {
        foreignKey: 'timezone_id'
    });

    Vendor.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_id'
    });

    Vendor.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_type_id'
    });

    Vendor.belongsToMany(ProductMedia, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_media_id'
    });

    Vendor.belongsToMany(Category, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_category_id'
    });

    Vendor.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'sub_category_id'
    });

    Vendor.belongsToMany(Country, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_location'
    });

    Vendor.belongsToMany(State, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'state_id'
    });

    Vendor.belongsToMany(User, {
        through: VendorFollower,
        foreignKey: 'vendor_id',
        otherKey: 'user_id'
    });

    Vendor.belongsToMany(Plan, {
        through: VendorPlan,
        foreignKey: 'vendor_id',
        otherKey: 'plan_id'
    });

    Vendor.belongsToMany(Country, {
        through: VendorShippingLocation,
        foreignKey: 'vendor_id',
        otherKey: 'country_id'
    });

};