-- Add new fields to hooks table
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'Reel';
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS visual_mode VARCHAR(50) DEFAULT 'Dark';
ALTER TABLE public.hooks ADD COLUMN IF NOT EXISTS theme TEXT;

-- Create CHECK constraints for new fields
ALTER TABLE public.hooks ADD CONSTRAINT hooks_content_type_check
  CHECK (content_type IN ('Reel', 'Carrossel', 'Post', 'Story'));

ALTER TABLE public.hooks ADD CONSTRAINT hooks_visual_mode_check
  CHECK (visual_mode IN ('Clean', 'Dark'));

-- Drop existing constraint if needed and recreate without duplicates
DROP CONSTRAINT IF EXISTS hooks_content_type_check ON public.hooks;
DROP CONSTRAINT IF EXISTS hooks_visual_mode_check ON public.hooks;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS hooks_content_type_idx ON hooks(content_type);
CREATE INDEX IF NOT EXISTS hooks_visual_mode_idx ON hooks(visual_mode);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'hooks' AND column_name IN ('content_type', 'visual_mode', 'theme');
