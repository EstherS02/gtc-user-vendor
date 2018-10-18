/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorUserProduct', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        vendor_name: {
            type: DataTypes.STRING(64),
            field: 'vendor_name',
            allowNull: true
        },
        contact_email: {
            type: DataTypes.STRING(128),
            field: 'contact_email',
            allowNull: true
        },
        url: {
            type: DataTypes.TEXT,
            field: 'url',
            allowNull: true
        },
        origin_id: {
            type: DataTypes.BIGINT,
            field: 'origin_id',
            allowNull: true
        },
        origin: {
            type: DataTypes.STRING(128),
            field: 'origin',
            allowNull: true
        },
        type: {
            type: DataTypes.STRING(64),
            field: 'type',
            allowNull: true
        },
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: true
        },
        email: {
            type: DataTypes.STRING(128),
            field: 'email',
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING(64),
            field: 'first_name',
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING(64),
            field: 'last_name',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: true
        },
        role: {
            type: DataTypes.INTEGER,
            field: 'role',
            allowNull: true
        },
        email_verified: {
            type: DataTypes.INTEGER,
            field: 'email_verified',
            allowNull: true
        },
        product_count: {
            type: DataTypes.BIGINT,
            field: 'product_count',
            allowNull: true
        },
        sales_count: {
            type: DataTypes.DECIMAL(54),
            field: 'sales_count',
            allowNull: true
        },
        rating: {
            type: DataTypes.DECIMAL(14, 4),
            field: 'rating',
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
        tableName: 'vendor_user_product',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
