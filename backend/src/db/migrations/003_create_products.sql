-- Migration 003: Canonical Product Catalog
CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `sku` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `normalized_name` VARCHAR(255) NOT NULL,
  `variant` VARCHAR(128) NULL,
  `unit` VARCHAR(32) NOT NULL DEFAULT 'portion',
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `dietary` ENUM('VEG', 'NON_VEG') NOT NULL DEFAULT 'VEG',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_products_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  UNIQUE KEY `uq_tenant_sku` (`tenant_id`, `sku`),
  INDEX `idx_tenant_product_search` (`tenant_id`, `normalized_name`, `active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
