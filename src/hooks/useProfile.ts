import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  full_name: string | null;
  description: string | null;
  cargo: string | null;
  vertente: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'admin' | 'operador' | 'observador';
  first_login: boolean;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<Pick<Profile,
  'full_name' | 'description' | 'cargo' | 'vertente' | 'avatar_url' | 'phone'
>>;

const PROFILE_QUERY_KEY = (userId: string) => ['profile', userId];
const ALL_PROFILES_QUERY_KEY = ['profiles', 'all'];

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY(userId ?? ''),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single<Profile>();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId!)
        .select()
        .single<Profile>();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (userId) qc.setQueryData(PROFILE_QUERY_KEY(userId), data);
    },
  });
}

// Admin only — fetches all profiles in the org
export function useAllProfiles() {
  return useQuery({
    queryKey: ALL_PROFILES_QUERY_KEY,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

// Admin only — update another user's role
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Profile['role'] }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single<Profile>();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALL_PROFILES_QUERY_KEY });
    },
  });
}
