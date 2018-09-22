/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('NotificationSetting', {
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
    }, {
        tableName: 'notification_settings',
        timestamps: false
    });
};
module.exports.initRelations = () => {
    // delete module.exports.initRelations; // Destroy itself to prevent repeated calls.
    // const model = require('../index');
    // const Notification = model.Notification;
    // const User = model.User;

    // Notification.belongsTo(User, {
    //     foreignKey: 'user_id',
    //     onDelete: 'NO ACTION',
    //     onUpdate: 'NO ACTION'
    // });

};