-- Setup database TopZyn (reset + struktur + seed data utama)
-- Jalankan file ini untuk reset database agar tidak double data/struktur.

DROP DATABASE IF EXISTS topzyn;
CREATE DATABASE IF NOT EXISTS topzyn;
USE topzyn;

CREATE TABLE IF NOT EXISTS account (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  total_top_up BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topup_transaction (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  product_code VARCHAR(60) NOT NULL,
  amount BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_topup_transaction_account
    FOREIGN KEY (account_id) REFERENCES account(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mlbb_topup_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  base_price BIGINT UNSIGNED NULL,
  final_price BIGINT UNSIGNED NOT NULL,
  discount_percent INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ff_topup_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  base_price BIGINT UNSIGNED NULL,
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

-- Seed data katalog MLBB
INSERT INTO mlbb_topup_item
(code, name, image_url, base_price, final_price, discount_percent, is_active, sort_order)
VALUES

-- WEEKLY DIAMOND PASS
('MLWDP001', 'Weekly Diamond Pass', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png', 29000, 28000, 4, 1, 1),
('MLWDP002', 'Weekly Diamond Pass 2x', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png', NULL, 58000, 0, 1, 2),
('MLWDP003', 'Weekly Diamond Pass 3x', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png', NULL, 87000, 0, 1, 3),
('MLWDP004', 'Weekly Diamond Pass 4x', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png', NULL, 116000, 0, 1, 4),
('MLWDP005', 'Weekly Diamond Pass 5x', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png', NULL, 145000, 0, 1, 5),

-- DIAMOND REGULER (tanpa diskon)
('MLDM001', '5 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 1000, 1000, 0, 1, 6),
('MLDM002', '10 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 3000, 3000, 0, 1, 7),
('MLDM003', '12 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 3000, 3000, 0, 1, 8),
('MLDM004', '14 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 4000, 4000, 0, 1, 9),
('MLDM005', '18 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 5000, 5000, 0, 1, 10),
('MLDM006', '28 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 8000, 8000, 0, 1, 11),
('MLDM007', '36 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 10000, 10000, 0, 1, 12),
('MLDM008', '42 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 11000, 11000, 0, 1, 13),
('MLDM009', '59 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 15000, 15000, 0, 1, 14),
('MLDM010', '74 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 19000, 19000, 0, 1, 15),
('MLDM011', '85 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 22000, 22000, 0, 1, 16),
('MLDM012', '110 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 29000, 29000, 0, 1, 17),
('MLDM013', '148 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 38000, 38000, 0, 1, 18),
('MLDM014', '170 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 44000, 44000, 0, 1, 19),
('MLDM015', '222 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 56000, 56000, 0, 1, 20),
('MLDM016', '240 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 64000, 64000, 0, 1, 21),
('MLDM017', '277 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 75000, 75000, 0, 1, 22),
('MLDM018', '300 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 78000, 78000, 0, 1, 23),
('MLDM019', '370 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 100000, 100000, 0, 1, 24),
('MLDM020', '408 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 108000, 108000, 0, 1, 25),
('MLDM021', '518 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 138000, 138000, 0, 1, 26),
('MLDM022', '568 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 147000, 147000, 0, 1, 27),
('MLDM023', '600 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 152000, 152000, 0, 1, 28),
('MLDM024', '706 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 179000, 179000, 0, 1, 29),
('MLDM025', '750 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 196000, 196000, 0, 1, 30),
('MLDM026', '875 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 225000, 225000, 0, 1, 31),
('MLDM027', '966 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 255000, 255000, 0, 1, 32),
('MLDM028', '1050 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 268000, 268000, 0, 1, 33),
('MLDM029', '1220 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 315000, 315000, 0, 1, 34),
('MLDM030', '1412 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 370000, 370000, 0, 1, 35),
('MLDM031', '1506 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 396000, 396000, 0, 1, 36),
('MLDM032', '1669 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 430000, 430000, 0, 1, 37),
('MLDM033', '2010 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 487000, 487000, 0, 1, 38),
('MLDM034', '2195 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 532000, 532000, 0, 1, 39),
('MLDM035', '2380 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 590000, 590000, 0, 1, 40),
('MLDM036', '2539 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 628000, 628000, 0, 1, 41),
('MLDM037', '2855 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 708000, 708000, 0, 1, 42),
('MLDM038', '3453 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 863000, 863000, 0, 1, 43),
('MLDM039', '4020 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 980000, 980000, 0, 1, 44),
('MLDM040', '4830 Diamond', '/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png', 1176000, 1176000, 0, 1, 45);
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  base_price = VALUES(base_price),
  final_price = VALUES(final_price),
  discount_percent = VALUES(discount_percent),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

-- Seed data katalog Free Fire (tabel khusus FF)
INSERT INTO ff_topup_item
  (code, name, image_url, base_price, final_price, discount_percent, is_active, sort_order)
VALUES
  ('FFDM001', 'Free Fire 5 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 1000, 0, 1, 201),
  ('FFDM002', 'Free Fire 12 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 2500, 0, 1, 202),
  ('FFDM003', 'Free Fire 50 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 8000, 0, 1, 203),
  ('FFWM001', 'Free Fire Weekly Membership', '/images/topzyn/products/free-fire/topzyn-free-fire-weekly-membership.png', NULL, 27000, 0, 1, 204),
  ('FFMM001', 'Free Fire Monthly Membership', '/images/topzyn/products/free-fire/topzyn-free-fire-monthly-membership.png', NULL, 80000, 0, 1, 205),
  ('FFBP001', 'Free Fire Battle Pass Card', '/images/topzyn/products/free-fire/topzyn-free-fire-battle-pass-card.png', NULL, 45000, 0, 1, 206)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  base_price = VALUES(base_price),
  final_price = VALUES(final_price),
  discount_percent = VALUES(discount_percent),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

-- Sinkron data FF ke tabel katalog aktif order/invoice saat ini
INSERT INTO mlbb_topup_item
  (code, name, image_url, base_price, final_price, discount_percent, is_active, sort_order)
VALUES
  ('FFDM001', 'Free Fire 5 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 1000, 0, 1, 201),
  ('FFDM002', 'Free Fire 12 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 2500, 0, 1, 202),
  ('FFDM003', 'Free Fire 50 Diamond', '/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png', NULL, 8000, 0, 1, 203),
  ('FFWM001', 'Free Fire Weekly Membership', '/images/topzyn/products/free-fire/topzyn-free-fire-weekly-membership.png', NULL, 27000, 0, 1, 204),
  ('FFMM001', 'Free Fire Monthly Membership', '/images/topzyn/products/free-fire/topzyn-free-fire-monthly-membership.png', NULL, 80000, 0, 1, 205),
  ('FFBP001', 'Free Fire Battle Pass Card', '/images/topzyn/products/free-fire/topzyn-free-fire-battle-pass-card.png', NULL, 45000, 0, 1, 206)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  base_price = VALUES(base_price),
  final_price = VALUES(final_price),
  discount_percent = VALUES(discount_percent),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

-- Seed data metode pembayaran
INSERT INTO payment_method
  (code, name, logo_url, is_active, sort_order)
VALUES
  ('QRIS', 'QRIS', '/images/topzyn/payments/topzyn-payment-method-qris.png', 1, 1),
  ('COD_CASH', 'Cash (COD)', '/images/topzyn/payments/topzyn-payment-method-cash-cod.png', 1, 2),
  ('MINIMARKET_ALFAMART', 'Alfamart', '/images/topzyn/payments/topzyn-payment-method-alfamart.png', 1, 3),
  ('MINIMARKET_INDOMARET', 'Indomaret', '/images/topzyn/payments/topzyn-payment-method-indomaret.png', 1, 4)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  logo_url = VALUES(logo_url),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

-- Seed data promo
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


