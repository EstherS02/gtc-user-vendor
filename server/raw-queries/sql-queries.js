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
	compareProductQuery: function(params) {
	    let query = `SELECT product.id, product.product_name,product.marketplace_type_id,product.marketplace_id,product.sku, product.product_slug, product.vendor_id, product.status,product.sub_category_id, product.publish_date, product.quantity_available, product.price, product.description, product.moq, vendor.user_id, vendor.vendor_name, product_media.url,users.first_name, COALESCE(COUNT(reviews.user_id), 0) AS 'user_count', COALESCE(AVG(reviews.rating), 0) AS 'product_rating' FROM product LEFT JOIN vendor ON vendor.id = product.vendor_id LEFT JOIN product_media ON product_media.product_id = product.id LEFT JOIN reviews ON reviews.product_id = product.id LEFT JOIN users on users.id=vendor.user_id  WHERE product.id IN(` + params + `) GROUP BY product.id`;
	    return query;
    },
      
	countryCountForVendor:function(params){
		let query=`SELECT country.id,country.name,country.code,COUNT(vendor_user_product.origin_id) as vendor_count from country LEFT OUTER JOIN vendor_user_product on country.id= vendor_user_product.origin_id and vendor_user_product.status = 1 and vendor_user_product.marketplace_id=(` + params.marketplace_id + `)  GROUP BY country.name`;
		return query;
	},
	countryCountForVendorHomepage:function(){
		let query=`SELECT country.id,country.name,country.code,COUNT(vendor_user_product.origin_id) as vendor_count from country LEFT OUTER JOIN vendor_user_product on country.id= vendor_user_product.origin_id and vendor_user_product.status = 1 GROUP BY country.name`;
		return query;
	},
	vendorCountByMarkerplace:function(){
		let query=`SELECT marketplace.id,marketplace.name,COUNT(vendor_user_product.marketplace_id) as vendor_count from marketplace LEFT OUTER JOIN vendor_user_product on marketplace.id= vendor_user_product.marketplace_id and vendor_user_product.status = 1 GROUP BY marketplace.id`;
		return query;
	},
	productCountBasedCategory:function(productCountQueryParams){
		if(productCountQueryParams.marketplace_id && productCountQueryParams.product_category_id && productCountQueryParams.sub_category_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)  and product.product_category_id = (` + productCountQueryParams.product_category_id + `) and product.sub_category_id = (` + productCountQueryParams.sub_category_id + `)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}
		else if( productCountQueryParams.marketplace_id && productCountQueryParams.marketplace_type_id && !productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)  and product.marketplace_type_id = (` + productCountQueryParams.marketplace_type_id + `) and product.status = (` + productCountQueryParams.status + `)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}else if( productCountQueryParams.marketplace_id && productCountQueryParams.marketplace_type_id && productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)  and product.marketplace_type_id = (` + productCountQueryParams.marketplace_type_id + `) and product.status = (` + productCountQueryParams.status + `) and product.vendor_id=(`+productCountQueryParams.vendor_id+`)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}else if( productCountQueryParams.marketplace_id && productCountQueryParams.keyword){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `)  and product.product_name LIKE "%`+ productCountQueryParams.keyword+`%" and product.status=(`+productCountQueryParams.status+`)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}
		else if(productCountQueryParams.keyword){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id and product.product_name LIKE "%`+ productCountQueryParams.keyword+`%" and product.status=(`+productCountQueryParams.status+`)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}else if(productCountQueryParams.marketplace_id && productCountQueryParams.is_featured_product){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(featured_product.product_id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id 
            LEFT OUTER JOIN featured_product on featured_product.product_id=product.id AND product.marketplace_id =(`+ productCountQueryParams.marketplace_id+`) and product.status = 1 and featured_product.status=(`+productCountQueryParams.is_featured_product+`)
			GROUP BY sub_category.name ORDER by category.name`;
			return query;
		}else if(productCountQueryParams.marketplace_id && !productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id =(` + productCountQueryParams.marketplace_id + `) and product.status = (` + productCountQueryParams.status + `)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}else if(productCountQueryParams.is_featured_product){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(featured_product.product_id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id 
            LEFT OUTER JOIN featured_product on featured_product.product_id=product.id AND product.status = 1 and featured_product.status=(`+productCountQueryParams.is_featured_product+`)
			GROUP BY sub_category.id ORDER by category.name`;
			return query;
		}else if(productCountQueryParams.product_category_id && !productCountQueryParams.vendor_id && !productCountQueryParams.sub_category_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.product_category_id=(`+productCountQueryParams.product_category_id+`)
			GROUP BY sub_category.id ORDER by category.name`
			return query;
		}else if(productCountQueryParams.product_category_id && productCountQueryParams.sub_category_id && !productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.product_category_id=(`+productCountQueryParams.product_category_id+`) and product.sub_category_id=(`+productCountQueryParams.sub_category_id+`) and product.status=(`+productCountQueryParams.status+`)
			GROUP BY sub_category.id ORDER by category.name`
			return query;
		}
		else if(productCountQueryParams.marketplace_id && productCountQueryParams.product_category_id && productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.marketplace_id=(`+productCountQueryParams.marketplace_id+`) and product.product_category_id=(`+productCountQueryParams.product_category_id+`) and product.vendor_id=(`+productCountQueryParams.vendor_id+`) and product.status=(`+productCountQueryParams.status+`)
			GROUP BY sub_category.id ORDER by category.name`
			return query;
		}
		else if(productCountQueryParams.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.product_name) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id  AND product.product_category_id=(`+productCountQueryParams.product_category_id+`) and product.sub_category_id=(`+productCountQueryParams.sub_category_id+`) AND product.vendor_id=(`+productCountQueryParams.vendor_id+`) AND product.marketplace_id=(`+productCountQueryParams.marketplace_id+`) and product.status=1
			GROUP BY sub_category.id ORDER by category.name`
			return query;
		}
		else{
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id and product.status=1
			GROUP BY sub_category.id ORDER by RAND()`;
			return query;
		}
	},
	productViewAndReviewCategoryCount:function(queryObj, productQueryObj){
		if(queryObj.status && productQueryObj.vendor_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id and product.status=(`+queryObj.status+`) and product.vendor_id=(`+productQueryObj.vendor_id+`)
			GROUP BY sub_category.id ORDER by category.id`;
			return query;
		}
	},
	vendorFilterCatogoryCount:function(params){
		console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^666",params)
		if(params.vendor_id && params.marketplace_id && !params.marketplace_type_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.vendor_id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id and product.status=(`+params.status+`) and product.marketplace_id=(`+params.marketplace_id+`) and product.vendor_id=(`+params.vendor_id+`)
			GROUP BY sub_category.id ORDER by category.id`;
			return query;
		}
		else if(params.vendor_id && params.marketplace_id && params.marketplace_type_id){
			let query=`SELECT category.id as categoryid,category.name as categoryname,sub_category.id as subcategoryid ,sub_category.name as subcategoryname ,COUNT(product.vendor_id) as subproductcount FROM 
			category RIGHT OUTER JOIN sub_category on category.id = sub_category.category_id
			LEFT OUTER JOIN product on sub_category.id = product.sub_category_id and product.status=(`+params.status+`) and product.marketplace_id=(`+params.marketplace_id+`) and product.vendor_id=(`+params.vendor_id+`)
			GROUP BY sub_category.id ORDER by category.id`;
		return query;
		}
		
	}
};

module.exports = sqlQueries;