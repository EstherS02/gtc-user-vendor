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
            allowNull: false,
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
        tableName: 'product'
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
    const ProductMedia = model.ProductMedia;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Country = model.Country;
    const State = model.State;
    const User = model.User;
    const Order = model.Order;
    const Tax = model.Tax;
    const Attribute = model.Attribute;

    Product.hasMany(Cart, {
        foreignKey: 'product_id'
    });

    Product.hasMany(Coupon, {
        foreignKey: 'product_id'
    });

    Product.hasMany(Coupon, {
        foreignKey: 'exclude_product_id'
    });

    Product.hasMany(CouponExcludedProduct, {
        foreignKey: 'product_id'
    });

    Product.hasMany(CouponProduct, {
        foreignKey: 'product_id'
    });

    Product.hasMany(FeaturedProduct, {
        foreignKey: 'product_id'
    });

    Product.hasMany(OrderItem, {
        foreignKey: 'product_id'
    });

    Product.hasMany(ProductAdsSetting, {
        foreignKey: 'product_id'
    });

    Product.hasMany(ProductAttribute, {
        foreignKey: 'product_id'
    });

    Product.hasMany(ProductReview, {
        foreignKey: 'product_id'
    });

    Product.hasMany(Subscription, {
        foreignKey: 'product_id'
    });

    Product.hasMany(WishList, {
        foreignKey: 'product_id'
    });

    Product.belongsTo(Vendor, {
        foreignKey: 'vendor_id'
    });

    Product.belongsTo(Marketplace, {
        foreignKey: 'marketplace_id'
    });

    Product.belongsTo(MarketplaceType, {
        foreignKey: 'marketplace_type_id'
    });

    Product.belongsTo(ProductMedia, {
        foreignKey: 'product_media_id'
    });

    Product.belongsTo(Category, {
        foreignKey: 'product_category_id'
    });

    Product.belongsTo(SubCategory, {
        foreignKey: 'sub_category_id'
    });

    Product.belongsTo(Country, {
        foreignKey: 'product_location'
    });

    Product.belongsTo(State, {
        foreignKey: 'state_id'
    });

    Product.belongsToMany(User, {
        through: Cart,
        foreignKey: 'product_id',
        otherKey: 'user_id'
    });

    Product.belongsToMany(Product, {
        as: 'product',
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'exclude_product_id'
    });

    Product.belongsToMany(Category, {
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'category_id'
    });

    Product.belongsToMany(Category, {
        through: Coupon,
        foreignKey: 'product_id',
        otherKey: 'exclude_category_id'
    });

    Product.belongsToMany(Product, {
        as: 'product',
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'product_id'
    });

    Product.belongsToMany(Category, {
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'category_id'
    });

    Product.belongsToMany(Category, {
        through: Coupon,
        foreignKey: 'exclude_product_id',
        otherKey: 'exclude_category_id'
    });

    Product.belongsToMany(Coupon, {
        through: CouponExcludedProduct,
        foreignKey: 'product_id',
        otherKey: 'coupon_id'
    });

    Product.belongsToMany(Coupon, {
        through: CouponProduct,
        foreignKey: 'product_id',
        otherKey: 'coupon_id'
    });

    Product.belongsToMany(Order, {
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'order_id'
    });

    Product.belongsToMany(Coupon, {
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'coupon_id'
    });

    Product.belongsToMany(Tax, {
        through: OrderItem,
        foreignKey: 'product_id',
        otherKey: 'tax_id'
    });

    Product.belongsToMany(Country, {
        through: ProductAdsSetting,
        foreignKey: 'product_id',
        otherKey: 'country_id'
    });

    Product.belongsToMany(State, {
        through: ProductAdsSetting,
        foreignKey: 'product_id',
        otherKey: 'state_id'
    });

    Product.belongsToMany(Attribute, {
        through: ProductAttribute,
        foreignKey: 'product_id',
        otherKey: 'attribute_id'
    });

    Product.belongsToMany(User, {
        through: ProductReview,
        foreignKey: 'product_id',
        otherKey: 'user_id'
    });

    Product.belongsToMany(User, {
        through: Subscription,
        foreignKey: 'product_id',
        otherKey: 'user_id'
    });

    Product.belongsToMany(User, {
        through: WishList,
        foreignKey: 'product_id',
        otherKey: 'user_id'
    });

};
