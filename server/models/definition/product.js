/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Product', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        sku: {
            type: DataTypes.INTEGER,
            field: 'sku',
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
            allowNull: false,
            references: {
                model: 'vendor',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: false,
            references: {
                model: 'marketplace',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        marketplace_type_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_type_id',
            allowNull: true,
            references: {
                model: 'marketplace_type',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: false
        },
        product_media_id: {
            type: DataTypes.BIGINT,
            field: 'product_media_id',
            allowNull: false,
            references: {
                model: 'product_media',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        product_category_id: {
            type: DataTypes.BIGINT,
            field: 'product_category_id',
            allowNull: false,
            references: {
                model: 'category',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        quantity_available: {
            type: DataTypes.INTEGER,
            field: 'quantity_available',
            allowNull: false
        },
        sub_category_id: {
            type: DataTypes.BIGINT,
            field: 'sub_category_id',
            allowNull: false,
            references: {
                model: 'sub_category',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        price: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'price',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: true
        },
        product_location: {
            type: DataTypes.BIGINT,
            field: 'product_location',
            allowNull: false,
            references: {
                model: 'country',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        state_id: {
            type: DataTypes.BIGINT,
            field: 'state_id',
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
        tableName: 'product',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Product = model.Product;
    const Cart = model.Cart;
    const Coupon = model.Coupon;
    const CouponExcludedProduct = model.CouponExcludedProduct;
    const CouponProduct = model.CouponProduct;
    const FeaturedProduct = model.FeaturedProduct;
    const OrderItem = model.OrderItem;
    const ProductAdsSetting = model.ProductAdsSetting;
    const ProductAttribute = model.ProductAttribute;
    const ProductReview = model.ProductReview;
    const Subscription = model.Subscription;
    const WishList = model.WishList;
    const Vendor = model.Vendor;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedium = model.ProductMedium;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Country = model.Country;
    const State = model.State;
    const User = model.User;
    const Order = model.Order;
    const Tax = model.Tax;
    const Attribute = model.Attribute;

    Product.hasMany(Cart, {
        as: 'FkCart2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(Coupon, {
        as: 'FkCoupon1s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(Coupon, {
        as: 'FkCoupon2s',
        foreignKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(CouponExcludedProduct, {
        as: 'FkCouponExcludedProduct2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(CouponProduct, {
        as: 'FkCouponProduct2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(FeaturedProduct, {
        as: 'FkFeaturedProduct1s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(OrderItem, {
        as: 'FkOrderItems2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(ProductAdsSetting, {
        as: 'FkProductAdsSetting1s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(ProductAttribute, {
        as: 'FkProductAttribute2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(ProductReview, {
        as: 'FkProductReview1s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(Subscription, {
        as: 'FkSubscription2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.hasMany(WishList, {
        as: 'FkWishList2s',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(Vendor, {
        as: 'Vendor',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(Marketplace, {
        as: 'Marketplace',
        foreignKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(MarketplaceType, {
        as: 'MarketplaceType',
        foreignKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(ProductMedium, {
        as: 'ProductMedium',
        foreignKey: 'product_media_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(Category, {
        as: 'ProductCategory',
        foreignKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(SubCategory, {
        as: 'SubCategory',
        foreignKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(Country, {
        as: 'RelatedProductLocation',
        foreignKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsTo(State, {
        as: 'State',
        foreignKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(User, {
        as: 'CartUsers',
        through: Cart,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Product, {
        as: 'CouponExcludeProducts',
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Category, {
        as: 'CouponCategories',
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Category, {
        as: 'CouponExcludeCategories',
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Product, {
        as: 'CouponProducts',
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Category, {
        as: 'CouponCategories',
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Category, {
        as: 'CouponExcludeCategories',
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Coupon, {
        as: 'CouponExcludedProductCoupons',
        through: CouponExcludedProduct,
        foreignKey: 'product_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Coupon, {
        as: 'CouponProductCoupons',
        through: CouponProduct,
        foreignKey: 'product_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Order, {
        as: 'OrderItemOrders',
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Coupon, {
        as: 'OrderItemCoupons',
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Tax, {
        as: 'OrderItemTaxes',
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'tax_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Country, {
        as: 'ProductAdsSettingCountries',
        through: ProductAdsSetting,
        foreignKey: 'product_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(State, {
        as: 'ProductAdsSettingStates',
        through: ProductAdsSetting,
        foreignKey: 'product_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(Attribute, {
        as: 'ProductAttributeAttributes',
        through: ProductAttribute,
        foreignKey: 'product_id',
        otherKey: 'attribute_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(User, {
        as: 'ProductReviewUsers',
        through: ProductReview,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(User, {
        as: 'SubscriptionUsers',
        through: Subscription,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Product.belongsToMany(User, {
        as: 'WishListUsers',
        through: WishList,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
