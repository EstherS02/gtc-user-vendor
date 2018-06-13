/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorVerification', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        business_address_verification_file_link: {
            type: DataTypes.TEXT,
            field: 'business_address_verification_file_link',
            allowNull: false
        },
        uploaded_on: {
            type: DataTypes.DATE,
            field: 'uploaded_on',
            allowNull: true
        },
        request_for_vendor_verification: {
            type: DataTypes.INTEGER,
            field: 'request_for_vendor_verification',
            allowNull: true
        },
        vendor_verified_status: {
            type: DataTypes.INTEGER,
            field: 'vendor_verified_status',
            allowNull: true
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
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
