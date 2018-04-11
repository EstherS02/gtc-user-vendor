/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Currency', {
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
        symbol: {
            type: DataTypes.STRING(10),
            field: 'symbol',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(5),
            field: 'code',
            allowNull: false
        },
        decimal_points: {
            type: DataTypes.INTEGER,
            field: 'decimal_points',
            allowNull: true
        },
        isactive: {
            type: DataTypes.INTEGER,
            field: 'isactive',
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
        tableName: 'currency'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Currency = model.Currency;
    const Country = model.Country;
    const Vendor = model.Vendor;
    const Region = model.Region;
    const User = model.User;
    const Plan = model.Plan;
    const Timezone = model.Timezone;

    Currency.hasMany(Country, {
        foreignKey: 'currency_id'
    });

    Currency.hasMany(Vendor, {
        foreignKey: 'currency_id'
    });

    Currency.belongsToMany(Region, {
        through: Country,
        foreignKey: 'currency_id',
        otherKey: 'region_id'
    });

    Currency.belongsToMany(User, {
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'user_id'
    });

    Currency.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'base_location'
    });

    Currency.belongsToMany(Plan, {
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'vendor_plan_id'
    });

    Currency.belongsToMany(Timezone, {
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'timezone_id'
    });

};
