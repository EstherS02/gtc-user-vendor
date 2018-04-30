/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Coupon', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        coupon_name: {
            type: DataTypes.STRING(64),
            field: 'coupon_name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(10),
            field: 'code',
            allowNull: false
        },
        discount_type: {
            type: DataTypes.INTEGER,
            field: 'discount_type',
            allowNull: false
        },
        discount_value: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'discount_value',
            allowNull: false
        },
        publish_date: {
            type: DataTypes.DATE,
            field: 'publish_date',
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATE,
            field: 'expiry_date',
            allowNull: true
        },
        minimum_spend: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'minimum_spend',
            allowNull: true
        },
        maximum_spend: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'maximum_spend',
            allowNull: true
        },
        individual_use_only: {
            type: DataTypes.INTEGER,
            field: 'individual_use_only',
            allowNull: true
        },
        excluse_sale_item: {
            type: DataTypes.INTEGER,
            field: 'excluse_sale_item',
            allowNull: true
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: true,
            references: {
                model: 'product',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        exclude_product_id: {
            type: DataTypes.BIGINT,
            field: 'exclude_product_id',
            allowNull: true,
            references: {
                model: 'product',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        category_id: {
            type: DataTypes.BIGINT,
            field: 'category_id',
            allowNull: true,
            references: {
                model: 'category',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        exclude_category_id: {
            type: DataTypes.BIGINT,
            field: 'exclude_category_id',
            allowNull: true,
            references: {
                model: 'category',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            field: 'usage_limit',
            allowNull: true
        },
        limit_usage_to_x_items: {
            type: DataTypes.INTEGER,
            field: 'limit_usage_to_x_items',
            allowNull: true
        },
        usage_limit_per_user: {
            type: DataTypes.INTEGER,
            field: 'usage_limit_per_user',
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
        // schema: 'public',
        tableName: 'coupon',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Coupon = model.Coupon;
    const CouponCategory = model.CouponCategory;
    const CouponExcludedCategory = model.CouponExcludedCategory;
    const CouponExcludedProduct = model.CouponExcludedProduct;
    const CouponProduct = model.CouponProduct;
    const OrderItem = model.OrderItem;
    const Product = model.Product;
    const Category = model.Category;
    const Order = model.Order;
    const Tax = model.Tax;

    Coupon.hasMany(CouponCategory, {
        as: 'FkCouponCategory1s',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponExcludedCategory, {
        as: 'FkCouponExcludedCategory1s',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponExcludedProduct, {
        as: 'FkCouponExcludedProduct1s',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponProduct, {
        as: 'FkCouponProduct1s',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(OrderItem, {
        as: 'FkOrderItems3s',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Product, {
        as: 'Product',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Product, {
        as: 'ExcludeProduct',
        foreignKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Category, {
        as: 'Category',
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Category, {
        as: 'ExcludeCategory',
        foreignKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Category, {
        as: 'CouponCategoryCategories',
        through: CouponCategory,
        foreignKey: 'coupon_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Category, {
        as: 'CouponExcludedCategoryCategories',
        through: CouponExcludedCategory,
        foreignKey: 'coupon_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        as: 'CouponExcludedProductProducts',
        through: CouponExcludedProduct,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        as: 'CouponProductProducts',
        through: CouponProduct,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Order, {
        as: 'OrderItemOrders',
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        as: 'OrderItemProducts',
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Tax, {
        as: 'OrderItemTaxes',
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'tax_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
