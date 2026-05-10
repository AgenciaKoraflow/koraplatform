-- Create enum for integration types
CREATE TYPE integration_type AS ENUM (
  'n8n',
  'supabase',
  'openai',
  'sendgrid',
  'aws_s3',
  'google_cloud',
  'slack',
  'notion',
  'stripe',
  'twilio',
  'custom_api'
);

-- Create enum for integration status
CREATE TYPE integration_status AS ENUM (
  'active',
  'inactive',
  'error',
  'pending_setup'
);

-- Create enum for metric types
CREATE TYPE metric_type AS ENUM (
  'api_calls',
  'errors',
  'latency',
  'usage_quota',
  'cost',
  'uptime',
  'custom'
);

-- Create enum for log severity
CREATE TYPE log_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- Create table for client integrations
CREATE TABLE client_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_type integration_type NOT NULL,
  status integration_status DEFAULT 'pending_setup',
  display_name TEXT,
  description TEXT,
  base_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_enabled BOOLEAN DEFAULT true,
  CONSTRAINT unique_client_integration UNIQUE (client_id, integration_type)
);

-- Create table for integration credentials (encrypted)
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for integration usage metrics
CREATE TABLE integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  metric_type metric_type NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create table for integration logs
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  severity log_severity DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for integration health checks
CREATE TABLE integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  is_healthy BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_client_integrations_client_id ON client_integrations(client_id);
CREATE INDEX idx_client_integrations_type ON client_integrations(integration_type);
CREATE INDEX idx_client_integrations_status ON client_integrations(status);
CREATE INDEX idx_integration_credentials_integration_id ON integration_credentials(integration_id);
CREATE INDEX idx_integration_metrics_integration_id ON integration_metrics(integration_id);
CREATE INDEX idx_integration_metrics_recorded_at ON integration_metrics(recorded_at);
CREATE INDEX idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX idx_integration_health_integration_id ON integration_health(integration_id);

-- Enable Row Level Security
ALTER TABLE client_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth requirements)
CREATE POLICY "Enable read access for authenticated users" ON client_integrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON client_integrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON client_integrations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_client_integrations_updated_at
  BEFORE UPDATE ON client_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_credentials_updated_at
  BEFORE UPDATE ON integration_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for client observability summary
CREATE OR REPLACE VIEW client_observability_summary AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  COUNT(DISTINCT ci.id) as total_integrations,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'active') as active_integrations,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'error') as error_integrations,
  MAX(ih.checked_at) as last_health_check,
  COUNT(DISTINCT il.id) as total_logs_7d,
  COUNT(DISTINCT il.id) FILTER (WHERE il.severity = 'error' AND il.created_at > NOW() - INTERVAL '7 days') as errors_7d
FROM clients c
LEFT JOIN client_integrations ci ON c.id = ci.client_id
LEFT JOIN integration_health ih ON ci.id = ih.integration_id
LEFT JOIN integration_logs il ON ci.id = il.integration_id AND il.created_at > NOW() - INTERVAL '7 days'
WHERE c.status = 'active'
GROUP BY c.id, c.name;
