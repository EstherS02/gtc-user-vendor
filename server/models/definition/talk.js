/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Talk', {
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
            allowNull: false
        },
        talk_status: {
            type: DataTypes.INTEGER,
            field: 'talk_status',
            allowNull: false
        },
        talk_thread_id: {
            type: DataTypes.BIGINT,
            field: 'talk_thread_id',
            allowNull: true,
            references: {
                model: 'talk_thread',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        is_read: {
            type: DataTypes.INTEGER,
            field: 'is_read',
            allowNull: false,
            defaultValue: "0"
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
        tableName: 'talk',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Talk = model.Talk;
    const User = model.User;
    const TalkThread = model.TalkThread;

    Talk.belongsTo(User, {
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Talk.belongsTo(TalkThread, {
        foreignKey: 'talk_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
