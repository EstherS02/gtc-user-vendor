/* eslint new-cap: "off", global-require: "off" */

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserPlan', {
        id: {
            type: DataTypes.BIGINT,
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
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
		payment_id: {
            type: DataTypes.BIGINT,
            field: 'payment_id',
            allowNull: true,
            references: {
                model: 'payment',
                key: 'id'
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION'
        },
		start_date: {
            type: DataTypes.DATEONLY,
            field: 'start_date',
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            field: 'end_date',
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            field: 'status',
            allowNull: false
		},
		auto_renewal: {
            type: DataTypes.INTEGER,
            field: 'auto_renewal',
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
        tableName: 'user_plan',
        timestamps: false
    });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const UserPlan = model.UserPlan;
    const User = model.User;
	const Plan = model.Plan;
    const Payment = model.Payment;
  	
	UserPlan.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    UserPlan.belongsTo(Plan, {
        foreignKey: 'plan_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

    UserPlan.belongsTo(Payment, {
        foreignKey: 'payment_id',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION'
    });

 
};
