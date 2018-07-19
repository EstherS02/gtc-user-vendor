'use strict';

const async = require('async');
const sequelize = require('sequelize');

const service = require('../../api/service');
const model = require('../../sqldb/model-connect');
const status = require('../../config/status');
const marketplace = require('../../config/marketplace');
const marketplace_type = require('../../config/marketplace_type');
const config = require('../../config/environment');

export function index(req, res) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	var marketplaceURl = fullUrl.replace(req.url,'').replace(req.protocol + '://' + req.get('host'),'').replace('/','').trim();
   
    var selectedLocation = 0;
    var selectedMarketPlace = 0;

    var page;
    var queryURI = {};
    var includeArr = [];
    var queryParameters = {};
    var LoggedInUser = {};
    var queryPaginationObj = {};

    var offset, limit, field, order;

    if (req.user)
        LoggedInUser = req.user;
        
    offset = req.query.offset ? parseInt(req.query.offset) : 0;
	queryPaginationObj['offset'] = offset;
	delete req.query.offset;
	limit = req.query.limit ? parseInt(req.query.limit) : 12;
	queryPaginationObj['limit'] = limit;
	delete req.query.limit;
	field = req.query.field ? req.query.field : "id";
	queryPaginationObj['field'] = field;
	delete req.query.field;
	order = req.query.order ? req.query.order : "asc";
	queryPaginationObj['order'] = order;
    delete req.query.order;   
    
    page = req.query.page ? parseInt(req.query.page) : 1;
	queryPaginationObj['page'] = page;
	queryURI['page'] = page;
	delete req.query.page;

	offset = (page - 1) * limit;
	queryPaginationObj['offset'] = offset;

    if (marketplaceURl == 'wholesalers') {
        selectedMarketPlace = marketplace['WHOLESALE'];
        queryParameters['marketplace_id'] = marketplace['WHOLESALE'];
    }else if(marketplaceURl == 'retailers'){
        selectedMarketPlace = marketplace['PUBLIC'];
        queryParameters['marketplace_id'] = marketplace['PUBLIC'];
    }else if(marketplaceURl == 'services-providers'){
        selectedMarketPlace = marketplace['SERVICE'];
        queryParameters['marketplace_id'] = marketplace['SERVICE'];
    }else if(marketplaceURl == 'subscription-providers'){
        selectedMarketPlace = marketplace['LIFESTYLE'];
        queryParameters['marketplace_id'] = marketplace['LIFESTYLE'];
	}
	
	if (req.query.location) {
		selectedLocation = req.query.location;
		queryURI['location'] = req.query.location;
		queryParameters['origin_id'] = req.query.location;
	}

    queryParameters['status'] = status["ACTIVE"];

    var vendorModel = "VendorUserProduct";

    async.series({
        locations: function(callback) {
			var result = {};
			var locationQueryObj = {};
			var vendorCountQueryParames = {};

			locationQueryObj['status'] = status["ACTIVE"];

			vendorCountQueryParames['status'] = status["ACTIVE"];
			
			model['Country'].findAll({
				where: locationQueryObj,
				include: [{
					model: model['Vendor'],
					where: vendorCountQueryParames,
					attributes: ['id','base_location'],
					required: false
				}],
				attributes: ['id', 'name', 'code', [sequelize.fn('count', sequelize.col('Vendors.id')), 'vendor_count']],
				group: ['Country.id']
			}).then(function(results) {
				
				if (results.length > 0) {
					model['Vendor'].count({
						where: vendorCountQueryParames
					}).then(function(count) {
						result.count = count;
						result.rows = JSON.parse(JSON.stringify(results));

						return callback(null, result);
					}).catch(function(error) {
						console.log('Error:::', error);
						return callback(error, null);
					});
				} else {
					result.count = 0;
					result.rows = [];
					return callback(null, result);
				}
			}).catch(function(error) {
				console.log('Error:::', error);
				return callback(error, null);
			});
        },
     vendors: function(callback){
		 limit =null;
		 field ='sales_count';
		 order = 'desc';
        service.findAllRows(vendorModel, includeArr, queryParameters, offset, limit, field, order)
        .then(function(vendors) {
            return callback(null, vendors);
        })
        .catch(function(error) {
            console.log('Error:::', error);
            return callback(error, null);
        });
	 },    
    }, function(error, results) {
        queryPaginationObj['maxSize'] = 5;
        if (!error) {
			res.render('vendor-search', {
				title: "Global Trade Connect",
				queryURI:queryURI,
				queryPaginationObj: queryPaginationObj,
                locations: results.locations,
				vendors:results.vendors,
                selectedMarketPlace: results.marketPlace,
                LoggedInUser:LoggedInUser,
				marketplaceURl:marketplaceURl,
				selectedLocation:selectedLocation
            })
        }
    });
}