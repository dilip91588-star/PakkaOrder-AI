-- Migration 007: Duplicate Candidates
-- Enforces source_a_id < source_b_id, normalized score between 0 and 1, and pair uniqueness
CREATE TABLE IF NOT EXISTS `duplicate_candidates` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `source_a_id` BIGINT UNSIGNED NOT NULL,
  `source_b_id` BIGINT UNSIGNED NOT NULL,
  `match_score` DECIMAL(5,4) NOT NULL,
  `match_features` JSON NOT NULL,
  `algorithm_version` VARCHAR(32) NOT NULL,
  `relationship_type` ENUM('POTENTIAL_DUPLICATE', 'SUSPECTED_UPDATE', 'SEPARATE_ORDER_AMBIGUOUS') NOT NULL,
  `review_status` ENUM('PENDING', 'IN_REVIEW', 'RESOLVED_UPDATE', 'RESOLVED_DUPLICATE', 'RESOLVED_SEPARATE') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` VARCHAR(128) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `resolution_notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `chk_source_order_pair` CHECK (`source_a_id` < `source_b_id`),
  CONSTRAINT `chk_match_score_range` CHECK (`match_score` >= 0.0000 AND `match_score` <= 1.0000),
  CONSTRAINT `fk_candidates_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_candidates_source_a` FOREIGN KEY (`source_a_id`) REFERENCES `source_orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_candidates_source_b` FOREIGN KEY (`source_b_id`) REFERENCES `source_orders` (`id`) ON DELETE RESTRICT,
  UNIQUE KEY `uq_candidate_pair` (`tenant_id`, `source_a_id`, `source_b_id`),
  INDEX `idx_candidate_review_status` (`tenant_id`, `review_status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
