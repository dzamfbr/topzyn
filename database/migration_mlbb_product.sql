USE topzyn;

CREATE TABLE IF NOT EXISTS mlbb_topup_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  base_price BIGINT UNSIGNED NOT NULL,
  final_price BIGINT UNSIGNED NOT NULL,
  discount_percent INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_method (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  logo_url VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_code (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  discount_type ENUM('amount', 'percent') NOT NULL,
  discount_value BIGINT UNSIGNED NOT NULL,
  min_subtotal BIGINT UNSIGNED NOT NULL DEFAULT 0,
  max_discount BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mlbb_topup_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  account_id BIGINT NULL,
  game_user_id VARCHAR(50) NOT NULL,
  game_server VARCHAR(50) NOT NULL,
  game_nickname VARCHAR(120) NULL,
  item_id BIGINT NOT NULL,
  payment_method_id BIGINT NOT NULL,
  promo_code VARCHAR(64) NULL,
  promo_discount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  subtotal_amount BIGINT UNSIGNED NOT NULL,
  total_amount BIGINT UNSIGNED NOT NULL,
  contact_whatsapp VARCHAR(25) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mlbb_order_account
    FOREIGN KEY (account_id) REFERENCES account(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_mlbb_order_item
    FOREIGN KEY (item_id) REFERENCES mlbb_topup_item(id),
  CONSTRAINT fk_mlbb_order_payment
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);

INSERT INTO mlbb_topup_item
  (code, name, image_url, base_price, final_price, discount_percent, is_active, sort_order)
VALUES
  ('ML_5_DM', '5 Diamond', '/images/diamond_mobile_legends.png', 2000, 1800, 10, 1, 1),
  ('ML_12_DM', '12 Diamond', '/images/diamond_mobile_legends.png', 4200, 3900, 7, 1, 2),
  ('ML_28_DM', '28 Diamond', '/images/diamond_mobile_legends.png', 9000, 8500, 5, 1, 3),
  ('ML_36_DM', '36 Diamond', '/images/diamond_mobile_legends.png', 11200, 10500, 6, 1, 4),
  ('ML_74_DM', '74 Diamond', '/images/diamond_mobile_legends.png', 22500, 20900, 7, 1, 5),
  ('ML_WDP', 'Weekly Diamond Pass', '/images/weekly_diamond_pass.png', 32000, 29900, 7, 1, 6)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  base_price = VALUES(base_price),
  final_price = VALUES(final_price),
  discount_percent = VALUES(discount_percent),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

INSERT INTO payment_method
  (code, name, logo_url, is_active, sort_order)
VALUES
  ('QRIS', 'QRIS', '/images/qris_topzyn.png', 1, 1),
  ('COD_CASH', 'Cash (COD)', '/images/cash_topzyn.png', 1, 2),
  ('MINIMARKET_ALFAMART', 'Alfamart', '/images/alfamart_topzyn.png', 1, 3),
  ('MINIMARKET_INDOMARET', 'Indomaret', '/images/indomaret_topzyn.png', 1, 4)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  logo_url = VALUES(logo_url),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

INSERT INTO promo_code
  (code, discount_type, discount_value, min_subtotal, max_discount, is_active, starts_at, ends_at)
VALUES
  ('TOPZYN10', 'percent', 10, 10000, 7000, 1, NULL, NULL),
  ('HEMAT5K', 'amount', 5000, 25000, NULL, 1, NULL, NULL)
ON DUPLICATE KEY UPDATE
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  min_subtotal = VALUES(min_subtotal),
  max_discount = VALUES(max_discount),
  is_active = VALUES(is_active),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at);
