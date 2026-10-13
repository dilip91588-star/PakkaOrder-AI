-- Migration 009: Append-Only Immutable Audit Events
CREATE TABLE IF NOT EXISTS `audit_events` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `actor_type` ENUM('USER', 'SYSTEM', 'API_KEY') NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `actor_name` VARCHAR(128) NOT NULL,
  `actor_role` VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
  `entity_type` ENUM('SOURCE_ORDER', 'CANONICAL_ORDER', 'DUPLICATE_CANDIDATE', 'ORDER_CONFLICT', 'ORDER_LINK', 'SETTINGS') NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `action` ENUM('INGEST_CREATED', 'CANDIDATE_DETECTED', 'CONFLICT_FLAGGED', 'OPERATOR_OVERRIDE_CONFIRMED', 'DUPLICATE_MERGE', 'CONFIRMED_SEPARATE', 'SETTINGS_UPDATED') NOT NULL,
  `before_state` JSON NULL,
  `after_state` JSON NULL,
  `justification` TEXT NOT NULL,
  `correlation_id` VARCHAR(128) NOT NULL,
  `signature` VARCHAR(255) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_tenant_time` (`tenant_id`, `timestamp`),
  INDEX `idx_audit_entity` (`tenant_id`, `entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
