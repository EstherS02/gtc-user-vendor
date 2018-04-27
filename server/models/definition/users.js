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
        hashed_pwd: {
            type: DataTypes.TEXT,
            field: 'hashed_pwd',
            allowNull: false
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
    const Order = model.Order;
    const PaymentSetting = model.PaymentSetting;
    const ProductReview = model.ProductReview;
    const Subscription = model.Subscription;
    const Talk = model.Talk;
    const TalkThread = model.TalkThread;
    const Ticket = model.Ticket;
    const TicketThread = model.TicketThread;
    const UserToken = model.UserToken;
    const Vendor = model.Vendor;
    const VendorFollower = model.VendorFollower;
    const WishList = model.WishList;
    const Country = model.Country;
    const State = model.State;
    const Product = model.Product;
    const Shipping = model.Shipping;
    const TalkSetting = model.TalkSetting;
    const Appclient = model.Appclient;
    const Currency = model.Currency;
    const Timezone = model.Timezone;

    User.hasMany(Address, {
        as: 'FkAddress1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Admin, {
        as: 'FkAdmin1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Cart, {
        as: 'FkCart1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Order, {
        as: 'FkOrder1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(PaymentSetting, {
        as: 'FkPaymentSetting1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(ProductReview, {
        as: 'FkProductReview2s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Subscription, {
        as: 'FkSubscription1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Talk, {
        as: 'FkTalk2s',
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Talk, {
        as: 'FkTalk3s',
        foreignKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(TalkThread, {
        as: 'FkTalkThread2s',
        foreignKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Ticket, {
        as: 'FkTicket1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(TicketThread, {
        as: 'FkTicketThread2s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(UserToken, {
        as: 'FkUserToken1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(Vendor, {
        as: 'FkVendor1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(VendorFollower, {
        as: 'FkVendorFollower2s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.hasMany(WishList, {
        as: 'FkWishList1s',
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Country, {
        as: 'AddressCountries',
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(State, {
        as: 'AddressProvinces',
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'province_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        as: 'CartProducts',
        through: Cart,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Shipping, {
        as: 'OrderShippings',
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Address, {
        as: 'OrderShippingAddresses',
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Address, {
        as: 'OrderBillingAddresses',
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        as: 'ProductReviewProducts',
        through: ProductReview,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        as: 'SubscriptionProducts',
        through: Subscription,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkSetting, {
        as: 'TalkTalkSettings',
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'talk_setting_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(User, {
        as: 'TalkTos',
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'to_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkThread, {
        as: 'TalkLastThreads',
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'last_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkSetting, {
        as: 'TalkTalkSettings',
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'talk_setting_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(User, {
        as: 'TalkFroms',
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'from_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(TalkThread, {
        as: 'TalkLastThreads',
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'last_thread_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Ticket, {
        as: 'TicketThreadTickets',
        through: TicketThread,
        foreignKey: 'user_id',
        otherKey: 'ticket_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Appclient, {
        as: 'UserTokenClients',
        through: UserToken,
        foreignKey: 'user_id',
        otherKey: 'client_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Country, {
        as: 'VendorBaseLocations',
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'base_location',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Currency, {
        as: 'VendorCurrencies',
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'currency_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Timezone, {
        as: 'VendorTimezones',
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'timezone_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Vendor, {
        as: 'VendorFollowerVendors',
        through: VendorFollower,
        foreignKey: 'user_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    User.belongsToMany(Product, {
        as: 'WishListProducts',
        through: WishList,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
