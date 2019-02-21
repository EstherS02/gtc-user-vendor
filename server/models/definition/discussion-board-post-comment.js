/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('DiscussionBoardPostComment', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        discussion_board_post_id: {
            type: DataTypes.BIGINT,
            field: 'discussion_board_post_id',
            allowNull: false,
            references: {
                model: 'discussion_board_post',
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
        comment_type: {
            type: DataTypes.INTEGER,
            field: 'comment_type',
            allowNull: false
        },
        comment_media_url: {
            type: DataTypes.TEXT,
            field: 'comment_media_url',
            allowNull: true
        },
        comment: {
            type: DataTypes.TEXT,
            field: 'comment',
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
        tableName: 'discussion_board_post_comment',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const DiscussionBoardPostComment = model.DiscussionBoardPostComment;
    const DiscussionBoardPost = model.DiscussionBoardPost;
    const User = model.User;

    DiscussionBoardPostComment.belongsTo(DiscussionBoardPost, {
        foreignKey: 'discussion_board_post_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    DiscussionBoardPostComment.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};