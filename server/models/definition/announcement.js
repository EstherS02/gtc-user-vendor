/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Announcement', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        notification: {
            type: DataTypes.STRING(255),
            field: 'notification',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        visible_to_user: {
            type: DataTypes.INTEGER,
            field: 'visible_to_user',
            allowNull: true
        },
        visible_to_wholesaler: {
            type: DataTypes.INTEGER,
            field: 'visible_to_wholesaler',
            allowNull: true
        },
        visible_to_retailer: {
            type: DataTypes.INTEGER,
            field: 'visible_to_retailer',
            allowNull: true
        },
        visible_to_lifestyle_provider: {
            type: DataTypes.INTEGER,
            field: 'visible_to_lifestyle_provider',
            allowNull: true
        },
        visible_to_service_provider: {
            type: DataTypes.INTEGER,
            field: 'visible_to_service_provider',
            allowNull: true
        },
        link: {
            type: DataTypes.TEXT,
            field: 'link',
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
        tableName: 'announcement',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

};
