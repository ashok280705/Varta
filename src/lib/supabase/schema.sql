-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations';
