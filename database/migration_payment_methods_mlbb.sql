USE topzyn;

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
