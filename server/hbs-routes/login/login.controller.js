'use strict';

export function index(req, res) {
	
	var LoggedInUser = {};

	if(req.gtcGlobalUserObj && req.gtcGlobalUserObj.isAvailable){
		LoggedInUser = req.gtcGlobalUserObj;
		
		res.redirect('/')
	}else{
		res.render('login', {
			title: "Global Trade Connect",
			LoggedInUser: LoggedInUser
		});
	}
}