/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('TalkThread', {
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
        message: {
            type: DataTypes.TEXT,
            field: 'message',
            allowNull: false
        },
        sent_at: {
            type: DataTypes.DATE,
            field: 'sent_at',
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
        tableName: 'talk_thread'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const TalkThread = model.TalkThread;
    const Talk = model.Talk;
    const User = model.User;
    const TalkSetting = model.TalkSetting;

    TalkThread.hasMany(Talk, {
        foreignKey: 'last_thread_id'
    });

    TalkThread.belongsTo(User, {
        foreignKey: 'from_id'
    });

    TalkThread.belongsToMany(TalkSetting, {
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'talk_setting_id',
        as:'Talk'
    });

    TalkThread.belongsToMany(User, {
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'from_id',
        as:'Talk'
    });

    TalkThread.belongsToMany(User, {
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'to_id',
        as:'Talk'
    });

};
