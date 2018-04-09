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
        refresh_token: {
            type: DataTypes.TEXT,
            field: 'refresh_token',
            allowNull: true
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
        email_verified_token_generated_at: {
            type: DataTypes.DATE,
            field: 'email_verified_token_generated_at',
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
        forgot_password_token_generated_at: {
            type: DataTypes.DATE,
            field: 'forgot_password_token_generated_at',
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
        tableName: 'users'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const User = model.User;
    const Address = model.Address;
    const Cart = model.Cart;
    const Order = model.Order;
    const PaymentSetting = model.PaymentSetting;
    const ProductReview = model.ProductReview;
    const Subscription = model.Subscription;
    const Talk = model.Talk;
    const TalkThread = model.TalkThread;
    const Ticket = model.Ticket;
    const TicketThread = model.TicketThread;
    const Vendor = model.Vendor;
    const VendorFollower = model.VendorFollower;
    const WishList = model.WishList;
    const Country = model.Country;
    const State = model.State;
    const Product = model.Product;
    const Shipping = model.Shipping;
    const TalkSetting = model.TalkSetting;
    const Plan = model.Plan;
    const Currency = model.Currency;
    const Timezone = model.Timezone;

    User.hasMany(Address, {
        foreignKey: 'user_id'
    });

    User.hasMany(Cart, {
        foreignKey: 'user_id'
    });

    User.hasMany(Order, {
        foreignKey: 'user_id'
    });

    User.hasMany(PaymentSetting, {
        foreignKey: 'user_id'
    });

    User.hasMany(ProductReview, {
        foreignKey: 'user_id'
    });

    User.hasMany(Subscription, {
        foreignKey: 'user_id'
    });

    User.hasMany(Talk, {
        foreignKey: 'from_id'
    });

    User.hasMany(Talk, {
        foreignKey: 'to_id'
    });

    User.hasMany(TalkThread, {
        foreignKey: 'from_id'
    });

    User.hasMany(Ticket, {
        foreignKey: 'user_id'
    });

    User.hasMany(TicketThread, {
        foreignKey: 'user_id'
    });

    User.hasMany(Vendor, {
        foreignKey: 'user_id'
    });

    User.hasMany(VendorFollower, {
        foreignKey: 'user_id'
    });

    User.hasMany(WishList, {
        foreignKey: 'user_id'
    });

    User.belongsToMany(Country, {
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'country_id',
        as:'Address'
    });

    User.belongsToMany(State, {
        through: Address,
        foreignKey: 'user_id',
        otherKey: 'province_id',
        as:'Address'
    });

    User.belongsToMany(Product, {
        through: Cart,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        as:'Cart'
    });

    User.belongsToMany(Shipping, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_id',
        as:'Order'
    });

    User.belongsToMany(Address, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'shipping_address_id',
        as:'Order'
    });

    User.belongsToMany(Address, {
        through: Order,
        foreignKey: 'user_id',
        otherKey: 'billing_address_id',
        as:'Order'
    });

    User.belongsToMany(Product, {
        through: ProductReview,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        as:'ProductReview'
    });

    User.belongsToMany(Product, {
        through: Subscription,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        as:'Subscription'
    });

    User.belongsToMany(TalkSetting, {
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'talk_setting_id',
        as:'Talk'
    });

    User.belongsToMany(User, {
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'to_id',
        as:'Talk'
    });

    User.belongsToMany(TalkThread, {
        through: Talk,
        foreignKey: 'from_id',
        otherKey: 'last_thread_id',
        as:'Talk'
    });

    User.belongsToMany(TalkSetting, {
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'talk_setting_id',
        as:'Talk'
    });

    User.belongsToMany(User, {
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'from_id',
        as:'Talk'
    });

    User.belongsToMany(TalkThread, {
        through: Talk,
        foreignKey: 'to_id',
        otherKey: 'last_thread_id',
        as:'Talk'
    });

    User.belongsToMany(Ticket, {
        through: TicketThread,
        foreignKey: 'user_id',
        otherKey: 'ticket_id',
        as:'TicketThread'
    });

    User.belongsToMany(Country, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'base_location',
        as:'Vendor'
    });

    User.belongsToMany(Plan, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'vendor_plan_id',
        as:'Vendor'
    });

    User.belongsToMany(Currency, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'currency_id',
        as:'Vendor'
    });

    User.belongsToMany(Timezone, {
        through: Vendor,
        foreignKey: 'user_id',
        otherKey: 'timezone_id',
        as:'Vendor'
    });

    User.belongsToMany(Vendor, {
        through: VendorFollower,
        foreignKey: 'user_id',
        otherKey: 'vendor_id',
        as:'VendorFollower'
    });

    User.belongsToMany(Product, {
        through: WishList,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        as:'WishList'
    });

};
