CREATE TABLE IF NOT EXISTS venue_enquiries (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  reference VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  organisation VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(35) NOT NULL,
  venue_type VARCHAR(64) NOT NULL,
  city VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  contact_consent TINYINT(1) NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL COMMENT 'Unix epoch milliseconds',
  PRIMARY KEY (id),
  KEY venue_enquiries_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
