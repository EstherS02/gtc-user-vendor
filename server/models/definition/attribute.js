/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Attribute', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        attr_name: {
            type: DataTypes.STRING(64),
            field: 'attr_name',
            allowNull: false
        },
        attr_required: {
            type: DataTypes.INTEGER,
            field: 'attr_required',
            allowNull: false
        },
        unit: {
            type: DataTypes.STRING(10),
            field: 'unit',
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
        tableName: 'attribute'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Attribute = model.Attribute;
    const CategoryAttribute = model.CategoryAttribute;
    const ProductAttribute = model.ProductAttribute;
    const Category = model.Category;
    const Product = model.Product;

    Attribute.hasMany(CategoryAttribute, {
        foreignKey: 'attribute_id'
    });

    Attribute.hasMany(ProductAttribute, {
        foreignKey: 'attribute_id'
    });

    Attribute.belongsToMany(Category, {
        through: CategoryAttribute,
        foreignKey: 'attribute_id',
        otherKey: 'category_id',
        as:'CategoryAttribute'
    });

    Attribute.belongsToMany(Product, {
        through: ProductAttribute,
        foreignKey: 'attribute_id',
        otherKey: 'product_id',
        as:'ProductAttribute'
    });

};
