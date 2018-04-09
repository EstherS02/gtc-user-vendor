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
        tableName: 'plan'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Plan = model.Plan;
    const PlanLimit = model.PlanLimit;
    const PlanMarketplace = model.PlanMarketplace;
    const Vendor = model.Vendor;
    const VendorPlan = model.VendorPlan;
    const Marketplace = model.Marketplace;
    const User = model.User;
    const Country = model.Country;
    const Currency = model.Currency;
    const Timezone = model.Timezone;

    Plan.hasMany(PlanLimit, {
        foreignKey: 'plan_id'
    });

    Plan.hasMany(PlanMarketplace, {
        foreignKey: 'plan_id'
    });

    Plan.hasMany(Vendor, {
        foreignKey: 'vendor_plan_id'
    });

    Plan.hasMany(VendorPlan, {
        foreignKey: 'plan_id'
    });

    Plan.belongsToMany(Marketplace, {
        through: PlanMarketplace,
        foreignKey: 'plan_id',
        otherKey: 'marketplace_id',
        as:'PlanMarketplace'
    });

    Plan.belongsToMany(User, {
        through: Vendor,
        foreignKey: 'vendor_plan_id',
        otherKey: 'user_id',
        as:'Vendor'
    });

    Plan.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'vendor_plan_id',
        otherKey: 'base_location',
        as:'Vendor'
    });

    Plan.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'vendor_plan_id',
        otherKey: 'currency_id',
        as:'Vendor'
    });

    Plan.belongsToMany(Timezone, {
        through: Vendor,
        foreignKey: 'vendor_plan_id',
        otherKey: 'timezone_id',
        as:'Vendor'
    });

    Plan.belongsToMany(Vendor, {
        through: VendorPlan,
        foreignKey: 'plan_id',
        otherKey: 'vendor_id',
        as:'VendorPlan'
    });

};
