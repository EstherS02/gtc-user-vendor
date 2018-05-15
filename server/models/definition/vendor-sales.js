/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorSales', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        vendor_name: {
            type: DataTypes.STRING(64),
            field: 'vendor_name',
            allowNull: false
        },
        owner_first_name: {
            type: DataTypes.STRING(64),
            field: 'owner_first_name',
            allowNull: false
        },
        owner_last_name: {
            type: DataTypes.STRING(64),
            field: 'owner_last_name',
            allowNull: true
        },
        vendor_product_count: {
            type: DataTypes.BIGINT,
            field: 'vendor_product_count',
            allowNull: true
        },
        cover_pic_url: {
            type: DataTypes.TEXT,
            field: 'cover_pic_url',
            allowNull: true
        },
        origin: {
            type: DataTypes.STRING(128),
            field: 'origin',
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
        tableName: 'vendor_sales',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
