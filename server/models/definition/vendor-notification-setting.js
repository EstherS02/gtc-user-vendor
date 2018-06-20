/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorNotificationSetting', {
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
        notification_id: {
            type: DataTypes.TEXT,
            field: 'notification_id',
            allowNull: false
        },
        enabled: {
            type: DataTypes.INTEGER,
            field: 'enabled',
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
        tableName: 'vendor_notification_setting',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const VendorNotificationSetting = model.VendorNotificationSetting;
    const Vendor = model.Vendor;
    const Notification = model.Notification;

    VendorNotificationSetting.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });
    VendorNotificationSetting.belongsTo(Notification, {
        foreignKey: 'notification_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
