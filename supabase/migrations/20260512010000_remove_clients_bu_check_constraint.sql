-- Remove the clients_bu_check constraint that was written for a single string value.
-- The bu column now stores a JSONB array (e.g. ["kora-agents"]) to support multiple BUs.
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_bu_check;
