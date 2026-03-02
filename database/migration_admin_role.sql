USE topzyn;

-- Opsi 2: buat akun admin baru langsung dari SQL.
-- Ganti username/email/password_hash sebelum menjalankan.
-- NOTE: password_hash sebaiknya bcrypt hash (format diawali $2).
INSERT INTO account (username, email, password_hash, role)
VALUES ('nickname', 'email', 'password', 'admin');

-- Cek daftar akun admin
SELECT id, username, email, role, created_at
FROM account
WHERE LOWER(role) = 'admin'
ORDER BY id DESC;
