/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('MarketplaceType', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(3),
            field: 'code',
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
        tableName: 'marketplace_type',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const MarketplaceType = model.MarketplaceType;
    const Product = model.Product;
    const Marketplace = model.Marketplace;
    const Vendor = model.Vendor;
    const Category = model.Category;
    const SubCategory = model.SubCategory;
    const Country = model.Country;
    const State = model.State;

    MarketplaceType.hasMany(Product, {
        foreignKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsTo(Marketplace, {
        foreignKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(Vendor, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(Marketplace, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(Category, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(SubCategory, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(Country, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    MarketplaceType.belongsToMany(State, {
        through: Product,
        foreignKey: 'marketplace_type_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
