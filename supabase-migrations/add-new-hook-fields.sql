-- Add new fields to hooks table
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT 'Reel';
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS pain_point TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS emotional_trigger TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS roteiro TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS vertical VARCHAR(50);

-- Create index for vertical
CREATE INDEX IF NOT EXISTS hooks_vertical_idx ON hooks(vertical);
