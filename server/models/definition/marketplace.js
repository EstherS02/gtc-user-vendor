/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Marketplace', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(5),
            field: 'code',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: true
        },
        isactive: {
            type: DataTypes.INTEGER,
            field: 'isactive',
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
        tableName: 'marketplace'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const PlanMarketplace = model.PlanMarketplace;
    const Product = model.Product;
    const Plan = model.Plan;
    const Vendor = model.Vendor;
    const ProductMedia = model.ProductMedia;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Country = model.Country;
    const State = model.State;

    Marketplace.hasMany(MarketplaceType, {
        foreignKey: 'marketplace_id'
    });

    Marketplace.hasMany(PlanMarketplace, {
        foreignKey: 'marketplace_id'
    });

    Marketplace.hasMany(Product, {
        foreignKey: 'marketplace_id'
    });

    Marketplace.belongsToMany(Plan, {
        through: PlanMarketplace,
        foreignKey: 'marketplace_id',
        otherKey: 'plan_id'
    });

    Marketplace.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'vendor_id'
    });

    Marketplace.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'marketplace_type_id'
    });

    Marketplace.belongsToMany(ProductMedia, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'product_media_id'
    });

    Marketplace.belongsToMany(Category, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'product_category_id'
    });

    Marketplace.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'sub_category_id'
    });

    Marketplace.belongsToMany(Country, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'product_location'
    });

    Marketplace.belongsToMany(State, {
        through: Product,
        foreignKey: 'marketplace_id',
        otherKey: 'state_id'
    });

};
