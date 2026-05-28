-- Seed: manufacturers for the MVP sample products
BEGIN;

INSERT INTO manufacturers (name) VALUES
('CJ제일제당'),
('동원F&B'),
('롯데햄'),
('롯데칠성음료'),
('해태HTB'),
('한국코카콜라'),
('해태제과'),
('풀무원')
ON CONFLICT (name) DO NOTHING;

COMMIT;
