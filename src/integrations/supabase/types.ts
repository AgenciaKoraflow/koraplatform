export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Database type — schema types pending regeneration via `supabase gen types typescript`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
