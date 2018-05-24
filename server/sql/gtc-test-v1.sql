CREATE VIEW `product_sales_rating` AS
    SELECT 
        `product`.`id` AS `id`,
        `product`.`product_name` AS `product_name`,
        `vendor`.`vendor_name` AS `vendor_name`,
        `users`.`first_name` AS `owner_name`,
        `marketplace`.`name` AS `marketplace`,
        `marketplace_type`.`name` AS `marketplace_type`,
        `product`.`price` AS `price`,
        `product`.`moq` AS `moq`,
        `product_media`.`url` AS `url`,
        `country`.`name` AS `origin`,
        `category`.`name` AS `category`,
        `sub_category`.`name` AS `sub_category`,
        `product`.`publish_date` AS `publish_date`,
        `product`.`sku` AS `sku`,
        `product`.`status` AS `status`,
        `product`.`quantity_available` AS `quantity_available`,
        `product`.`description` AS `description`,
        `product`.`city` AS `city`,
        `product`.`product_slug` AS `product_slug`,
        (SELECT
               COALESCE(SUM(`order_items`.`quantity`),0)
            FROM `order_items`
            WHERE 
                (`order_items`.`product_id` = `product`.`id`)) AS `sales_count`,
        (SELECT 
                COALESCE(AVG(`reviews`.`rating`),0)
            FROM
                `reviews`
            WHERE
                (`reviews`.`product_id` = `product`.`id`)) AS `rating`,
        `product`.`created_by` AS `created_by`,
        `product`.`created_on` AS `created_on`,
        `product`.`last_updated_by` AS `last_updated_by`,
        `product`.`last_updated_on` AS `last_updated_on`,
        `product`.`deleted_at` AS `deleted_at`
    FROM
        (((((((`product`
        LEFT JOIN `product_media` ON ((`product_media`.`id` = `product`.`product_media_id`)))
        LEFT JOIN (`vendor`
        JOIN `users` ON ((`users`.`id` = `vendor`.`user_id`))) ON ((`product`.`vendor_id` = `vendor`.`id`)))
        LEFT JOIN `marketplace` ON ((`product`.`marketplace_id` = `marketplace`.`id`)))
        LEFT JOIN `marketplace_type` ON ((`product`.`marketplace_type_id` = `marketplace_type`.`id`)))
        LEFT JOIN `category` ON ((`category`.`id` = `product`.`product_category_id`)))
        LEFT JOIN `sub_category` ON ((`sub_category`.`id` = `product`.`sub_category_id`)))
        LEFT JOIN `country` ON ((`country`.`id` = `product`.`product_location`)))



CREATE VIEW `subscription_sales` AS
    SELECT 
        COALESCE(COUNT(`order_items`.`product_id`),
                0) AS `sales_count`,
        `subscription`.`id` AS `id`,
        `product`.`product_name` AS `product_name`,
        `vendor`.`vendor_name` AS `vendor_name`,
        `users`.`first_name` AS `owner_name`,
        `product`.`publish_date` AS `publish_date`,
        `product`.`sku` AS `sku`,
        `subscription`.`status` AS `status`,
        `subscription`.`created_by` AS `created_by`,
        `subscription`.`created_on` AS `created_on`,
        `subscription`.`last_updated_by` AS `last_updated_by`,
        `subscription`.`last_updated_on` AS `last_updated_on`,
        `subscription`.`deleted_at` AS `deleted_at`
    FROM
        `subscription`
        LEFT JOIN `product`
            LEFT JOIN `order_items` ON `product`.`id` =`order_items`.`product_id`
            LEFT JOIN `vendor`
                INNER JOIN `users` ON `users`.`id` = `vendor`.`user_id`
                ON `product`.`vendor_id` =`vendor`.`id`
            ON `subscription`.`product_id`=`product`.`id` 

    GROUP BY 
       `order_items`.`product_id`,
       `subscription`.`id`,
       `product`.`product_name`, 
       `vendor`.`vendor_name`, 
       `users`.`first_name`,
       `product`.`publish_date`,
       `product`.`sku`, 
       `subscription`.`status`,
       `subscription`.`created_by`,
       `subscription`.`created_on`,
       `subscription`.`last_updated_by`,
       `subscription`.`last_updated_on`,
       `subscription`.`deleted_at`;



ALTER TABLE `gtc-test`.`announcement` 
ADD COLUMN `visible_to_retailer` SMALLINT(6) NULL AFTER `visible_to_wholesaler`;



ALTER TABLE `gtc-test`.`featured_product` 
ADD UNIQUE INDEX `product_id_UNIQUE` (`product_id` ASC);



CREATE VIEW `featuredproduct_sales_rating` AS
    SELECT 
        `featured_product`.`id` AS `id`,
        `featured_product`.`product_id` AS `product_id`,
        `product_sales_rating`.`product_name` AS `product_name`,
        `product_sales_rating`.`vendor_name` AS `vendor_name`,
        `product_sales_rating`.`owner_name` AS `owner_name`,
        `product_sales_rating`.`marketplace` AS `marketplace`,
        `product_sales_rating`.`marketplace_type` AS `marketplace_type`,
        `product_sales_rating`.`price` AS `price`,
        `product_sales_rating`.`moq` AS `moq`,
        `product_sales_rating`.`url` AS `url`,
        `product_sales_rating`.`origin` AS `origin`,
        `product_sales_rating`.`category` AS `category`,
        `product_sales_rating`.`sub_category` AS `sub_category`,
        `product_sales_rating`.`publish_date` AS `publish_date`,
        `product_sales_rating`.`sku` AS `sku`,
        `product_sales_rating`.`quantity_available` AS `quantity_available`,
        `product_sales_rating`.`description` AS `description`,
        `product_sales_rating`.`city` AS `city`,
        `product_sales_rating`.`sales_count` AS `sales_count`,
        `product_sales_rating`.`rating` AS `rating`,
        `featured_product`.`position` AS `position`,
        `featured_product`.`start_date` AS `start_date`,
        `featured_product`.`end_date` AS `end_date`,
        `featured_product`.`status` AS `status`,
        `featured_product`.`impression` AS `impression`,
        `featured_product`.`clicks` AS `clicks`,
        `featured_product`.`created_by` AS `created_by`,
        `featured_product`.`created_on` AS `created_on`,
        `featured_product`.`last_updated_by` AS `last_updated_by`,
        `featured_product`.`last_updated_on` AS `last_updated_on`,
        `featured_product`.`deleted_at` AS `deleted_at`
            
    FROM
        `featured_product`
        LEFT JOIN `product_sales_rating` ON `featured_product`.`product_id` =`product_sales_rating`.`id`

    GROUP BY
       `featured_product`.`id` , 
       `product_sales_rating`.`product_name`,
       `product_sales_rating`.`vendor_name`,
       `product_sales_rating`.`owner_name`,
       `product_sales_rating`.`marketplace`,
       `product_sales_rating`.`marketplace_type`,
       `product_sales_rating`.`price`,
       `product_sales_rating`.`moq`,
       `product_sales_rating`.`url`,
       `product_sales_rating`.`origin`,
       `product_sales_rating`.`category`,
       `product_sales_rating`.`sub_category`,
       `product_sales_rating`.`publish_date`,
       `product_sales_rating`.`sku`,
       `product_sales_rating`.`quantity_available`,
       `product_sales_rating`.`description`,  
       `product_sales_rating`.`city`,
       `product_sales_rating`.`sales_count`, 
       `product_sales_rating`.`rating`,
       `featured_product`.`position`,
       `featured_product`.`start_date`,
       `featured_product`.`end_date`,
       `featured_product`.`status`,
       `featured_product`.`impression`,
       `featured_product`.`clicks`,
       `featured_product`.`created_by`,
       `featured_product`.`created_on`,
       `featured_product`.`last_updated_by`,
       `featured_product`.`last_updated_on`,
       `featured_product`.`deleted_at`;



ALTER TABLE `gtc-test`.`currency` 
CHANGE COLUMN `symbol` `symbol` TEXT NOT NULL ;

ALTER TABLE `gtc-test`.`product_ads_setting` 
CHANGE COLUMN `position` `position` TINYINT(4) NULL DEFAULT NULL ;


CREATE VIEW `ad_featuredproduct` AS
    SELECT 
        `product_ads_setting`.`id` AS `id`,
        `product_ads_setting`.`name` AS `product_name`,
        1 AS `type`,
        `product_ads_setting`.`position` AS `position`,
        `product_ads_setting`.`start_date` AS `start_date`,
        `product_ads_setting`.`end_date` AS `end_date`,
        `product_ads_setting`.`impression` AS `impression`,
        `product_ads_setting`.`clicks` AS `clicks`,
        `product_ads_setting`.`status` AS `status`,
        `product_ads_setting`.`created_by` AS `created_by`,
        `product_ads_setting`.`created_on` AS `created_on`,
        `product_ads_setting`.`last_updated_by` AS `last_updated_by`,
        `product_ads_setting`.`last_updated_on` AS `last_updated_on`,
        `product_ads_setting`.`deleted_at` AS `deleted_at`
    FROM
        `product_ads_setting` 
    UNION SELECT 
        `featuredproduct_sales_rating`.`id` AS `id`,
        `featuredproduct_sales_rating`.`product_name` AS `product_name`,
        2 AS `type`,
        `featuredproduct_sales_rating`.`position` AS `position`,
        `featuredproduct_sales_rating`.`start_date` AS `start_date`,
        `featuredproduct_sales_rating`.`end_date` AS `end_date`,
        `featuredproduct_sales_rating`.`impression` AS `impression`,
        `featuredproduct_sales_rating`.`clicks` AS `clicks`,
        `featuredproduct_sales_rating`.`status` AS `status`,
        `featuredproduct_sales_rating`.`created_by` AS `created_by`,
        `featuredproduct_sales_rating`.`created_on` AS `created_on`,
        `featuredproduct_sales_rating`.`last_updated_by` AS `last_updated_by`,
        `featuredproduct_sales_rating`.`last_updated_on` AS `last_updated_on`,
        `featuredproduct_sales_rating`.`deleted_at` AS `deleted_at`
    FROM
        `featuredproduct_sales_rating`



ALTER TABLE `gtc-test`.`product` 
CHANGE COLUMN `price` `price` DECIMAL(10,1) NOT NULL ;


ALTER TABLE `gtc-test`.`product` 
ADD COLUMN `moq` INT(11) NULL AFTER `city`;

ALTER TABLE `gtc-test`.`order_items` 
CHANGE COLUMN `quantity` `quantity` INT(11) NOT NULL ;

ALTER TABLE `gtc-test`.product
ADD COLUMN product_slug VARCHAR(128) NOT NULL;


CREATE VIEW `vendor_user_product` AS
    SELECT 
        `vendor`.`id` AS `id`,
        `vendor`.`vendor_name` AS `vendor_name`,
        `vendor`.`contact_email` AS `contact_email`,
        `vendor`.`vendor_profile_pic_url` AS `url`,
        `country`.`name` AS `origin`,
        `marketplace`.`name` AS `type`,
        `marketplace`.`id` AS `marketplace_id`,
        `users`.`id` AS `user_id`,
        `users`.`email` AS `email`,
        `users`.`first_name` AS `first_name`,
        `users`.`last_name` AS `last_name`,
        `users`.`status` AS `status`,
        `users`.`role` AS `role`,
        `users`.`email_verified` AS `email_verified`,
        (SELECT 
                COALESCE(COUNT(`product`.`vendor_id`), 0)
            FROM
                `product`
            WHERE
                (`product`.`vendor_id` = `vendor`.`id`)) AS `product_count`,
        (SELECT 
                COALESCE(SUM(`product_sales_rating`.`sales_count`),
                            0)
            FROM
                `product_sales_rating`
            WHERE
                (`product_sales_rating`.`vendor_name` = `vendor`.`vendor_name`)) AS `sales_count`,
        (SELECT 
                COALESCE(AVG(`reviews`.`rating`), 0)
            FROM
                `reviews`
            WHERE
                (`reviews`.`vendor_id` = `vendor`.`id`)) AS `rating`,
        `vendor`.`created_by` AS `created_by`,
        `vendor`.`created_on` AS `created_on`,
        `vendor`.`last_updated_by` AS `last_updated_by`,
        `vendor`.`last_updated_on` AS `last_updated_on`,
        `vendor`.`deleted_at` AS `deleted_at`
    FROM
        ((((`vendor`
        LEFT JOIN `users` ON ((`vendor`.`user_id` = `users`.`id`)))
        LEFT JOIN ((`vendor_plan`
        JOIN `plan_marketplace` ON ((`plan_marketplace`.`plan_id` = `vendor_plan`.`plan_id`)))
        JOIN `marketplace` ON ((`marketplace`.`id` = `plan_marketplace`.`marketplace_id`))) ON ((`vendor_plan`.`vendor_id` = `vendor`.`id`)))
        LEFT JOIN `product` ON ((`product`.`vendor_id` = `vendor`.`id`)))
        LEFT JOIN `country` ON ((`country`.`id` = `vendor`.`base_location`)))
    GROUP BY `vendor`.`vendor_name`





















        
        











