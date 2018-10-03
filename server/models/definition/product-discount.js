/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
	return sequelize.define('ProductDiscount', {
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
        discount_type: {
            type: DataTypes.INTEGER,
            field: 'discount_type',
            allowNull: false
        },
        discount_value: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'discount_value',
            allowNull: false
        },
        start_date: {
            type: DataTypes.DATE,
            field: 'start_date',
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATE,
            field: 'end_date',
            allowNull: false
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
		tableName: 'product_discount',
        timestamps: false
	});
};

module.exports.initRelations = () => {
	delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

	const model = require('../index');
	const ProductDiscount = model.ProductDiscount;
	const Product = model.Product;

	ProductDiscount.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
};