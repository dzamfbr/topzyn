USE topzyn;

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
