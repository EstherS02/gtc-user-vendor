/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VendorFollower', {
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
        tableName: 'vendor_follower',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const VendorFollower = model.VendorFollower;
    const Vendor = model.Vendor;
    const User = model.User;

    VendorFollower.belongsTo(Vendor, {
        as: 'Vendor',
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    VendorFollower.belongsTo(User, {
        as: 'User',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
