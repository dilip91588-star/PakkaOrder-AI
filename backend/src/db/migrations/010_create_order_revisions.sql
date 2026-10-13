-- Migration 010: Canonical Order Revisions (Historical Snapshot Ledger)
CREATE TABLE IF NOT EXISTS `order_revisions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `canonical_order_id` BIGINT UNSIGNED NOT NULL,
  `version` INT UNSIGNED NOT NULL,
  `snapshot` JSON NOT NULL,
  `changed_by` VARCHAR(128) NOT NULL,
  `reason` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_revisions_canonical` FOREIGN KEY (`canonical_order_id`) REFERENCES `canonical_orders` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_canonical_order_version` (`canonical_order_id`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
