/* jshint indent: 2 */

import model from '../index';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mark', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    mark1: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'mark1'
    },
    mark2: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'mark2'
    },
    mark3: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'mark3'
    },
    student_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'student',
        key: 'id'
      },
      field: 'student_id'
    }
  }, {
    tableName: 'mark'
  });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const Mark = model.Mark;
    const Student = model.Student;

    Mark.belongsTo(Student, {
        foreignKey: 'student_id'
    });

};