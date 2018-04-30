/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PlanLimit', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true
        },
        plan_id: {
            type: DataTypes.BIGINT,
            field: 'plan_id',
            allowNull: false,
            references: {
                model: 'plan',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        maximum_product: {
            type: DataTypes.INTEGER,
            field: 'maximum_product',
            allowNull: true
        },
        maximum_subscription: {
            type: DataTypes.INTEGER,
            field: 'maximum_subscription',
            allowNull: true
        },
        transaction_per_month: {
            type: DataTypes.INTEGER,
            field: 'transaction_per_month',
            allowNull: true
        },
        advertising_access: {
            type: DataTypes.INTEGER,
            field: 'advertising_access',
            allowNull: true
        },
        buyer_network_access: {
            type: DataTypes.INTEGER,
            field: 'buyer_network_access',
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
        tableName: 'plan_limit',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const PlanLimit = model.PlanLimit;
    const Plan = model.Plan;

    PlanLimit.belongsTo(Plan, {
        as: 'Plan',
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

};
