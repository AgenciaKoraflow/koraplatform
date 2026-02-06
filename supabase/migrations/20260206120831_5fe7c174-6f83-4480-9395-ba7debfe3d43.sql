-- Create table for Insights boards/documents
CREATE TABLE public.insights_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'canvas', -- 'canvas' or 'document'
  description TEXT,
  thumbnail_url TEXT,
  elements JSONB DEFAULT '[]'::jsonb,
  content TEXT, -- For document type (rich text content)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.insights_boards ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (since no auth is required in this project)
CREATE POLICY "Allow all operations on insights_boards" 
ON public.insights_boards 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insights_boards_updated_at
BEFORE UPDATE ON public.insights_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();