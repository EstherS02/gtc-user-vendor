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
        talk_setting_id: {
            type: DataTypes.BIGINT,
            field: 'talk_setting_id',
            allowNull: false,
            references: {
                model: 'talk_setting',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
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
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        last_thread_id: {
            type: DataTypes.BIGINT,
            field: 'last_thread_id',
            allowNull: false,
            references: {
                model: 'talk_thread',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
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
        tableName: 'talk'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Talk = model.Talk;
    const TalkSetting = model.TalkSetting;
    const User = model.User;
    const TalkThread = model.TalkThread;

    Talk.belongsTo(TalkSetting, {
        foreignKey: 'talk_setting_id'
    });

    Talk.belongsTo(User, {
        foreignKey: 'from_id'
    });

    Talk.belongsTo(User, {
        foreignKey: 'to_id'
    });

    Talk.belongsTo(TalkThread, {
        foreignKey: 'last_thread_id'
    });

};
