-- Check messages table structure
DESC messages;

-- Check if messages table exists and has data
SELECT COUNT(*) as total_messages FROM messages;

-- Show all messages
SELECT * FROM messages;

-- Check users
SELECT idUser, id, name, email FROM user LIMIT 5;
