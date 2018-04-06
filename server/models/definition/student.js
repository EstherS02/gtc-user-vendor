/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('student', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'first_name'
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'last_name'
    },
    age: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      field: 'age'
    }
  }, {
    tableName: 'student'
  });
};

module.exports.initRelations = () => {
    delete module.exports.initRelations; // Destroy itself to prevent repeated calls.

    const model = require('../index');
    const Student = model.Student;
    const Mark = model.Mark;

    Student.hasMany(Mark, {
        foreignKey: 'student_id'
    });

};