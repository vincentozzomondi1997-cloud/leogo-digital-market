-- LEOGO seller/product diagnostic
-- Run in Supabase SQL Editor and send the result screenshot.

SELECT 'SELLERS' AS section, id::text AS id, auth_user_id::text AS auth_user_id, business_name, status
FROM public.sellers
ORDER BY created_at DESC;

SELECT 'PRODUCTS COLUMNS' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='products'
ORDER BY ordinal_position;

SELECT 'PRODUCT FK' AS section, tc.constraint_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.table_schema
WHERE tc.table_schema='public' AND tc.table_name='products' AND tc.constraint_type='FOREIGN KEY';
