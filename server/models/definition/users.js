/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        user_contact_email: {
            type: DataTypes.STRING(128),
            field: 'user_contact_email',
            allowNull: true
        },
        hashed_pwd: {
            type: DataTypes.TEXT,
            field: 'hashed_pwd',
            allowNull: true
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
        provider: {
            type: DataTypes.INTEGER,
            field: 'provider',
            allowNull: false
        },
        user_pic_url: {
            type: DataTypes.TEXT,
            field: 'user_pic_url',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING(128),
            field: 'salt',
            allowNull: true
        },
        fb_id: {
            type: DataTypes.STRING(32),
            field: 'fb_id',
            allowNull: true
        },
        google_id: {
            type: DataTypes.STRING(32),
            field: 'google_id',
            allowNull: true
        },
        linkedin_id: {
            type: DataTypes.STRING(32),
            field: 'linkedin_id',
            allowNull: true
        },
        twitter_id: {
            type: DataTypes.STRING(32),
            field: 'twitter_id',
            allowNull: true
        },
        email_verified: {
            type: DataTypes.INTEGER,
            field: 'email_verified',
            allowNull: false
        },
        email_verified_token: {
            type: DataTypes.TEXT,
            field: 'email_verified_token',
            allowNull: true
        },
        email_verified_token_generated: {
            type: DataTypes.DATE,
            field: 'email_verified_token_generated',
            allowNull: true
        },
        last_login_at: {
            type: DataTypes.DATE,
            field: 'last_login_at',
            allowNull: true
        },
        forgot_password_token: {
            type: DataTypes.TEXT,
            field: 'forgot_password_token',
            allowNull: true
        },
        forgot_password_token_generated: {
            type: DataTypes.DATE,
            field: 'forgot_password_token_generated',
            allowNull: true
        },
        stripe_customer_id: {
            type: DataTypes.STRING(255),
            field: 'stripe_customer_id',
            allowNull: true
        },
        availability_status: {
            type: DataTypes.INTEGER,
            field: 'availability_status',
            allowNull: true,
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
        tableName: 'users',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const User = model.User;
    const Address = model.Address;
    const Admin = model.Admin;
    const Cart = model.Cart;
    const DiscussionBoardPost = model.DiscussionBoardPost;
    const DiscussionBoardPostComment = model.DiscussionBoardPostComment;
    const DiscussionBoardPostLike = model.DiscussionBoardPostLike;
    const Mail = model.Mail;
    const Notification = model.Notification;
    const Order = model.Order;
    const PaymentSetting = model.PaymentSetting;
    const Review = model.Review;
    const Subscription = model.Subscription;
    const Talk = model.Talk;
    const TalkThreadUser = model.TalkThreadUser;
    const Ticket = model.Ticket;
    const TicketThread = model.TicketThread;
    const UserMail = model.UserMail;
    const UserPlan = model.UserPlan;
    const UserToken = model.UserToken;
    const Vendor = model.Vendor;
    const VendorFollower = model.VendorFollower;
    const VendorRating = model.VendorRating;
    const WishList = model.WishList;
    const Country = model.Country;
    const State = model.State;
    const Product = model.Product;
    const Payment = model.Payment;
    const Shipping = model.Shipping;
    const TalkThread = model.TalkThread;
    const Plan = model.Plan;
    const Appclient = model.Appclient;
    const Currency = model.Currency;
    const Timezone = model.Timezone;

    User.hasMany(Address, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Admin, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Cart, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(DiscussionBoardPost, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(DiscussionBoardPostComment, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(DiscussionBoardPostLike, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Mail, {
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Mail, {
        foreignKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Notification, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Order, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(PaymentSetting, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Review, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Subscription, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Talk, {
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(TalkThreadUser, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Ticket, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(TicketThread, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(UserMail, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(UserPlan, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(UserToken, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Vendor, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(VendorFollower, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(VendorRating, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(WishList, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Country, {
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(State, {
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        through: Cart,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Vendor, {
        through: DiscussionBoardPost,
        foreignKey: 'user_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(DiscussionBoardPost, {
        through: DiscussionBoardPostComment,
        foreignKey: 'user_id',
        otherKey: 'discussion_board_post_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(DiscussionBoardPost, {
        through: DiscussionBoardPostLike,
        foreignKey: 'user_id',
        otherKey: 'discussion_board_post_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(User, {
        as: 'fromUserId',
        through: Mail,
        foreignKey: 'from_id',
        otherKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(User, {
        as: 'toUserId',
        through: Mail,
        foreignKey: 'to_id',
        otherKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Payment, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Shipping, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Address, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Address, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        through: Review,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        through: Subscription,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkThread, {
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'talk_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkThread, {
        through: TalkThreadUser,
        foreignKey: 'user_id',
        otherKey: 'thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Ticket, {
        through: TicketThread,
        foreignKey: 'user_id',
        otherKey: 'ticket_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Mail, {
        through: UserMail,
        foreignKey: 'user_id',
        otherKey: 'mail_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Plan, {
        through: UserPlan,
        foreignKey: 'user_id',
        otherKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Payment, {
        through: UserPlan,
        foreignKey: 'user_id',
        otherKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Appclient, {
        through: UserToken,
        foreignKey: 'user_id',
        otherKey: 'client_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(State, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Timezone, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Vendor, {
        through: VendorFollower,
        foreignKey: 'user_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Vendor, {
        through: VendorRating,
        foreignKey: 'user_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        through: WishList,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
