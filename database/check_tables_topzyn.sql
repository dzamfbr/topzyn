-- Query cek database TopZyn (struktur + data ringkas)
USE topzyn;

-- 1) Cek semua tabel
SHOW TABLES;

-- 2) Ringkasan jumlah data per tabel
SELECT 'account' AS table_name, COUNT(*) AS total_rows FROM account
UNION ALL
SELECT 'topup_transaction', COUNT(*) FROM topup_transaction
UNION ALL
SELECT 'mlbb_topup_item', COUNT(*) FROM mlbb_topup_item
UNION ALL
SELECT 'ff_topup_item', COUNT(*) FROM ff_topup_item
UNION ALL
SELECT 'payment_method', COUNT(*) FROM payment_method
UNION ALL
SELECT 'promo_code', COUNT(*) FROM promo_code
UNION ALL
SELECT 'mlbb_topup_order', COUNT(*) FROM mlbb_topup_order;

-- 3) Cek struktur tabel (kolom)
DESCRIBE account;
DESCRIBE topup_transaction;
DESCRIBE mlbb_topup_item;
DESCRIBE ff_topup_item;
DESCRIBE payment_method;
DESCRIBE promo_code;
DESCRIBE mlbb_topup_order;

-- 4) Cek isi tabel utama (sample data)
SELECT id, username, email, role, total_top_up, created_at
FROM account
ORDER BY id DESC
LIMIT 20;

SELECT id, code, name, base_price, final_price, discount_percent, is_active, sort_order
FROM mlbb_topup_item
ORDER BY sort_order ASC, id ASC;

-- 4a) Cek katalog Free Fire (tabel khusus FF)
SELECT id, code, name, base_price, final_price, discount_percent, is_active, sort_order
FROM ff_topup_item
ORDER BY sort_order ASC, id ASC;

SELECT id, code, name, is_active, sort_order
FROM payment_method
ORDER BY sort_order ASC, id ASC;

SELECT id, code, discount_type, discount_value, min_subtotal, max_discount, is_active, starts_at, ends_at
FROM promo_code
ORDER BY id DESC;

SELECT
  id,
  order_number,
  account_id,
  item_id,
  payment_method_id,
  promo_code,
  promo_discount,
  subtotal_amount,
  total_amount,
  status,
  created_at
FROM mlbb_topup_order
ORDER BY id DESC
LIMIT 50;

SELECT
  id,
  account_id,
  product_code,
  amount,
  status,
  created_at
FROM topup_transaction
ORDER BY id DESC
LIMIT 50;

-- 5) Cek invoice join (validasi price/promo/total dari database)
SELECT
  o.order_number,
  i.name AS item_name,
  o.subtotal_amount AS price_before_discount,
  o.promo_code,
  o.promo_discount,
  o.total_amount AS total_after_discount,
  p.name AS payment_method,
  o.status,
  o.created_at
FROM mlbb_topup_order o
INNER JOIN mlbb_topup_item i ON i.id = o.item_id
INNER JOIN payment_method p ON p.id = o.payment_method_id
ORDER BY o.id DESC
LIMIT 50;
