/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('CouponCategory', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        coupon_id: {
            type: DataTypes.BIGINT,
            field: 'coupon_id',
            allowNull: false,
            references: {
                model: 'coupon',
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
        // schema: 'public',
        tableName: 'coupon_category',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const CouponCategory = model.CouponCategory;
    const Coupon = model.Coupon;
    const Category = model.Category;

    CouponCategory.belongsTo(Coupon, {
        as: 'Coupon',
        foreignKey: 'coupon_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    CouponCategory.belongsTo(Category, {
        as: 'Category',
        foreignKey: 'category_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
