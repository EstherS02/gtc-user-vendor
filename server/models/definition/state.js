/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('State', {
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
        country_id: {
            type: DataTypes.BIGINT,
            field: 'country_id',
            allowNull: false,
            references: {
                model: 'country',
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
        tableName: 'state'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const State = model.State;
    const Address = model.Address;
    const Product = model.Product;
    const ProductAdsSetting = model.ProductAdsSetting;
    const Country = model.Country;
    const User = model.User;
    const Vendor = model.Vendor;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedium = model.ProductMedium;
    const Category = model.Category;
    const SubCategory = model.SubCategory;

    State.hasMany(Address, {
        foreignKey: 'province_id'
    });

    State.hasMany(Product, {
        foreignKey: 'state_id'
    });

    State.hasMany(ProductAdsSetting, {
        foreignKey: 'state_id'
    });

    State.belongsTo(Country, {
        foreignKey: 'country_id'
    });

    State.belongsToMany(User, {
        through: Address,
        foreignKey: 'province_id',
        otherKey: 'user_id',
        as:'Address'
    });

    State.belongsToMany(Country, {
        through: Address,
        foreignKey: 'province_id',
        otherKey: 'country_id',
        as:'Address'
    });

    State.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'vendor_id',
        as:'Product'
    });

    State.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'marketplace_id',
        as:'Product'
    });

    State.belongsToMany(MarketplaceType, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'marketplace_type_id',
        as:'Product'
    });

    State.belongsToMany(ProductMedium, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'product_media_id',
        as:'Product'
    });

    State.belongsToMany(Category, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'product_category_id',
        as:'Product'
    });

    State.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'sub_category_id',
        as:'Product'
    });

    State.belongsToMany(Country, {
        through: Product,
        foreignKey: 'state_id',
        otherKey: 'product_location',
        as:'Product'
    });

    State.belongsToMany(Product, {
        through: ProductAdsSetting,
        foreignKey: 'state_id',
        otherKey: 'product_id',
        as:'ProductAdsSetting'
    });

    State.belongsToMany(Country, {
        through: ProductAdsSetting,
        foreignKey: 'state_id',
        otherKey: 'country_id',
        as:'ProductAdsSetting'
    });

};
