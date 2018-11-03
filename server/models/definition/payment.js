/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Payment', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.DATE,
            field: 'date',
            allowNull: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            field: 'amount',
            allowNull: true
        },
        payment_method: {
            type: DataTypes.INTEGER,
            field: 'payment_method',
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
        },
        payment_response: {
            type: DataTypes.TEXT,
            field: 'payment_response',
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
        tableName: 'payment',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Payment = model.Payment;
    const FeaturedProduct = model.FeaturedProduct;
    const OrderPayment = model.OrderPayment;
    const OrderPaymentEscrow = model.OrderPaymentEscrow;
    const OrdersNew = model.OrdersNew;
    const OrderItemPayout = model.OrderItemPayout;
    const OrderVendorPayout = model.OrderVendorPayout;
    const ProductAdsSetting = model.ProductAdsSetting;
    const UserPlan = model.UserPlan;
    const VendorPlan = model.VendorPlan;
    const Product = model.Product;
    const Order = model.Order;
    const User = model.User;
    const Shipping = model.Shipping;
    const Address = model.Address;
    const Country = model.Country;
    const State = model.State;
    const Vendor = model.Vendor;
    const Plan = model.Plan;

    Payment.hasMany(OrderVendorPayout, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(FeaturedProduct, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(OrderPayment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(OrderPaymentEscrow, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(OrdersNew, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(OrderItemPayout, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(ProductAdsSetting, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(UserPlan, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.hasMany(VendorPlan, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Product, {
        through: FeaturedProduct,
        foreignKey: 'payment_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Order, {
        through: OrderPayment,
        foreignKey: 'payment_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Order, {
        through: OrderPaymentEscrow,
        foreignKey: 'payment_id',
        otherKey: 'order_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(User, {
        through: OrdersNew,
        foreignKey: 'payment_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Shipping, {
        through: OrdersNew,
        foreignKey: 'payment_id',
        otherKey: 'shipping_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Address, {
        through: OrdersNew,
        foreignKey: 'payment_id',
        otherKey: 'shipping_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Address, {
        through: OrdersNew,
        foreignKey: 'payment_id',
        otherKey: 'billing_address_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Product, {
        through: ProductAdsSetting,
        foreignKey: 'payment_id',
        otherKey: 'product_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Country, {
        through: ProductAdsSetting,
        foreignKey: 'payment_id',
        otherKey: 'country_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(State, {
        through: ProductAdsSetting,
        foreignKey: 'payment_id',
        otherKey: 'state_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Vendor, {
        through: ProductAdsSetting,
        foreignKey: 'payment_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(User, {
        through: UserPlan,
        foreignKey: 'payment_id',
        otherKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Plan, {
        through: UserPlan,
        foreignKey: 'payment_id',
        otherKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Vendor, {
        through: VendorPlan,
        foreignKey: 'payment_id',
        otherKey: 'vendor_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    Payment.belongsToMany(Plan, {
        through: VendorPlan,
        foreignKey: 'payment_id',
        otherKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
