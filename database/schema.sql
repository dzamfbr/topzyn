CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  publisher VARCHAR(80) NOT NULL,
  image VARCHAR(255) NOT NULL,
  popular_image VARCHAR(255) NULL,
  slug VARCHAR(160) NULL,
  link VARCHAR(255) NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'topup',
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 999999,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_products_active_order (is_active, sort_order),
  INDEX idx_products_slug (slug)
);

INSERT INTO products
  (name, publisher, image, popular_image, slug, category, is_popular, sort_order)
VALUES
  ('Mobile Legends: Bang Bang', 'Moonton', 'product_mobile_legends_top_up_raypoint.png', 'product_horizontal_mobile_legends_top_up_raypoint.png', 'mobile-legends', 'topup,ml', 1, 1),
  ('Free Fire', 'Garena', 'product_free_fire_top_up_raypoint.png', 'product_horizontal_free_fire_top_up_raypoint.png', 'free-fire', 'topup,ff', 1, 2),
  ('Magic Chess', 'Moonton', 'product_magic_chess_top_up_raypoint.png', '1780x1000.jpg', 'magic-chess', 'topup,ml', 1, 3),
  ('Free Fire MAX', 'Garena', 'product_free_fire_max_top_up_raypoint.png', '1780x1000.jpg', 'free-fire-max', 'topup,ff', 1, 4);
