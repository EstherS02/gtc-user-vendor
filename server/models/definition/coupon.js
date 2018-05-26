/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Coupon', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
            type: DataTypes.DATEONLY,
            field: 'publish_date',
            allowNull: false
        },
        sales_count: {
            type: DataTypes.BIGINT,
            field: 'sales_count',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
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
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponExcludedCategory, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponExcludedProduct, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(CouponProduct, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.hasMany(OrderItem, {
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Product, {
        foreignKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Category, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsTo(Category, {
        foreignKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Category, {
        through: CouponCategory,
        foreignKey: 'coupon_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Category, {
        through: CouponExcludedCategory,
        foreignKey: 'coupon_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        through: CouponExcludedProduct,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        through: CouponProduct,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Order, {
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Product, {
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Coupon.belongsToMany(Tax, {
        through: OrderItem,
        foreignKey: 'coupon_id',
        otherKey: 'tax_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
