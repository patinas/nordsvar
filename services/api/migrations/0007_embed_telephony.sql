-- Website embed widget + telephony intent settings per tenant.
-- embed_public_key is PUBLIC by design (identifies the tenant in page
-- source); it is not a secret and is never encrypted.
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_enabled BOOLEAN;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_public_key TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_allowed_domains TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_theme_color TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_position TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_language TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS embed_voice_enabled BOOLEAN;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS telephony_enabled BOOLEAN;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS telephony_provider TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS telephony_inbound_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS tenant_settings_embed_key
    ON tenant_settings (embed_public_key) WHERE embed_public_key IS NOT NULL;
