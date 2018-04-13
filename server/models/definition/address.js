/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Address', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        company_name: {
            type: DataTypes.STRING(128),
            field: 'company_name',
            allowNull: false
        },
        address_line1: {
            type: DataTypes.STRING(255),
            field: 'address_line1',
            allowNull: false
        },
        address_line2: {
            type: DataTypes.STRING(255),
            field: 'address_line2',
            allowNull: true
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
        province_id: {
            type: DataTypes.BIGINT,
            field: 'province_id',
            allowNull: false,
            references: {
                model: 'state',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        city: {
            type: DataTypes.STRING(128),
            field: 'city',
            allowNull: false
        },
        postal_code: {
            type: DataTypes.INTEGER,
            field: 'postal_code',
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
        tableName: 'address'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Address = model.Address;
    const Order = model.Order;
    const User = model.User;
    const Country = model.Country;
    const State = model.State;
    const Shipping = model.Shipping;

    Address.hasMany(Order, {
        foreignKey: 'shipping_address_id'
    });

    Address.hasMany(Order, {
        foreignKey: 'billing_address_id'
    });

    Address.belongsTo(User, {
        foreignKey: 'user_id'
    });

    Address.belongsTo(Country, {
        foreignKey: 'country_id'
    });

    Address.belongsTo(State, {
        foreignKey: 'province_id'
    });

    Address.belongsToMany(User, {
        through: Order,
        foreignKey: 'shipping_address_id',
        otherKey: 'user_id'
    });

    Address.belongsToMany(Shipping, {
        through: Order,
        foreignKey: 'shipping_address_id',
        otherKey: 'shipping_id'
    });

    Address.belongsToMany(Address, {
        as: 'address',
        through: Order,
        foreignKey: 'shipping_address_id',
        otherKey: 'billing_address_id'
    });

    Address.belongsToMany(User, {
        through: Order,
        foreignKey: 'billing_address_id',
        otherKey: 'user_id'
    });

    Address.belongsToMany(Shipping, {
        through: Order,
        foreignKey: 'billing_address_id',
        otherKey: 'shipping_id'
    });

    Address.belongsToMany(Address, {
        as: 'address',
        through: Order,
        foreignKey: 'billing_address_id',
        otherKey: 'shipping_address_id'
    });

};
