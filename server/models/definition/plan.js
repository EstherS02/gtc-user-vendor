/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Plan', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(128),
            field: 'name',
            allowNull: false
        },
        cost: {
            type: DataTypes.DECIMAL(10, 4),
            field: 'cost',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            field: 'description',
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            field: 'duration',
            allowNull: false
        },
        duration_unit: {
            type: DataTypes.INTEGER,
            field: 'duration_unit',
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
        }
    }, {
        tableName: 'plan',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Plan = model.Plan;
    const PlanLimit = model.PlanLimit;
    const PlanMarketplace = model.PlanMarketplace;
    const VendorPlan = model.VendorPlan;
    const Marketplace = model.Marketplace;
    const Vendor = model.Vendor;

    Plan.hasMany(PlanLimit, {
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Plan.hasMany(PlanMarketplace, {
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Plan.hasMany(VendorPlan, {
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Plan.belongsToMany(Marketplace, {
        through: PlanMarketplace,
        foreignKey: 'plan_id',
        otherKey: 'marketplace_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Plan.belongsToMany(Vendor, {
        through: VendorPlan,
        foreignKey: 'plan_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
