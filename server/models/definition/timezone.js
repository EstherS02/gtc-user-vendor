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
		coordinates:{
			type: DataTypes.STRING(15),
            field: 'coordinates',
            allowNull: false
		},
        timezone: {
            type: DataTypes.STRING(255),
            field: 'timezone',
            allowNull: false
		},
		timezone_name: {
            type: DataTypes.STRING(8),
            field: 'timezone_name',
            allowNull: false
		},
		utc_offset	: {
            type: DataTypes.STRING(8),
            field: 'utc_offset',
            allowNull: false
		},
		utc_daylight_saving_offset: {
            type: DataTypes.STRING(64),
            field: 'utc_daylight_saving_offset',
            allowNull: false
		},
        timezone_abbreviation: {
            type: DataTypes.STRING(10),
            field: 'timezone_abbreviation',
            allowNull: true
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
        tableName: 'timezone',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Timezone = model.Timezone;
    const BusinessHour = model.BusinessHour;
    const Vendor = model.Vendor;
    const Country = model.Country;
    const User = model.User;
    const State = model.State;
    const Currency = model.Currency;

    Timezone.hasMany(BusinessHour, {
        foreignKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.hasMany(Vendor, {
        foreignKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsTo(Country, {
        foreignKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsToMany(Vendor, {
        through: BusinessHour,
        foreignKey: 'timezone_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsToMany(User, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsToMany(State, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Timezone.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'timezone_id',
        otherKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
