/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('AdminUser', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: false
        },
        role: {
            type: DataTypes.INTEGER,
            field: 'role',
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(128),
            field: 'email',
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING(64),
            field: 'first_name',
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING(64),
            field: 'last_name',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        email_verified: {
            type: DataTypes.INTEGER,
            field: 'email_verified',
            allowNull: false
        },
        last_login_at: {
            type: DataTypes.DATE,
            field: 'created_on',
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
        tableName: 'admin_user',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations;
};