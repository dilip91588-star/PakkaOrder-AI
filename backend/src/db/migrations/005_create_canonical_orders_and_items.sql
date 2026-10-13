-- Migration 005: Canonical Orders and Canonical Order Items
CREATE TABLE IF NOT EXISTS `canonical_orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `order_ref` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(64) NULL,
  `delivery_address` TEXT NULL,
  `status` ENUM('CONFIRMED', 'HELD_FOR_REVIEW', 'DISPATCHED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  `currency` VARCHAR(16) NOT NULL DEFAULT 'INR',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `accepted_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `reconciliation_rule_applied` VARCHAR(255) NULL,
  `correlation_hash` VARCHAR(64) NOT NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_canonical_orders_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  UNIQUE KEY `uq_tenant_order_ref` (`tenant_id`, `order_ref`),
  INDEX `idx_tenant_canonical_status` (`tenant_id`, `status`),
  INDEX `idx_canonical_correlation` (`tenant_id`, `correlation_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `canonical_order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `canonical_order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit` VARCHAR(32) NOT NULL DEFAULT 'portion',
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `variant` JSON NULL,
  `customization` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_canonical_items_order` FOREIGN KEY (`canonical_order_id`) REFERENCES `canonical_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_canonical_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  INDEX `idx_canonical_item_product` (`canonical_order_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
