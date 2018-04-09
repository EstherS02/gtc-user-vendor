/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Country', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        region_id: {
            type: DataTypes.BIGINT,
            field: 'region_id',
            allowNull: false,
            references: {
                model: 'region',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        name: {
            type: DataTypes.STRING(128),
            field: 'name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(3),
            field: 'code',
            allowNull: false
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
        tableName: 'country'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Country = model.Country;
    const Address = model.Address;
    const Product = model.Product;
    const ProductAdsSetting = model.ProductAdsSetting;
    const State = model.State;
    const Tax = model.Tax;
    const Timezone = model.Timezone;
    const Vendor = model.Vendor;
    const VendorShippingLocation = model.VendorShippingLocation;
    const Region = model.Region;
    const Currency = model.Currency;
    const User = model.User;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedium = model.ProductMedium;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Plan = model.Plan;

    Country.hasMany(Address, {
        foreignKey: 'country_id'
    });

    Country.hasMany(Product, {
        foreignKey: 'product_location'
    });

    Country.hasMany(ProductAdsSetting, {
        foreignKey: 'country_id'
    });

    Country.hasMany(State, {
        foreignKey: 'country_id'
    });

    Country.hasMany(Tax, {
        foreignKey: 'country_id'
    });

    Country.hasMany(Timezone, {
        foreignKey: 'country_id'
    });

    Country.hasMany(Vendor, {
        foreignKey: 'base_location'
    });

    Country.hasMany(VendorShippingLocation, {
        foreignKey: 'country_id'
    });

    Country.belongsTo(Region, {
        foreignKey: 'region_id'
    });

    Country.belongsTo(Currency, {
        foreignKey: 'currency_id'
    });

    Country.belongsToMany(User, {
        through: Address,
        foreignKey: 'country_id',
        otherKey: 'user_id',
        as:'Address'
    });

    Country.belongsToMany(State, {
        through: Address,
        foreignKey: 'country_id',
        otherKey: 'province_id',
        as:'Address'
    });

    Country.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'vendor_id',
        as:'Product'
    });

    Country.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'marketplace_id',
        as:'Product'
    });

    Country.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'marketplace_type_id',
        as:'Product'
    });

    Country.belongsToMany(ProductMedium, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'product_media_id',
        as:'Product'
    });

    Country.belongsToMany(Category, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'product_category_id',
        as:'Product'
    });

    Country.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'sub_category_id',
        as:'Address'
    });

    Country.belongsToMany(State, {
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'state_id',
        as:'Product'
    });

    Country.belongsToMany(Product, {
        through: ProductAdsSetting,
        foreignKey: 'country_id',
        otherKey: 'product_id',
        as:'ProductAdsSetting'
    });

    Country.belongsToMany(State, {
        through: ProductAdsSetting,
        foreignKey: 'country_id',
        otherKey: 'state_id',
        as:'ProductAdsSetting'
    });

    Country.belongsToMany(User, {
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'user_id',
        as:'Vendor'
    });

    Country.belongsToMany(Plan, {
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'vendor_plan_id',
        as:'Vendor'
    });

    Country.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'currency_id',
        as:'Vendor'
    });

    Country.belongsToMany(Timezone, {
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'timezone_id',
        as:'Vendor'
    });

    Country.belongsToMany(Vendor, {
        through: VendorShippingLocation,
        foreignKey: 'country_id',
        otherKey: 'vendor_id',
        as:'Vendor'
    });

};
