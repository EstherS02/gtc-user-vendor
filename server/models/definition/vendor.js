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
            allowNull: false,
            references: {
                model: 'country',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        about: {
            type: DataTypes.TEXT,
            field: 'about',
            allowNull: true
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            field: 'latitude',
            allowNull: true
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 8),
            field: 'longitude',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
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
        rating: {
            type: DataTypes.INTEGER,
            field: 'rating',
            allowNull: true
        },
        currency_id: {
            type: DataTypes.BIGINT,
            field: 'currency_id',
            allowNull: false,
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
        address: {
            type: DataTypes.STRING(255),
            field: 'address',
            allowNull: false
        },
        province_id: {
            type: DataTypes.BIGINT,
            field: 'province_id',
            allowNull: false,
            references: {
                model: 'state',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: false
        },
        vendor_payout_stripe_id: {
            type: DataTypes.STRING(255),
            field: 'vendor_payout_stripe_id',
            allowNull: true
        },
        vendor_payout_paypal_email: {
            type: DataTypes.STRING(128),
            field: 'vendor_payout_paypal_email',
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
        tableName: 'vendor',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Vendor = model.Vendor;
    const BusinessHour = model.BusinessHour;
	const Coupon = model.Coupon;
	const DiscussionBoard = model.DiscussionBoard;
    const DiscussionBoardPost = model.DiscussionBoardPost;
    const Product = model.Product;
    const ProductAdsSetting = model.ProductAdsSetting;
    const TalkSetting = model.TalkSetting;
    const TermsAndCond = model.TermsAndCond;
    const VendorFollower = model.VendorFollower;
    const VendorNotificationSetting = model.VendorNotificationSetting;
    const OrderVendor = model.OrderVendor;
    const VendorPlan = model.VendorPlan;
    const VendorRating = model.VendorRating;
    const VendorShippingLocation = model.VendorShippingLocation;
    const VendorVerification = model.VendorVerification;
    const User = model.User;
    const Country = model.Country;
    const State = model.State;
    const Currency = model.Currency;
    const Timezone = model.Timezone;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Payment = model.Payment;
    const VendorNotification = model.VendorNotification;
    const Order = model.Order;
	const Plan = model.Plan;
	

	Vendor.hasMany(DiscussionBoard, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(BusinessHour, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(Coupon, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(DiscussionBoardPost, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(Product, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(ProductAdsSetting, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(TalkSetting, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(TermsAndCond, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorFollower, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorNotificationSetting, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(OrderVendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorPlan, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorRating, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorShippingLocation, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.hasMany(VendorVerification, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Country, {
        foreignKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(State, {
        foreignKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Currency, {
        foreignKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsTo(Timezone, {
        foreignKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Timezone, {
        through: BusinessHour,
        foreignKey: 'vendor_id',
        otherKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(User, {
        through: DiscussionBoardPost,
        foreignKey: 'vendor_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Category, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Country, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(State, {
        through: Product,
        foreignKey: 'vendor_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    /*Vendor.belongsToMany(Product, {
        through: ProductAdsSetting,
        foreignKey: 'vendor_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });*/

    Vendor.belongsToMany(Country, {
        through: ProductAdsSetting,
        foreignKey: 'vendor_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(State, {
        through: ProductAdsSetting,
        foreignKey: 'vendor_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Payment, {
        through: ProductAdsSetting,
        foreignKey: 'vendor_id',
        otherKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(User, {
        through: VendorFollower,
        foreignKey: 'vendor_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(VendorNotification, {
        through: VendorNotificationSetting,
        foreignKey: 'vendor_id',
        otherKey: 'vendor_notification_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Order, {
        through: OrderVendor,
        foreignKey: 'vendor_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Plan, {
        through: VendorPlan,
        foreignKey: 'vendor_id',
        otherKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Payment, {
        through: VendorPlan,
        foreignKey: 'vendor_id',
        otherKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(User, {
        through: VendorRating,
        foreignKey: 'vendor_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Vendor.belongsToMany(Country, {
        through: VendorShippingLocation,
        foreignKey: 'vendor_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
