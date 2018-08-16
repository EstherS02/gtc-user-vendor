/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('DiscussionBoardPost', {
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
        user_id: {
            type: DataTypes.BIGINT,
            field: 'user_id',
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        post_message: {
            type: DataTypes.TEXT,
            field: 'post_message',
            allowNull: true
        },
        post_media_type: {
            type: DataTypes.INTEGER,
            field: 'post_media_type',
            allowNull: true
        },
        post_media_url: {
            type: DataTypes.TEXT,
            field: 'post_media_url',
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
            allowNull: false
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
        tableName: 'discussion_board_post',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const DiscussionBoardPost = model.DiscussionBoardPost;
    const DiscussionBoardPostComment = model.DiscussionBoardPostComment;
    const DiscussionBoardPostLike = model.DiscussionBoardPostLike;
    const Vendor = model.Vendor;
    const User = model.User;

    DiscussionBoardPost.hasMany(DiscussionBoardPostComment, {
        foreignKey: 'discussion_board_post_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPost.hasMany(DiscussionBoardPostLike, {
        foreignKey: 'discussion_board_post_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPost.belongsTo(Vendor, {
        foreignKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPost.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPost.belongsToMany(User, {
        through: DiscussionBoardPostComment,
        foreignKey: 'discussion_board_post_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPost.belongsToMany(User, {
        through: DiscussionBoardPostLike,
        foreignKey: 'discussion_board_post_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
