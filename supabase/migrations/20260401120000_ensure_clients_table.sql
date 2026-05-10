-- Tabela base de clientes/leads (alinhada ao DataContext / Funil).
-- Idempotente: não remove colunas existentes; apenas garante estrutura mínima.

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  pipeline_stage TEXT DEFAULT 'prospeccao',
  status TEXT,
  notes TEXT,
  anniversary DATE,
  briefing TEXT,
  proposal_sent_date DATE,
  head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS anniversary DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS briefing TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS proposal_sent_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS head TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Allow all operations on clients'
  ) THEN
    CREATE POLICY "Allow all operations on clients"
    ON public.clients
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
