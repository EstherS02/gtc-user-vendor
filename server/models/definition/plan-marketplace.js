/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PlanMarketplace', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
        marketplace_id: {
            type: DataTypes.BIGINT,
            field: 'marketplace_id',
            allowNull: false,
            references: {
                model: 'marketplace',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
        isactive: {
            type: DataTypes.INTEGER,
            field: 'isactive',
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
        tableName: 'plan_marketplace'
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const PlanMarketplace = model.PlanMarketplace;
    const Plan = model.Plan;
    const Marketplace = model.Marketplace;

    PlanMarketplace.belongsTo(Plan, {
        foreignKey: 'plan_id'
    });

    PlanMarketplace.belongsTo(Marketplace, {
        foreignKey: 'marketplace_id'
    });

};
