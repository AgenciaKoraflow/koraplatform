import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OKRObjective, OKRUpdate } from '@/types/okr';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type OkrObjectiveRow = Tables<'okr_objectives'>;
type OkrUpdateRow = Tables<'okr_updates'>;

function mapDbObjective(db: OkrObjectiveRow): OKRObjective {
  return {
    id: db.id,
    title: db.title,
    description: db.description ?? '',
    target: db.target,
    current: db.current ?? 0,
    unit: db.unit ?? '',
    status: db.status as OKRObjective['status'],
    startDate: db.start_date,
    endDate: db.end_date,
    priority: db.priority as OKRObjective['priority'],
    category: db.category as OKRObjective['category'],
    bu: Array.isArray(db.bu) ? (db.bu as string[]) : typeof db.bu === 'string' ? [db.bu] : [],
    progress: db.progress ?? 0,
    lastUpdate: db.last_update
      ? new Date(db.last_update).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbUpdate(db: OkrUpdateRow): OKRUpdate {
  return {
    id: db.id,
    objectiveId: db.objective_id,
    date: db.date,
    value: db.value,
    comment: db.comment ?? '',
    // updated_by is a UUID in the DB — show "equipe" for legacy records
    updatedBy: db.updated_by
      ? db.updated_by.includes('@') ? db.updated_by : 'equipe'
      : 'sistema',
    createdAt: db.created_at,
  };
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Erro desconhecido';
}

export function useOKRData() {
  const [objectives, setObjectives] = useState<OKRObjective[]>([]);
  const [updates, setUpdates] = useState<OKRUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOKRs = useCallback(async () => {
    try {
      setLoading(true);
      const [objResponse, updateResponse] = await Promise.all([
        supabase.from('okr_objectives').select('*').order('created_at', { ascending: false }),
        supabase.from('okr_updates').select('*').order('date', { ascending: false }),
      ]);

      if (objResponse.error) {
        logger.error('Erro ao carregar objectives:', objResponse.error instanceof Error ? objResponse.error : undefined);
        throw objResponse.error;
      }
      if (updateResponse.error) {
        logger.error('Erro ao carregar updates:', updateResponse.error instanceof Error ? updateResponse.error : undefined);
        throw updateResponse.error;
      }

      setObjectives((objResponse.data ?? []).map(mapDbObjective));
      setUpdates((updateResponse.data ?? []).map(mapDbUpdate));
    } catch (e) {
      logger.error('Erro ao carregar OKRs:', e instanceof Error ? e : undefined);
      toast.error('Erro ao carregar OKRs');
    } finally {
      setLoading(false);
    }
  }, []);

  const addObjective = useCallback(async (data: Omit<OKRObjective, 'id' | 'createdAt' | 'updatedAt'>): Promise<OKRObjective | null> => {
    try {
      const { data: result, error } = await supabase
        .from('okr_objectives')
        .insert([{
          title: data.title,
          description: data.description,
          target: data.target,
          current: data.current,
          unit: data.unit,
          status: data.status,
          start_date: data.startDate,
          end_date: data.endDate,
          priority: data.priority,
          category: data.category,
          bu: data.bu,
          progress: data.progress,
          last_update: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        logger.error('Erro do Supabase:', error instanceof Error ? error : undefined);
        throw error;
      }
      const mapped = mapDbObjective(result);
      setObjectives(prev => [mapped, ...prev]);
      toast.success('OKR criado com sucesso!');
      return mapped;
    } catch (e) {
      logger.error('Erro ao criar OKR:', e instanceof Error ? e : undefined);
      toast.error(`Erro ao criar OKR: ${errMsg(e)}`);
      return null;
    }
  }, []);

  const updateObjective = useCallback(async (id: string, data: Partial<OKRObjective>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.target !== undefined) updateData.target = data.target;
      if (data.current !== undefined) updateData.current = data.current;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.bu !== undefined) updateData.bu = data.bu;
      if (data.progress !== undefined) updateData.progress = data.progress;
      if (data.lastUpdate !== undefined) updateData.last_update = data.lastUpdate;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('okr_objectives')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setObjectives(prev => prev.map(obj =>
        obj.id === id ? { ...obj, ...data, updatedAt: new Date().toISOString() } : obj
      ));
      return true;
    } catch (e) {
      logger.error('Erro ao atualizar OKR:', e instanceof Error ? e : undefined);
      toast.error('Erro ao atualizar OKR');
      return false;
    }
  }, []);

  const deleteObjective = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('okr_objectives').delete().eq('id', id);
      if (error) throw error;
      setObjectives(prev => prev.filter(obj => obj.id !== id));
      setUpdates(prev => prev.filter(upd => upd.objectiveId !== id));
      toast.success('OKR removido com sucesso!');
      return true;
    } catch (e) {
      logger.error('Erro ao deletar OKR:', e instanceof Error ? e : undefined);
      toast.error('Erro ao deletar OKR');
      return false;
    }
  }, []);

  const addUpdate = useCallback(async (objectiveId: string, data: Omit<OKRUpdate, 'id' | 'createdAt'>): Promise<OKRUpdate | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      const displayName = session?.user?.email ?? data.updatedBy ?? 'sistema';

      const { data: result, error } = await supabase
        .from('okr_updates')
        .insert([{
          objective_id: objectiveId,
          date: data.date,
          value: data.value,
          comment: data.comment,
          updated_by: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      const mapped = { ...mapDbUpdate(result), updatedBy: displayName };
      setUpdates(prev => [mapped, ...prev]);
      toast.success('Atualização adicionada com sucesso!');
      return mapped;
    } catch (e) {
      logger.captureException(e);
      toast.error(`Erro ao adicionar atualização: ${errMsg(e)}`);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchOKRs();
  }, [fetchOKRs]);

  return {
    objectives,
    updates,
    loading,
    addObjective,
    updateObjective,
    deleteObjective,
    addUpdate,
    refreshOKRs: fetchOKRs,
  };
}
