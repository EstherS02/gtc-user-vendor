/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('CategoryAttribute', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        tableName: 'category_attribute'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const CategoryAttribute = model.CategoryAttribute;
    const Attribute = model.Attribute;
    const Category = model.Category;

    CategoryAttribute.belongsTo(Attribute, {
        foreignKey: 'attribute_id'
    });

    CategoryAttribute.belongsTo(Category, {
        foreignKey: 'category_id'
    });

};
