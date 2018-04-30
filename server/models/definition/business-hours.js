/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('BusinessHour', {
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
        day: {
            type: DataTypes.INTEGER,
            field: 'day',
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            field: 'start_time',
            allowNull: true
        },
        end_time: {
            type: DataTypes.TIME,
            field: 'end_time',
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
        // schema: 'public',
        tableName: 'business_hours',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const BusinessHour = model.BusinessHour;
    const Vendor = model.Vendor;

    BusinessHour.belongsTo(Vendor, {
        as: 'Vendor',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
