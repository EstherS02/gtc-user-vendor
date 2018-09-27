const service = require('../api/service');
const sequelize = require('sequelize');
const model = require('../sqldb/model-connect');

module.exports = function (job, done) {
    console.log("**********JOBS CALLED")
    console.log('agenda validate Coupon Expiry date initialize..');

    const Op = sequelize.Op;
    var couponModel = 'Coupon';

    model[couponModel].update({
        status: 2
    }, {
            where: {
                "expiry_date": {
                    [Op.lt]: new Date(),
                }
            }
        }).then(function () {
            done();
        }).catch(function (error) {
            console.log("Error", error);
            done();
        });
}