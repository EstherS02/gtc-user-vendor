/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Timezone', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        country_id: {
            type: DataTypes.BIGINT,
            field: 'country_id',
            allowNull: false,
            references: {
                model: 'country',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        timezone: {
            type: DataTypes.STRING(255),
            field: 'timezone',
            allowNull: false
        },
        timezone_abbreviation: {
            type: DataTypes.STRING(10),
            field: 'timezone_abbreviation',
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
        tableName: 'timezone'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Timezone = model.Timezone;
    const Vendor = model.Vendor;
    const Country = model.Country;
    const User = model.User;
    const Plan = model.Plan;
    const Currency = model.Currency;

    Timezone.hasMany(Vendor, {
        foreignKey: 'timezone_id'
    });

    Timezone.belongsTo(Country, {
        foreignKey: 'country_id'
    });

    Timezone.belongsToMany(User, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'user_id',
        as:'Vendor'
    });

    Timezone.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'base_location',
        as:'Vendor'
    });

    Timezone.belongsToMany(Plan, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'vendor_plan_id',
        as:'Vendor'
    });

    Timezone.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'currency_id',
        as:'Vendor'
    });

};
