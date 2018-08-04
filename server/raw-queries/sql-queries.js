'use strict';

const config = require('../config/environment');


let sqlQueries = {

  geoLocateDistance: function (lat, lng) {
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
        product_media.url AS product_media_base_image,
        country.name AS country_name,
        category.name AS category_name,
        sub_category.name AS sub_category_name,
        marketplace.name AS marketplace_name,
        marketplace_type.name AS marketplace_type_name,
        (
            6371 * ACOS(
                COS(RADIANS(`+ lat +`)) * COS(RADIANS(latitude)) * COS(
                    RADIANS(longitude) - RADIANS(`+ lng +`)
                ) + SIN(RADIANS(`+ lat +`)) * SIN(RADIANS(latitude))
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
        HAVING
            distance < 60
        ORDER BY
            distance`;

    return query;
  }
};

module.exports = sqlQueries;
