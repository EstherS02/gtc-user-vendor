'use strict';

const config = require('../config/environment');


let sqlQueries = {

    geoLocateDistance: function(lat, lng) {
        //Distance in Miles = 3959, Distance in Kilometers = 6371
        let query = `SELECT
    vendor.id AS vendor_id,
    vendor.vendor_name,
    vendor.vendor_cover_pic_url,
    vendor.vendor_profile_pic_url,
    vendor.latitude,
    vendor.longitude,
    product.product_name,
    product.id AS product_id,
    product.product_slug AS product_slug,
    product_media.url AS product_media_base_image,
    country.name AS country_name,
    category.name AS category_name,
    sub_category.name AS sub_category_name,
    marketplace.id AS marketplace_id,
    marketplace.name AS marketplace_name,
    marketplace_type.name AS marketplace_type_name,
    COALESCE(product_ratings.product_rating, 0) AS product_rating,
    (
        6371 * ACOS(
            COS(RADIANS(` + lat + `)) * COS(RADIANS(latitude)) * COS(
                RADIANS(longitude) - RADIANS(` + lng + `)
            ) + SIN(RADIANS(` + lat + `)) * SIN(RADIANS(latitude))
        )
    ) AS distance
    FROM
        vendor
    LEFT JOIN product ON vendor.id = product.vendor_id
    LEFT JOIN product_media ON product.id = product_media.product_id AND product_media.base_image = 1
    LEFT JOIN country ON product.product_location = country.id
    LEFT JOIN category ON product.product_category_id = category.id
    LEFT JOIN sub_category ON product.sub_category_id = sub_category.id
    LEFT JOIN marketplace ON product.marketplace_id = marketplace.id
    LEFT JOIN marketplace_type ON product.marketplace_type_id = marketplace_type.id
    LEFT JOIN product_ratings ON product.id = product_ratings.product_id
    HAVING
        distance < 300
    ORDER BY
        product.product_name`;

        return query;
    },
    categoryAndSubcategoryCount: function() {
        let query = `SELECT
    product_category_id,
    sub_category_id,
    category.name AS category_name,
    sub_category.name AS sub_category_name,
        (SELECT 
                COUNT(*)
            FROM
                product
            WHERE
                product_category_id = P.product_category_id) AS categoryCount, P.subCategoryCount
    FROM
        (SELECT 
            product_category_id,
                sub_category_id,
                COUNT(*) AS subCategoryCount
        FROM
            product
        GROUP BY product_category_id , sub_category_id) P
        
    LEFT JOIN category ON category.id = product_category_id
    LEFT JOIN sub_category ON sub_category.id = sub_category_id;`;

        return query;
    },
    locationCount: function() {
        let query = `SELECT 
        COUNT(*) AS location_count,
        product.id AS product_id,
        country.name As country_name,
        region.name As region_name,
        product_location
    FROM
        product

    LEFT JOIN country ON country.id = product.product_location
    LEFT JOIN region ON region.id = country.region_id
    GROUP BY product_location;`;

		return query;
	},
	productGlobalCountsQuery: function(params) {
		let query = `SELECT COUNT(product.id) AS productCount FROM  product LEFT OUTER JOIN vendor ON product.vendor_id = vendor.id LEFT OUTER JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id WHERE product.status = 1 AND vendor.status = 1 AND vendor_plan.status = 1 AND vendor_plan.start_date <='`+new Date().toISOString().slice(0,10)+`' AND vendor_plan.end_date >= '`+new Date().toISOString().slice(0,10)+`'` ;
		return query;
	},
	activeVendorcountsQuery: function(params) {
		let query = `SELECT COUNT(vendor.id) AS vendorCount FROM vendor LEFT OUTER JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id where vendor.status = 1 AND vendor_plan.status = 1 AND vendor_plan.start_date <='`+new Date().toISOString().slice(0,10)+`' AND vendor_plan.end_date >= '`+new Date().toISOString().slice(0,10)+`'` ;
		return query;
	},
	compareProductQuery: function(params) {
		let query = `SELECT product.id, product.product_name,product.marketplace_type_id,product.marketplace_id,product.sku, product.product_slug, product.vendor_id, product.status,product.sub_category_id, product.publish_date, product.quantity_available, product.price, product.description, product.moq, vendor.user_id, vendor.vendor_name, product_media.url,users.first_name, COALESCE(COUNT(reviews.user_id), 0) AS 'user_count', COALESCE(AVG(reviews.rating), 0) AS 'product_rating' FROM product LEFT JOIN vendor ON vendor.id = product.vendor_id LEFT JOIN product_media ON product_media.product_id = product.id LEFT JOIN reviews ON reviews.product_id = product.id LEFT JOIN users on users.id=vendor.user_id  WHERE product.id IN(` + params + `) GROUP BY product.id`;
		return query;
	},
	countryCountForVendor: function(params) {
		if (params.marketplace_id) {
			let query = `SELECT region.id as regionid,region.name as regionname,country.id as countryid,country.name as countryname,COUNT(vendor_user_product.id) as productcount FROM country RIGHT OUTER JOIN region on country.region_id = region.id LEFT OUTER JOIN vendor_user_product on country.id = vendor_user_product.origin_id and vendor_user_product.marketplace_id=(` + params.marketplace_id + `) and vendor_user_product.status=1 GROUP BY country.name ORDER by region.id`;
			return query;
		} else {
			let query = `SELECT region.id as regionid,region.name as regionname,country.id as countryid,country.name as countryname,COUNT(vendor_user_product.id) as productcount FROM country RIGHT OUTER JOIN region on country.region_id = region.id LEFT OUTER JOIN vendor_user_product on country.id = vendor_user_product.origin_id and vendor_user_product.status=1 GROUP BY country.name ORDER by region.id`;
			return query;
		}
	},
	countryCountForVendorHomepage: function() {
		let query = `SELECT region.id as regionid,region.name as regionname,country.id as countryid,country.name as countryname,COUNT(vendor_user_product.id) as productcount FROM country RIGHT OUTER JOIN region on country.region_id = region.id LEFT OUTER JOIN vendor_user_product on country.id = vendor_user_product.origin_id and vendor_user_product.status=1 GROUP BY country.name ORDER by region.id`;
		return query;
	},
	vendorCountByMarkerplace: function(params) {
		var query = '';
		if (params.marketplace_id) {
			query = query + `SELECT marketplace.id,marketplace.name,COUNT(vendor_user_product.marketplace_id) as vendor_count from marketplace LEFT OUTER JOIN vendor_user_product on marketplace.id= vendor_user_product.marketplace_id and vendor_user_product.status = 1 and vendor_user_product.marketplace_id = 1 GROUP BY marketplace.id`;
		}else{
		query = query + `SELECT marketplace.id,marketplace.name,COUNT(vendor_user_product.marketplace_id) as vendor_count from marketplace LEFT OUTER JOIN vendor_user_product on marketplace.id= vendor_user_product.marketplace_id and vendor_user_product.status = 1 GROUP BY marketplace.id`;
		}
		return query;
	},
	productCountBasedCategory: function(productCountQueryParams) {
		let baseQuery = "SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '"+new Date().toISOString().slice(0,10)+"' AND vendor_plan.end_date >= '"+new Date().toISOString().slice(0,10)+"') on sub_category.id = product.sub_category_id";
		let groupQuery = "GROUP BY sub_category.id ORDER by category.name,sub_category.id ASC"
		if (productCountQueryParams.is_featured_product) {
			let query = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(featured_product.product_id) as subproductcount FROM 
				category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
				LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') on sub_category.id = product.sub_category_id 
			    LEFT OUTER JOIN featured_product on featured_product.product_id=product.id AND featured_product.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND featured_product.end_date >= '` + new Date().toISOString().slice(0, 10) + `' and featured_product.status=(` + productCountQueryParams.is_featured_product + `)`;
            if (productCountQueryParams.marketplace_id) {
                query = query + ` AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)`;
            }
            if (productCountQueryParams.product_category_id) {
                query = query + ` AND product.product_category_id =(` + productCountQueryParams.product_category_id + `)`;
            }
            if (productCountQueryParams.start_date && productCountQueryParams.end_date) {
                baseQuery = baseQuery + `and product.created_on >='` + productCountQueryParams.start_date + `' and product.created_on <= '` + productCountQueryParams.end_date + `' `;
            }
            query = query + ` and product.status = 1 GROUP BY sub_category.name ORDER by category.name,sub_category.id ASC`;
            return query;
        } else if (productCountQueryParams.marketplace_id && productCountQueryParams.keyword) {
            let query = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
				category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
				LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)  and product.product_name LIKE "%` + productCountQueryParams.keyword + `%" and product.status=(` + productCountQueryParams.status + `)
				GROUP BY sub_category.id ORDER by category.name,sub_category.id ASC`;
            return query;
        } else if (productCountQueryParams.keyword) {
            let query = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
				category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
				LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') on sub_category.id = product.sub_category_id and product.product_name LIKE "%` + productCountQueryParams.keyword + `%" and product.status=(` + productCountQueryParams.status + `)
				GROUP BY sub_category.id ORDER by category.name,sub_category.id ASC`;
            return query;
        } else {
            for (var j in productCountQueryParams) {
                var condition = " AND " + "product." + j + " = " + productCountQueryParams[j]
                baseQuery = baseQuery.concat(condition)
            }
            let query = baseQuery + " " + groupQuery;
            return query;
        }
    },
    productViewAndReviewCategoryCount: function(queryObj, productQueryObj) {
        if (queryObj.status && productQueryObj.vendor_id) {
            let query = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') on sub_category.id = product.sub_category_id and product.status=(` + queryObj.status + `) and product.vendor_id=(` + productQueryObj.vendor_id + `) and product.marketplace_id = (` + productQueryObj.marketplace_id + `)
			GROUP BY sub_category.id ORDER by category.id,sub_category.id ASC`;
            return query;
        } else {
            let query = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') on sub_category.id = product.sub_category_id and product.status=(` + queryObj.status + `) 
			GROUP BY sub_category.id ORDER by category.id,sub_category.id ASC`;
            return query;
        }
    },
    vendorFilterCatogoryCount: function(params) {
        let baseQuery = `SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.vendor_id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN (product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '`+ new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `')  on sub_category.id = product.sub_category_id`;
        let groupQuery = `GROUP BY sub_category.id ORDER by category.id`;
        for (var j in params) {
            var condition = " AND " + "product." + j + " = " + params[j]
            baseQuery = baseQuery.concat(condition)
        }
        let query = baseQuery + " " + groupQuery;
        return query;
    },
    productCountBasedCountry: function(productCountQueryParams) {
        let baseQuery = `SELECT region.id as regionid,region.name as regionname, region.status as regionstatus,country.id as countryid,country.name as countryname,COUNT(product.id) as productcount FROM country RIGHT OUTER JOIN region on country.region_id = region.id LEFT OUTER JOIN ((product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '` + new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') `
        let conditionQuery = ` on country.id = product.product_location`;
        let groupQuery = "  where  region.status=1 GROUP BY country.name ORDER by region.id,country.name ASC"
        if (productCountQueryParams.is_featured_product) {
            baseQuery = baseQuery + ` JOIN featured_product on featured_product.product_id=product.id AND featured_product.status = 1 AND featured_product.start_date <= '` + new Date().toISOString().slice(0, 10) + `' AND featured_product.end_date >= '` + new Date().toISOString().slice(0, 10) + `')`;
            delete productCountQueryParams.is_featured_product;
        } else {
            baseQuery = baseQuery + `)`;
        }
        baseQuery = baseQuery + conditionQuery;
        if (productCountQueryParams.keyword) {
            baseQuery = baseQuery + ` and product.product_name LIKE "%` + productCountQueryParams.keyword + `%"`;
            delete productCountQueryParams.keyword;
        }
        if (productCountQueryParams.start_date && productCountQueryParams.end_date) {
            baseQuery = baseQuery + ` and product.created_on >='` + productCountQueryParams.start_date + `' and product.created_on <= '` + productCountQueryParams.end_date + `' `;
            delete productCountQueryParams.start_date;
            delete productCountQueryParams.end_date;
        }
        for (var j in productCountQueryParams) {
            var condition = " AND " + "product." + j + " = " + productCountQueryParams[j]
            baseQuery = baseQuery.concat(condition)
        }
        let query = baseQuery + " " + groupQuery;
        return query;
    },
    productCountBasedMarketplace: function(productCountBasedQueryParams) {
        var baseQuery = `SELECT marketplace_type.id,marketplace_type.name,marketplace_type.code,COUNT(product.product_name) as product_count FROM marketplace_type LEFT OUTER JOIN  ((product JOIN vendor ON product.vendor_id = vendor.id AND vendor.status = 1 JOIN vendor_plan ON vendor.id = vendor_plan.vendor_id AND vendor_plan.status = 1 AND vendor_plan.start_date <= '` + new Date().toISOString().slice(0, 10) + `' AND vendor_plan.end_date >= '` + new Date().toISOString().slice(0, 10) + `') `;
        var conditionQuery = ` on marketplace_type.id = product.marketplace_type_id`;
        var groupQuery = ` GROUP BY marketplace_type.id ORDER by marketplace_type.id`;
        if (productCountBasedQueryParams.is_featured_product == 1) {
            baseQuery = baseQuery + ` JOIN featured_product on featured_product.product_id=product.id AND featured_product.status = 1 AND featured_product.start_date <= '` + new Date().toISOString().slice(0, 10) + `' AND featured_product.end_date >= '` + new Date().toISOString().slice(0, 10) + `')`;
            delete productCountBasedQueryParams.is_featured_product
        } else {
            baseQuery = baseQuery + `)`;
        }
        baseQuery = baseQuery + conditionQuery;
        if (productCountBasedQueryParams.keyword) {
            baseQuery = baseQuery + ` AND product.product_name LIKE "%` + productCountBasedQueryParams.keyword + `%"`;
            delete productCountBasedQueryParams.keyword
        }
        if (productCountBasedQueryParams.start_date && productCountBasedQueryParams.end_date) {
            baseQuery = baseQuery + `and product.created_on >='` + productCountBasedQueryParams.start_date + `' and product.created_on <= '` + productCountBasedQueryParams.end_date + `' `;
            delete productCountBasedQueryParams.start_date;
            delete productCountBasedQueryParams.end_date;
        }
        for (var j in productCountBasedQueryParams) {
            var condition = " AND " + "product." + j + " = " + productCountBasedQueryParams[j]
            baseQuery = baseQuery.concat(condition)
        }
        let query = baseQuery + " " + groupQuery;
        return query;
    },
    userBuyerCount: function(params) {
        let query = `SELECT
                COUNT(order_item.product_id) AS count
            FROM
                order_item
            RIGHT JOIN \`order\` ON order_item.order_id = \`order\`.id
            LEFT JOIN product ON order_item.product_id = product.id
            WHERE
                product.marketplace_id = `+params+`
            GROUP BY
                MONTH(\`order\`.ordered_date)
            ORDER BY
                MONTH(\`order\`.ordered_date)`;
        return query;
    }
};

module.exports = sqlQueries;