CREATE VIEW `product_sales` AS
    SELECT 
        COALESCE(COUNT(`order_items`.`product_id`),
                0) AS `sales_count`,
        `product`.`id` AS `id`,
        `product`.`product_name` AS `product_name`,
        `vendor`.`vendor_name` AS `vendor_name`,
        `users`.`first_name` AS `owner_name`,
        `marketplace`.`id` AS `marketplace_id`,
        `marketplace`.`name` AS `type`,
        `product`.`price` AS `price`,
        `product_media`.`url` AS `url`,
        `country`.`name` AS `origin`,
        `category`.`name` AS `category`,
        `sub_category`.`name` AS `sub_category`,
        `product`.`publish_date` AS `publish_date`,
        `product`.`sku` AS `sku`,
        `product`.`status` AS `status`,
        `product`.`created_by` AS `created_by`,
        `product`.`created_on` AS `created_on`,
        `product`.`last_updated_by` AS `last_updated_by`,
        `product`.`last_updated_on` AS `last_updated_on`,
        `product`.`deleted_at` AS `deleted_at`
    FROM
        `product`
        LEFT JOIN `product_media` ON `product_media`.`id` =`product`.`product_media_id`
        LEFT JOIN `order_items` ON `product`.`id` =`order_items`.`product_id`
        LEFT JOIN `vendor`
            INNER JOIN `users` ON `users`.`id` = `vendor`.`user_id`
        ON `product`.`vendor_id` =`vendor`.`id`
        LEFT JOIN `marketplace` ON `product`.`marketplace_id` =`marketplace`.`id`
        LEFT JOIN `category` ON `category`.`id` = `product`.`product_category_id` 
        LEFT JOIN `sub_category` ON `sub_category`.`id` = `product`.`sub_category_id`
        LEFT JOIN `country` ON `country`.`id` = `product`.`product_location`

    GROUP BY 
        `order_items`.`product_id` , 
        `product`.`id` ,
        `product`.`product_name` ,
        `vendor`.`vendor_name`,
        `users`.`first_name`,
        `marketplace`.`id` ,
        `marketplace`.`name`, 
        `product`.`price`,
        `product_media`.`url`,
        `country`.`name`,
        `category`.`name`,
        `sub_category`.`name`,
        `product`.`publish_date`, 
        `product`.`sku` ,
        `product`.`status` ,
        `product`.`created_by`,
        `product`.`created_on` ,
        `product`.`last_updated_by`,
        `product`.`last_updated_on`,
        `product`.`deleted_at`;





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




CREATE VIEW `featuredproduct_product` AS
    SELECT 
        `featured_product`.`id` AS `id`,
        `product`.`product_name` AS `product_name`,
        `featured_product`.`position` AS `position`,
        `featured_product`.`start_date` AS `start_date`,
        `featured_product`.`end_date` AS `end_date`,
        `product`.`price` AS `price`,
        `country`.`name` AS `origin`,
        `category`.`name` AS `category`,
        `sub_category`.`name` AS `sub_category`,
        `vendor`.`vendor_name` AS `vendor_name`,
        `marketplace`.`name` AS `marketplace`,
        `marketplace_type`.`name` AS `marketplace_type`,
        `product`.`publish_date` AS `publish_date`,
        `product`.`moq` AS `moq`,
        `product`.`quantity_available` AS `quantity_available`,
        `product`.`description` AS `description`,
        `product`.`city` AS `city`,
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
        LEFT JOIN `product` 
              INNER JOIN `category` ON `category`.`id` = `product`.`product_category_id` 
              INNER JOIN `sub_category` ON `sub_category`.`id` = `product`.`sub_category_id`   
              INNER JOIN `country` ON `country`.`id` = `product`.`product_location`
              INNER JOIN `vendor` ON `vendor`.`id` = `product`.`vendor_id` 
              INNER JOIN `marketplace` ON `marketplace`.`id` = `product`.`marketplace_id`
              INNER JOIN `marketplace_type` ON `marketplace_type`.`id` = `product`.`marketplace_type_id`
        ON `featured_product`.`product_id` =`product`.`id`

    GROUP BY
       `featured_product`.`id` , 
       `product`.`product_name` ,
       `featured_product`.`position` ,
       `featured_product`.`start_date`,
       `featured_product`.`end_date`,
       `product`.`price`,
       `country`.`name`,
       `category`.`name`,
       `sub_category`.`name`,
       `vendor`.`vendor_name`,
       `marketplace`.`name`,
       `marketplace_type`.`name`,
       `product`.`publish_date`,
       `product`.`moq`,
       `product`.`quantity_available`,
       `product`.`description`,
       `product`.`city`,
       `featured_product`.`status` ,
       `featured_product`.`impression`,
       `featured_product`.`clicks`,
       `featured_product`.`created_by` ,
       `featured_product`.`created_on` ,
       `featured_product`.`last_updated_by` ,
       `featured_product`.`last_updated_on` ,
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
    Union
      SELECT
        `featuredproduct_product`.`id` AS `id`,
        `featuredproduct_product`.`name` AS `product_name`,
         2 AS `type`,
        `featuredproduct_product`.`position` AS `position`,
        `featuredproduct_product`.`start_date` AS `start_date`,
        `featuredproduct_product`.`end_date` AS `end_date`,
        `featuredproduct_product`.`impression` AS `impression`,
        `featuredproduct_product`.`clicks` AS `clicks`,
        `featuredproduct_product`.`status` AS `status`,
        `featuredproduct_product`.`created_by` AS `created_by`,
        `featuredproduct_product`.`created_on` AS `created_on`,
        `featuredproduct_product`.`last_updated_by` AS `last_updated_by`,
        `featuredproduct_product`.`last_updated_on` AS `last_updated_on`,
        `featuredproduct_product`.`deleted_at` AS `deleted_at`
    FROM
        `featuredproduct_product`;



ALTER TABLE `gtc-test`.`product` 
CHANGE COLUMN `price` `price` DECIMAL(10,1) NOT NULL ;


ALTER TABLE `gtc-test`.`product` 
ADD COLUMN `moq` INT(11) NULL AFTER `city`;


























        
        











