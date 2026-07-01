-- DROP OLD TABLES AND RECREATE
DROP TABLE IF EXISTS audience_configs CASCADE;
DROP TABLE IF EXISTS hooks CASCADE;

-- Create hooks table
CREATE TABLE IF NOT EXISTS hooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  template TEXT NOT NULL,
  creator TEXT NOT NULL,
  creator_handle TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  type VARCHAR(50) NOT NULL CHECK (type IN ('SWAP', 'BUILD', 'CLAIM', 'LIST', 'CONTRARIAN', 'STORY', 'CURIOSIDADE')),
  niche VARCHAR(50) NOT NULL CHECK (niche IN ('IA', 'SaaS', 'Produtividade', 'Criatividade', 'Tech', 'Startups', 'Marketing', 'Educação')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audience_config table
CREATE TABLE IF NOT EXISTS audience_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES internal_workspace(id) ON DELETE CASCADE,
  segments JSONB DEFAULT '["PME", "Automação", "WhatsApp", "IA", "Campanhas"]',
  trending_keywords JSONB DEFAULT '["automação", "whatsapp", "chatbot", "ia", "pme", "pequeño negócio", "marketing automation", "lead generation", "vendas", "campanhas", "integrações", "produtividade"]',
  description TEXT DEFAULT 'PMEs que precisam de automações, agentes de IA no WhatsApp e campanhas de produtos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_configs ENABLE ROW LEVEL SECURITY;

-- Simplified policies for hooks (allow authenticated users)
CREATE POLICY "Anyone can view hooks"
  ON hooks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create hooks"
  ON hooks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Users can update their own hooks"
  ON hooks FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own hooks"
  ON hooks FOR DELETE
  USING (created_by = auth.uid());

-- Simplified policies for audience_config
CREATE POLICY "Anyone can view audience configs"
  ON audience_configs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update audience configs"
  ON audience_configs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX hooks_workspace_id_idx ON hooks(workspace_id);
CREATE INDEX hooks_created_by_idx ON hooks(created_by);
CREATE INDEX hooks_type_idx ON hooks(type);
CREATE INDEX hooks_niche_idx ON hooks(niche);
CREATE INDEX audience_configs_workspace_id_idx ON audience_configs(workspace_id);
