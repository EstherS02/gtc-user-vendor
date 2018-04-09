var sendRsp = function sendRsp(res, status, msg, output) {
	output = output ? output : {};
	var meta = {};
	meta.status = status;
	meta.msg = msg;

	res.statusCode = status;
	res.send({
		meta: meta,
		response: output
	});
};

module.exports.sendRsp = sendRsp;