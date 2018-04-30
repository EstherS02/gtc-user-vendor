/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorPlan', {
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
        plan_id: {
            type: DataTypes.BIGINT,
            field: 'plan_id',
            allowNull: false,
            references: {
                model: 'plan',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        start_date: {
            type: DataTypes.DATEONLY,
            field: 'start_date',
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            field: 'end_date',
            allowNull: false
        },
        isactive: {
            type: DataTypes.INTEGER,
            field: 'isactive',
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
        }
    }, {
        // schema: 'public',
        tableName: 'vendor_plan',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const VendorPlan = model.VendorPlan;
    const Vendor = model.Vendor;
    const Plan = model.Plan;

    VendorPlan.belongsTo(Vendor, {
        as: 'Vendor',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    VendorPlan.belongsTo(Plan, {
        as: 'Plan',
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
