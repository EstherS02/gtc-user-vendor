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
        LEFT JOIN `order_items` ON `product`.`id` =`order_items`.`product_id`
        LEFT JOIN `vendor`
            INNER JOIN `users` ON `users`.`id` = `vendor`.`user_id`
        ON `product`.`vendor_id` =`vendor`.`id`
        LEFT JOIN `marketplace` ON `product`.`marketplace_id` =`marketplace`.`id`

    GROUP BY 
        `order_items`.`product_id`, 
        `product`.`id`,
        `product`.`product_name`,
        `vendor`.`vendor_name`,
        `users`.`first_name`,
        `marketplace`.`id` ,
        `marketplace`.`name`, 
        `product`.`publish_date`,
        `product`.`sku`,
        `product`.`status`,
        `product`.`created_by`,
        `product`.`created_on` ,
        `product`.`last_updated_by` ,
        `product`.`last_updated_on` ,
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
        LEFT JOIN `product` ON `featured_product`.`product_id` =`product`.`id`

    GROUP BY 
        `featured_product`.`id` , 
        `product`.`product_name`,
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


























        
        











