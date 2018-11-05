/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Mail', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        from_id: {
            type: DataTypes.BIGINT,
            field: 'from_id',
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        to_id: {
            type: DataTypes.BIGINT,
            field: 'to_id',
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        subject: {
            type: DataTypes.STRING(255),
            field: 'subject',
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            field: 'message',
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
        tableName: 'mail',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Mail = model.Mail;
    const UserMail = model.UserMail;
    const User = model.User;

    Mail.hasMany(UserMail, {
        foreignKey: 'mail_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Mail.belongsTo(User, {
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Mail.belongsTo(User, {
        foreignKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Mail.belongsToMany(User, {
        through: UserMail,
        foreignKey: 'mail_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
