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
        group_name: {
            type: DataTypes.STRING(64),
            field: 'group_name',
            allowNull: true
        },
        talk_thread_status: {
            type: DataTypes.INTEGER,
            field: 'talk_thread_status',
            allowNull: false
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
        tableName: 'talk_thread',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const TalkThread = model.TalkThread;
    const Talk = model.Talk;
    const TalkThreadUser = model.TalkThreadUser;
    const User = model.User;

    TalkThread.hasMany(Talk, {
        foreignKey: 'talk_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.hasMany(TalkThreadUser, {
        foreignKey: 'thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsToMany(User, {
        through: Talk,
        foreignKey: 'talk_thread_id',
        otherKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    TalkThread.belongsToMany(User, {
        through: TalkThreadUser,
        foreignKey: 'thread_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
