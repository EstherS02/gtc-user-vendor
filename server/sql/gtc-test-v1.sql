CREATE VIEW `product_sales` AS
SELECT 
     COALESCE(COUNT(order_items.product_id), 0) AS sales_count,
    `product`.`id`,
    `product`.`product_name`,
    `product`.`publish_date`,
    `product`.`sku`,
    `product`.`vendor_id`,
    `product`.`marketplace_id`,
    `product`.`status`,
    `product`.`created_by`,
    `product`.`created_on`,
    `product`.`last_updated_by`,
    `product`.`last_updated_on`,
    `product`.`deleted_at`
FROM
    product
        LEFT JOIN
    order_items ON product.id = order_items.product_id
GROUP BY 
    `order_items`.`product_id`, 
    `product`.`id`,
    `product`.`product_name`,
    `product`.`publish_date`,
    `product`.`sku`,
    `product`.`vendor_id`,
    `product`.`marketplace_id`,
    `product`.`status`,
    `product`.`created_by`,
    `product`.`created_on`,
    `product`.`last_updated_by`,
    `product`.`last_updated_on`,
    `product`.`deleted_at`;

ALTER TABLE `gtc-test`.`featured_product` ADD UNIQUE INDEX `product_id_UNIQUE` (`product_id` ASC);