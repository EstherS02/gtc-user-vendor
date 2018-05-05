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
        // schema: 'public',
        tableName: 'talk_thread',
        timestamps: false
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
        as: 'FkTalk4s',
        foreignKey: 'last_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsTo(User, {
        as: 'From',
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsToMany(TalkSetting, {
        as: 'TalkTalkSettings',
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'talk_setting_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsToMany(User, {
        as: 'TalkFroms',
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsToMany(User, {
        as: 'TalkTos',
        through: Talk,
        foreignKey: 'last_thread_id',
        otherKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
