const sequelize = require('sequelize');
const model = require('../../sqldb/model-connect');
const config = require('../../config/environment');
const statusCode = require('../../config/status');
const service = require('../service');
const orderStatus = require('../../config/order_status');
const paymentType = require('../../config/order-payment-type');
const moment = require('moment');
const _ = require('lodash');
const stripe = require('../../payment/stripe.payment');
const sendEmail = require('../../agenda/send-email');
const populate = require('../../utilities/populate');
const paymentMethod = require('../../config/payment-method');
const escrowAction = require('../../config/escrow-action');

const CURRENCY = 'usd';

export function subscription(req, res) {

	


}

