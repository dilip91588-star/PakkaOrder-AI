-- Migration 008: Material Order Conflicts
CREATE TABLE IF NOT EXISTS `order_conflicts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `candidate_id` BIGINT UNSIGNED NOT NULL,
  `conflict_type` ENUM('QUANTITY_MISMATCH', 'PRICE_MISMATCH', 'ITEM_MISMATCH', 'ADDRESS_VARIANCE', 'STATUS_CONTRADICTION', 'TEMPORAL_ANOMALY') NOT NULL,
  `field_path` VARCHAR(255) NOT NULL,
  `value_a` JSON NOT NULL,
  `value_b` JSON NOT NULL,
  `severity` ENUM('CRITICAL', 'WARNING', 'INFO') NOT NULL DEFAULT 'WARNING',
  `resolution_status` ENUM('UNRESOLVED', 'RESOLVED_OVERRIDE_A', 'RESOLVED_OVERRIDE_B', 'RESOLVED_CUSTOM', 'DISMISSED') NOT NULL DEFAULT 'UNRESOLVED',
  `resolution_notes` TEXT NULL,
  `resolved_by` VARCHAR(128) NULL,
  `resolved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_conflicts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_conflicts_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `duplicate_candidates` (`id`) ON DELETE CASCADE,
  INDEX `idx_conflict_candidate` (`tenant_id`, `candidate_id`, `resolution_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
