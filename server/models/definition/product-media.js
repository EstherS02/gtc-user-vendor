/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductMedium', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.INTEGER,
            field: 'type',
            allowNull: false
        },
        url: {
            type: DataTypes.TEXT,
            field: 'url',
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
        tableName: 'product_media'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const ProductMedium = model.ProductMedium;
    const Product = model.Product;
    const Vendor = model.Vendor;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Country = model.Country;
    const State = model.State;

    ProductMedium.hasMany(Product, {
        foreignKey: 'product_media_id'
    });

    ProductMedium.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'vendor_id'
    });

    ProductMedium.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'marketplace_id'
    });

    ProductMedium.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'marketplace_type_id'
    });

    ProductMedium.belongsToMany(Category, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'product_category_id'
    });

    ProductMedium.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'sub_category_id'
    });

    ProductMedium.belongsToMany(Country, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'product_location'
    });

    ProductMedium.belongsToMany(State, {
        through: Product,
        foreignKey: 'product_media_id',
        otherKey: 'state_id'
    });

};
