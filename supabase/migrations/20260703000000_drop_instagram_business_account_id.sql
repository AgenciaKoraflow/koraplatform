-- The Instagram API with Instagram Login resolves the account directly from the
-- access token ("/me"), so the connection only needs App ID, App Secret and
-- Access Token — business_account_id is no longer collected or used.
ALTER TABLE instagram_credentials DROP COLUMN business_account_id;
