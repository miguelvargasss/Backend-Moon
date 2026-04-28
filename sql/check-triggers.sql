-- Verificar si hay triggers en la tabla auth.users que auto-insertan en user
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';
