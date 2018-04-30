/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorVerification', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        vendor_id: {
            type: DataTypes.BIGINT,
            field: 'vendor_id',
            allowNull: false,
            references: {
                model: 'vendor',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        personal_id_verification_file_type: {
            type: DataTypes.STRING(45),
            field: 'personal_id_verification_file_type',
            allowNull: false
        },
        personal_id_verification_file_link: {
            type: DataTypes.TEXT,
            field: 'personal_id_verification_file_link',
            allowNull: false
        },
        personal_address_verification_file_link: {
            type: DataTypes.TEXT,
            field: 'personal_address_verification_file_link',
            allowNull: false
        },
        business_verification_file_link: {
            type: DataTypes.TEXT,
            field: 'business_verification_file_link',
            allowNull: false
        },
        business_address_verfication_file_link: {
            type: DataTypes.TEXT,
            field: 'business_address_verfication_file_link',
            allowNull: false
        },
        uploaded_on: {
            type: DataTypes.DATE,
            field: 'uploaded_on',
            allowNull: true
        },
        created_by: {
            type: DataTypes.STRING(64),
            field: 'created_by',
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
        tableName: 'vendor_verification',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const VendorVerification = model.VendorVerification;
    const Vendor = model.Vendor;

    VendorVerification.belongsTo(Vendor, {
        as: 'Vendor',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
