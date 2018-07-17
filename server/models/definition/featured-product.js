/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('FeaturedProduct', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        position: {
            type: DataTypes.STRING(45),
            field: 'position',
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATEONLY,
            field: 'start_date',
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            field: 'end_date',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        feature_indefinitely: {
            type: DataTypes.INTEGER,
            field: 'feature_indefinitely',
            allowNull: true
        },
        feature_status: {
            type: DataTypes.INTEGER,
            field: 'feature_status',
            allowNull: false
        },
        impression: {
            type: DataTypes.INTEGER,
            field: 'impression',
            allowNull: true
        },
        impression_limit: {
            type: DataTypes.INTEGER,
            field: 'impression_limit',
            allowNull: true
        },
        clicks: {
            type: DataTypes.INTEGER,
            field: 'clicks',
            allowNull: true
        },
        position_homepage: {
            type: DataTypes.INTEGER,
            field: 'position_homepage',
            allowNull: true
        },
        position_searchresult: {
            type: DataTypes.INTEGER,
            field: 'position_searchresult',
            allowNull: true
        },
        position_profilepage: {
            type: DataTypes.INTEGER,
            field: 'position_profilepage',
            allowNull: true
        },
        position_wholesale_landing: {
            type: DataTypes.INTEGER,
            field: 'position_wholesale_landing',
            allowNull: true
        },
        position_shop_landing: {
            type: DataTypes.INTEGER,
            field: 'position_shop_landing',
            allowNull: true
        }, 
        position_service_landing: {
            type: DataTypes.INTEGER,
            field: 'position_service_landing',
            allowNull: true
        }, 
        position_subscription_landing: {
            type: DataTypes.INTEGER,
            field: 'position_subscription_landing',
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
        tableName: 'featured_product',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const FeaturedProduct = model.FeaturedProduct;
    const Product = model.Product;

    FeaturedProduct.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
