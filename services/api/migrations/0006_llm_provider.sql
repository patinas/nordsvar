-- External OpenAI-compatible provider configuration per tenant.
-- llm_api_key_enc is AES-256-GCM ciphertext (nonce || ciphertext) keyed
-- by the deployment's SETTINGS_KEY; plaintext keys never touch the DB.
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS llm_base_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS llm_api_key_enc BYTEA;
