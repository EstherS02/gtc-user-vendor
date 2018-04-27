/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductAttribute', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        attribute_id: {
            type: DataTypes.BIGINT,
            field: 'attribute_id',
            allowNull: false,
            references: {
                model: 'attribute',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: false,
            references: {
                model: 'product',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        value: {
            type: DataTypes.STRING(128),
            field: 'value',
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
        tableName: 'product_attribute',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const ProductAttribute = model.ProductAttribute;
    const Attribute = model.Attribute;
    const Product = model.Product;

    ProductAttribute.belongsTo(Attribute, {
        as: 'Attribute',
        foreignKey: 'attribute_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    ProductAttribute.belongsTo(Product, {
        as: 'Product',
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
