-- Migration 006: Order Links Connecting Source to Canonical Orders
-- Enforces strictly at most ONE active link per source order using stored generated column
CREATE TABLE IF NOT EXISTS `order_links` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `source_order_id` BIGINT UNSIGNED NOT NULL,
  `canonical_order_id` BIGINT UNSIGNED NOT NULL,
  `link_type` ENUM('INITIAL_CANONICAL', 'RESOLVED_DUPLICATE', 'CONFIRMED_UPDATE', 'MANUAL_LINK') NOT NULL,
  `linked_by` VARCHAR(128) NOT NULL DEFAULT 'SYSTEM',
  `linked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `unlinked_at` DATETIME(3) NULL,
  `unlinked_reason` VARCHAR(255) NULL,
  `is_active` TINYINT GENERATED ALWAYS AS (IF(`unlinked_at` IS NULL, 1, NULL)) STORED,
  CONSTRAINT `fk_order_links_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_links_source` FOREIGN KEY (`source_order_id`) REFERENCES `source_orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_links_canonical` FOREIGN KEY (`canonical_order_id`) REFERENCES `canonical_orders` (`id`) ON DELETE RESTRICT,
  UNIQUE KEY `uq_active_source_order_link` (`tenant_id`, `source_order_id`, `is_active`),
  INDEX `idx_canonical_order_links` (`tenant_id`, `canonical_order_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
