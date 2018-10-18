/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorNotification', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            field: 'name',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(255),
            field: 'code',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: false
        },
        status: {
            type: DataTypes.BIGINT,
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
        tableName: 'vendor_notification',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const VendorNotification = model.VendorNotification;
    const VendorNotificationSetting = model.VendorNotificationSetting;
    const Vendor = model.Vendor;

    VendorNotification.hasMany(VendorNotificationSetting, {
        foreignKey: 'vendor_notification_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    VendorNotification.belongsToMany(Vendor, {
        through: VendorNotificationSetting,
        foreignKey: 'vendor_notification_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
