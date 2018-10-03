/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductAdsSetting', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: false
        },
        product_id: {
            type: DataTypes.BIGINT,
            field: 'product_id',
            allowNull: true,
            references: {
                model: 'product',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        position: {
            type: DataTypes.INTEGER,
            field: 'position',
            allowNull: true
        },
        image_url: {
            type: DataTypes.TEXT,
            field: 'image_url',
            allowNull: true
        },
        target_url: {
            type: DataTypes.TEXT,
            field: 'target_url',
            allowNull: true
        },
        country_id: {
            type: DataTypes.BIGINT,
            field: 'country_id',
            allowNull: true,
            references: {
                model: 'country',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        state_id: {
            type: DataTypes.BIGINT,
            field: 'state_id',
            allowNull: true,
            references: {
                model: 'state',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATEONLY,
            field: 'start_date',
            allowNull: true
        },
        end_date: {
            type: DataTypes.DATEONLY,
            field: 'end_date',
            allowNull: true
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
		payment_id: {
            type: DataTypes.BIGINT,
            field: 'payment_id',
            allowNull: false,
            references: {
                model: 'payment',
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
        tableName: 'product_ads_setting',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const ProductAdsSetting = model.ProductAdsSetting;
    const Product = model.Product;
    const Vendor = model.Vendor;
    const Country = model.Country;
	const State = model.State;
	const Payment = model.Payment;

    ProductAdsSetting.belongsTo(Product, {
        foreignKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
    ProductAdsSetting.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    ProductAdsSetting.belongsTo(Country, {
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    ProductAdsSetting.belongsTo(State, {
        foreignKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
	});
	
	ProductAdsSetting.belongsTo(Payment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
