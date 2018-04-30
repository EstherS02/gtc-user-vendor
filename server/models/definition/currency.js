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
        // schema: 'public',
        tableName: 'currency',
        timestamps: false
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
    const Timezone = model.Timezone;

    Currency.hasMany(Country, {
        as: 'FkCountry2s',
        foreignKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Currency.hasMany(Vendor, {
        as: 'FkVendor4s',
        foreignKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Currency.belongsToMany(Region, {
        as: 'CountryRegions',
        through: Country,
        foreignKey: 'currency_id',
        otherKey: 'region_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Currency.belongsToMany(User, {
        as: 'VendorUsers',
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Currency.belongsToMany(Country, {
        as: 'VendorBaseLocations',
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Currency.belongsToMany(Timezone, {
        as: 'VendorTimezones',
        through: Vendor,
        foreignKey: 'currency_id',
        otherKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
