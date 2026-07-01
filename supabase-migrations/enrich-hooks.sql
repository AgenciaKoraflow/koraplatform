-- Enriquecer tabela hooks com informações psicológicas
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS emotional_trigger TEXT;
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS pain_point TEXT;
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS system_type VARCHAR(50) DEFAULT 'Sistema 1';

-- Create CHECK constraint for system_type
ALTER TABLE public.hooks ADD CONSTRAINT hooks_system_type_check
  CHECK (system_type IN ('Sistema 1', 'Sistema 2'));

-- Create indexes
CREATE INDEX IF NOT EXISTS hooks_emotional_trigger_idx ON hooks(emotional_trigger);
CREATE INDEX IF NOT EXISTS hooks_pain_point_idx ON hooks(pain_point);
CREATE INDEX IF NOT EXISTS hooks_system_type_idx ON hooks(system_type);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'hooks' AND column_name IN ('emotional_trigger', 'pain_point', 'system_type');
