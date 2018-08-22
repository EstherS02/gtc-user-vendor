/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('TalkSetting', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        talk_profile_pic_url: {
            type: DataTypes.TEXT,
            field: 'talk_profile_pic_url',
            allowNull: true
        },
        gtc_talk_enabled: {
            type: DataTypes.INTEGER,
            field: 'gtc_talk_enabled',
            allowNull: false
        },
        default_msg: {
            type: DataTypes.STRING(255),
            field: 'default_msg',
            allowNull: true,
            defaultValue: "Thank you for contacting us. A representative will respond to your message shortly"
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
        tableName: 'talk_setting',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const TalkSetting = model.TalkSetting;
    const Talk = model.Talk;
    const Vendor = model.Vendor;
    const User = model.User;
    const TalkThread = model.TalkThread;

   /* TalkSetting.hasMany(Talk, {
        foreignKey: 'talk_setting_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });*/

    TalkSetting.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    /*TalkSetting.belongsToMany(User, {
        through: Talk,
        foreignKey: 'talk_setting_id',
        otherKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });*/

   

    /*TalkSetting.belongsToMany(TalkThread, {
        through: Talk,
        foreignKey: 'talk_setting_id',
        otherKey: 'last_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });*/

};
