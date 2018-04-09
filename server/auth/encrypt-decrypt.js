import config from '../config/environment';
import crypto from 'crypto';
var algorithm = 'aes-256-cbc';

exports.encrypt = function(text) {
	var cipher = crypto.createCipher(algorithm, config.secrets.refTokenKey);
	var crypted = cipher.update(text, 'utf8', 'base64');
	crypted += cipher.final('base64');
	return crypted;
};

exports.decrypt = function(text) {
	var decipher = crypto.createDecipher(algorithm, config.secrets.refTokenKey);
	var dec = decipher.update(text, 'base64', 'utf8');
	dec += decipher.final('utf8');
	return dec;
};