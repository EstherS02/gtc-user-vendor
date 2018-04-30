/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SubCategory', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        category_id: {
            type: DataTypes.BIGINT,
            field: 'category_id',
            allowNull: false,
            references: {
                model: 'category',
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
            type: DataTypes.STRING(5),
            field: 'code',
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
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
        tableName: 'sub_category',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const SubCategory = model.SubCategory;
    const Product = model.Product;
    const Category = model.Category;
    const Vendor = model.Vendor;
    const Marketplace = model.Marketplace;
    const MarketplaceType = model.MarketplaceType;
    const ProductMedium = model.ProductMedium;
    const Country = model.Country;
    const State = model.State;

    SubCategory.hasMany(Product, {
        as: 'FkProduct6s',
        foreignKey: 'sub_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsTo(Category, {
        as: 'Category',
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(Vendor, {
        as: 'ProductVendors',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(Marketplace, {
        as: 'ProductMarketplaces',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(MarketplaceType, {
        as: 'ProductMarketplaceTypes',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'marketplace_type_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(ProductMedium, {
        as: 'ProductProductMedia',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'product_media_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(Category, {
        as: 'ProductProductCategories',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'product_category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(Country, {
        as: 'ProductProductLocations',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'product_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    SubCategory.belongsToMany(State, {
        as: 'ProductStates',
        through: Product,
        foreignKey: 'sub_category_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
