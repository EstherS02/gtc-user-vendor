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
        // schema: 'public',
        tableName: 'country',
        timestamps: false
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

    Country.hasMany(Address, {
        as: 'FkAddress2s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(Product, {
        as: 'FkProduct7s',
        foreignKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(ProductAdsSetting, {
        as: 'FkProductAdsSetting2s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(State, {
        as: 'FkState1s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(Tax, {
        as: 'FkTax1s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(Timezone, {
        as: 'FkTimeZone1s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(Vendor, {
        as: 'FkVendor2s',
        foreignKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.hasMany(VendorShippingLocation, {
        as: 'FkVendorShippingLocation2s',
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsTo(Region, {
        as: 'Region',
        foreignKey: 'region_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsTo(Currency, {
        as: 'Currency',
        foreignKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(User, {
        as: 'AddressUsers',
        through: Address,
        foreignKey: 'country_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(State, {
        as: 'AddressProvinces',
        through: Address,
        foreignKey: 'country_id',
        otherKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Vendor, {
        as: 'ProductVendors',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Marketplace, {
        as: 'ProductMarketplaces',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(MarketplaceType, {
        as: 'ProductMarketplaceTypes',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(ProductMedium, {
        as: 'ProductProductMedia',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'product_media_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Category, {
        as: 'ProductProductCategories',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(SubCategory, {
        as: 'ProductSubCategories',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(State, {
        as: 'ProductStates',
        through: Product,
        foreignKey: 'product_location',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Product, {
        as: 'ProductAdsSettingProducts',
        through: ProductAdsSetting,
        foreignKey: 'country_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(State, {
        as: 'ProductAdsSettingStates',
        through: ProductAdsSetting,
        foreignKey: 'country_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(User, {
        as: 'VendorUsers',
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Currency, {
        as: 'VendorCurrencies',
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Timezone, {
        as: 'VendorTimezones',
        through: Vendor,
        foreignKey: 'base_location',
        otherKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Country.belongsToMany(Vendor, {
        as: 'VendorShippingLocationVendors',
        through: VendorShippingLocation,
        foreignKey: 'country_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
