-- =============================================
-- SCRIPT XÁC NHẬN USER TRỰC TIẾP (KHÔNG CẦN EMAIL)
-- Chạy trong Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Xác nhận email cho longtho638@gmail.com
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'longtho638@gmail.com'
  AND email_confirmed_at IS NULL;

-- 2. Xác nhận email cho doanhnhancaotuan@gmail.com  
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'doanhnhancaotuan@gmail.com'
  AND email_confirmed_at IS NULL;

-- 3. Kiểm tra kết quả
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED' ELSE '❌ NOT CONFIRMED' END as status
FROM auth.users 
WHERE email IN ('longtho638@gmail.com', 'doanhnhancaotuan@gmail.com');
