/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Category', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(128),
            field: 'name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(5),
            field: 'code',
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(128),
            field: 'description',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
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
        tableName: 'category',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Category = model.Category;
    const CategoryAttribute = model.CategoryAttribute;
    const Coupon = model.Coupon;
    const CouponCategory = model.CouponCategory;
    const CouponExcludedCategory = model.CouponExcludedCategory;
    const Product = model.Product;
    const SubCategory = model.SubCategory;
    const Attribute = model.Attribute;
    const Vendor = model.Vendor;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedia = model.ProductMedia;
    const Country = model.Country;
    const State = model.State;

    Category.hasMany(CategoryAttribute, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(Coupon, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(Coupon, {
        foreignKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(CouponCategory, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(CouponExcludedCategory, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(Product, {
        foreignKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.hasMany(SubCategory, {
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Attribute, {
        through: CategoryAttribute,
        foreignKey: 'category_id',
        otherKey: 'attribute_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Product, {
        through: Coupon,
        foreignKey: 'category_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Product, {
        through: Coupon,
        foreignKey: 'category_id',
        otherKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Category, {
        as: "Category1",
        through: Coupon,
        foreignKey: 'category_id',
        otherKey: 'exclude_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Product, {
        through: Coupon,
        foreignKey: 'exclude_category_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Product, {
        through: Coupon,
        foreignKey: 'exclude_category_id',
        otherKey: 'exclude_product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Category, {
        as: "Category2",
        through: Coupon,
        foreignKey: 'exclude_category_id',
        otherKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Coupon, {
        through: CouponCategory,
        foreignKey: 'category_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Coupon, {
        through: CouponExcludedCategory,
        foreignKey: 'category_id',
        otherKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(ProductMedia, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'product_media_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(Country, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Category.belongsToMany(State, {
        through: Product,
        foreignKey: 'product_category_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
