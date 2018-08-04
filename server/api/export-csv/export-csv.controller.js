'use strict';

const mv = require('mv');
const _ = require('lodash');
const path = require('path');
const sequelize = require('sequelize');
const service = require('../service');
const config = require('../../config/environment');
const reference = require('../../config/model-reference');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const position = require('../../config/position');
const populate = require('../../utilities/populate')
const model = require('../../sqldb/model-connect');
const async=require('async');
const Json2csvParser = require('json2csv').Parser;

// starts export csv Ad-revenue //
exports.exportcsv = function (req, res) {
  
	var offset, limit, field, order;
	var queryObj = {};
	var ids =[];
	var type = [];
	let includeArr;
	var  adType = {
		"type1" : "AD",
		"type2" : "Featured Listing",
			};
	var position ={
		 "position1" : "Wholesale Landing",
		 "position2" : "Shop Landing",
		 "position3" : "Service Landing",
		 "position4" : "Lifestyle Landing",
		 "position5" : "Directory Landing",
		 "position6" : "Profile Square",
		 "position7" : "Sign Up",
	   }

	offset = req.query.offset ? parseInt(req.query.offset) : null;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : null;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	delete req.query.order;

	if (req.query.populate)
		includeArr = populate.populateData(req.query.populate);
	else
		includeArr = [];

	delete req.query.populate;
	if (queryObj.startDate && queryObj.endDate) {
		if (queryObj.columnName) {
			queryObj[queryObj.columnName] = {
				'$gte': new Date(parseInt(queryObj.startDate)),
				'$lte': new Date(parseInt(queryObj.endDate))
			}
			delete queryObj.columnName;
		}
		delete queryObj.startDate;
		delete queryObj.endDate;
	}

	if (!queryObj.status) {
		queryObj['status'] = {
			'$ne': status["DELETED"]
		}
	} else {
		if (queryObj.status == status["DELETED"]) {
			queryObj['status'] = {
				'$eq': status["DELETED"]
			}
		}
	}
	req.endpoint = "AdFeaturedproduct";
	ids =req.query.id;
	type =req.query.type;
	if(ids != '')
	{
		queryObj['id'] = JSON.parse("[" + ids + "]");
		queryObj['type'] = JSON.parse("[" + type + "]");
		service.findAllRows(req.endpoint, includeArr, queryObj, 0, null, field, order)
	    .then(function (rows) {
		 for(let value of rows.rows)
			 {
				if(value.type == 1) 
				 {
					value.type = adType.type1;
				 }
				 else
				 {
					 value.type = adType.type2;
				 }
				 if(value.position==1)
				 {
					value.position = position.position1;
				 }
				 else if(value.position==2)
				 {
					value.position = position.position2;
				 }
				 else if(value.position==3)
				 {
					value.position = position.position3;
				 }
				 else if(value.position==4)
				 {
					value.position = position.position4;
				 }
				 else if(value.position==5)
				 {
					value.position = position.position5;
				 }
				 else if(value.position==6)
				 {
					value.position = position.position6;
				 }
				 else if(value.position==7)
				 {
					value.position = position.position7;
				 }
				  
				 if(value.clicks!="null" && value.impression!="null")
				 {
					value.CTR = ((value.clicks/value.impression)*100).toFixed(2)+"%";
				 }
				 else
				 {
                    value.CTR = 0+"%";  
				 }
			 }
			var fields = [];
			fields = _.map(rows.rows.columns, 'columnName');
			fields.push('product_name','type','position','start_date','end_date','impression','clicks','CTR');
			const opts = {
					fields
			};
			const parser = new Json2csvParser(opts);
			const csv = parser.parse(rows.rows);
			res.write(csv);
			res.end();
			return;
		}).catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
	}
	else
	{
	service.getAllFindRow(req.endpoint,includeArr, queryObj, field, order)
		.then(function (rows) {
              for(let value of rows.rows)
			 {
				 if(value.type == 1) 
				 {
					value.type = adType.type1;
				 }
				 else
				 {
					 value.type = adType.type2;
				 }
				 if(value.position==1)
				 {
					value.position = position.position1;
				 }
				 else if(value.position==2)
				 {
					value.position = position.position2;
				 }
				 else if(value.position==3)
				 {
					value.position = position.position3;
				 }
				 else if(value.position==4)
				 {
					value.position = position.position4;
				 }
				 else if(value.position==5)
				 {
					value.position = position.position5;
				 }
				 else if(value.position==6)
				 {
					value.position = position.position6;
				 }
				 else if(value.position==7)
				 {
					value.position = position.position7;
				 }
				 if(value.clicks!=null && value.impression!=null)
				 {
					value.CTR = ((value.clicks/value.impression)*100).toFixed(2)+"%";
				 }
				 else if((value.clicks ==null) && (value.impression ==null))
				 { 
                    value.CTR = 0+"%";  
				 }
			 }
			var fields = [];
			fields = _.map(rows.rows.columns, 'columnName');
			fields.push('product_name','type','position','start_date','end_date','impression','clicks','CTR');
			const opts = {
					fields
			};
			const parser = new Json2csvParser(opts);
			const csv = parser.parse(rows.rows);
			res.write(csv);
			res.end();
			return;
		}).catch(function (error) {
			console.log('Error :::', error);
			res.status(500).send("Internal server error");
			return
		});
	}
};
// starts export csv Ad-revenue //
