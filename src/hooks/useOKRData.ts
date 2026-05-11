import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OKRObjective, OKRUpdate } from '@/types/okr';
import { toast } from 'sonner';

export function useOKRData() {
  const [objectives, setObjectives] = useState<OKRObjective[]>([]);
  const [updates, setUpdates] = useState<OKRUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to map DB columns to frontend camelCase
  const mapDbObjective = (db: any): OKRObjective => ({
    id: db.id,
    title: db.title,
    description: db.description || '',
    target: db.target,
    current: db.current || 0,
    unit: db.unit || '',
    status: db.status,
    startDate: db.start_date,
    endDate: db.end_date,
    priority: db.priority,
    category: db.category,
    bu: Array.isArray(db.bu) ? db.bu : (typeof db.bu === 'string' ? [db.bu] : []),
    progress: db.progress || 0,
    lastUpdate: db.last_update ? new Date(db.last_update).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  });

  const mapDbUpdate = (db: any): OKRUpdate => ({
    id: db.id,
    objectiveId: db.objective_id,
    date: db.date,
    value: db.value,
    comment: db.comment || '',
    updatedBy: db.updated_by || 'system',
    createdAt: db.created_at,
  });

  // Fetch data from Supabase
  const fetchOKRs = useCallback(async () => {
    try {
      setLoading(true);
      const [objResponse, updateResponse] = await Promise.all([
        supabase.from('okr_objectives').select('*').order('created_at', { ascending: false }),
        supabase.from('okr_updates').select('*').order('date', { ascending: false }),
      ]);

      if (objResponse.error) {
        console.error('Erro ao carregar objectives:', objResponse.error);
        throw objResponse.error;
      }
      if (updateResponse.error) {
        console.error('Erro ao carregar updates:', updateResponse.error);
        throw updateResponse.error;
      }

      console.log('OKRs carregados:', objResponse.data?.length);
      setObjectives((objResponse.data || []).map(mapDbObjective));
      setUpdates((updateResponse.data || []).map(mapDbUpdate));
    } catch (error: any) {
      console.error('Erro ao carregar OKRs:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        fullError: error
      });
      toast.error('Erro ao carregar OKRs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add objective
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
        console.error('Erro do Supabase:', error);
        throw error;
      }
      const mapped = mapDbObjective(result);
      setObjectives(prev => [mapped, ...prev]);
      toast.success('OKR criado com sucesso!');
      return mapped;
    } catch (error: any) {
      console.error('Erro ao criar OKR:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        fullError: error
      });
      toast.error(`Erro ao criar OKR: ${error?.message || 'Erro desconhecido'}`);
      return null;
    }
  }, []);

  // Update objective
  const updateObjective = useCallback(async (id: string, data: Partial<OKRObjective>): Promise<boolean> => {
    try {
      const updateData: any = {};
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
    } catch (error) {
      console.error('Erro ao atualizar OKR:', error);
      toast.error('Erro ao atualizar OKR');
      return false;
    }
  }, []);

  // Delete objective
  const deleteObjective = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('okr_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setObjectives(prev => prev.filter(obj => obj.id !== id));
      setUpdates(prev => prev.filter(upd => upd.objectiveId !== id));
      toast.success('OKR removido com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar OKR:', error);
      toast.error('Erro ao deletar OKR');
      return false;
    }
  }, []);

  // Add update
  const addUpdate = useCallback(async (objectiveId: string, data: Omit<OKRUpdate, 'id' | 'createdAt'>): Promise<OKRUpdate | null> => {
    try {
      const { data: result, error } = await supabase
        .from('okr_updates')
        .insert([{
          objective_id: objectiveId,
          date: data.date,
          value: data.value,
          comment: data.comment,
          updated_by: data.updatedBy,
        }])
        .select()
        .single();

      if (error) throw error;

      const mapped = mapDbUpdate(result);
      setUpdates(prev => [mapped, ...prev]);
      toast.success('Atualização adicionada com sucesso!');
      return mapped;
    } catch (error) {
      console.error('Erro ao adicionar atualização:', error);
      toast.error('Erro ao adicionar atualização');
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
