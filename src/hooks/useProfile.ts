import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationType } from '@/types/notifications';

export interface UserPreferences {
  task_view?: 'kanban' | 'list' | 'grid';
  theme?: 'light' | 'dark';
  notifications?: Partial<Record<NotificationType, boolean>>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  description: string | null;
  cargo: string | null;
  vertente: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'admin' | 'operador' | 'observador';
  first_login: boolean;
  password_changed_at: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<Pick<Profile,
  'full_name' | 'description' | 'cargo' | 'vertente' | 'avatar_url' | 'phone' | 'preferences'
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

// Returns a function that resolves a display name to an avatar URL from the profiles table.
// Works for all users, not just the logged-in one.
// Matches by full name first, then by first name as fallback (handles cases where
// tasks store "João" but the profile has "João Sousa").
export function useProfileAvatarMap(): (name: string) => string | null {
  const { data: profiles = [] } = useAllProfiles();
  return useMemo(() => {
    const byFullName = new Map<string, string | null>();
    const byFirstName = new Map<string, string | null>();
    for (const p of profiles) {
      if (!p.full_name) continue;
      const full = p.full_name.toLowerCase().trim();
      byFullName.set(full, p.avatar_url);
      const first = full.split(/\s+/)[0];
      // Only store first-name entry if it's unambiguous (no two users with same first name)
      if (!byFirstName.has(first)) {
        byFirstName.set(first, p.avatar_url);
      } else {
        // Mark as ambiguous so we don't return a wrong photo
        byFirstName.set(first, null);
      }
    }
    return (name: string) => {
      if (!name) return null;
      const key = name.toLowerCase().trim();
      if (byFullName.has(key)) return byFullName.get(key) ?? null;
      return byFirstName.get(key) ?? null;
    };
  }, [profiles]);
}

// Returns team member options built from real profiles for use in MultiSelect.
export function useTeamOptions(): { value: string; label: string }[] {
  const { data: profiles = [] } = useAllProfiles();
  return useMemo(
    () =>
      profiles
        .filter((p) => p.full_name)
        .map((p) => ({ value: p.full_name!, label: p.full_name! })),
    [profiles],
  );
}

export type AdminUserUpdate = {
  full_name?: string;
  cargo?: string;
  role?: Profile['role'];
};

// Admin only — update name, cargo or role of any user
export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: AdminUserUpdate }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
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
