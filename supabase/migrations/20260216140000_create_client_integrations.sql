-- Create client_integrations table
CREATE TABLE IF NOT EXISTS client_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL, -- Can be a client UUID or 'koraflow_internal'
  integration_type TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  base_url TEXT,
  api_key TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending_setup',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'pending_setup')),
  CONSTRAINT valid_integration_type CHECK (integration_type IN (
    'n8n', 'supabase', 'openai', 'sendgrid', 'aws_s3', 'google_cloud', 
    'slack', 'notion', 'stripe', 'twilio', 'hetzner_vps', 'custom_api'
  ))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_integrations_client_id ON client_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_integrations_type ON client_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_client_integrations_status ON client_integrations(status);

-- Create integration_credentials table for storing encrypted credentials
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(integration_id, credential_key)
);

-- Create integration_metrics table
CREATE TABLE IF NOT EXISTS integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_integration_metrics_integration_id ON integration_metrics(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_metrics_recorded_at ON integration_metrics(recorded_at);

-- Create integration_logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

-- Create integration_health table
CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  is_healthy BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_health_integration_id ON integration_health(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_checked_at ON integration_health(checked_at);

-- Create view for client observability summary (moved to 20260221200000_fix_observability_view.sql)
-- This view is created in a separate migration to handle UUID/TEXT conversion properly

-- Enable RLS
ALTER TABLE client_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust for production)
DROP POLICY IF EXISTS "Allow all operations on client_integrations" ON client_integrations;
DROP POLICY IF EXISTS "Allow all operations on integration_credentials" ON integration_credentials;
DROP POLICY IF EXISTS "Allow all operations on integration_metrics" ON integration_metrics;
DROP POLICY IF EXISTS "Allow all operations on integration_logs" ON integration_logs;
DROP POLICY IF EXISTS "Allow all operations on integration_health" ON integration_health;

CREATE POLICY "Allow all operations on client_integrations" ON client_integrations FOR ALL USING (true);
CREATE POLICY "Allow all operations on integration_credentials" ON integration_credentials FOR ALL USING (true);
CREATE POLICY "Allow all operations on integration_metrics" ON integration_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on integration_logs" ON integration_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on integration_health" ON integration_health FOR ALL USING (true);