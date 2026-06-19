import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Maps each Supabase table to the React Query key prefixes that should be invalidated.
// "profiles" invalidates both ['profiles'] and ['profile'] (single-profile key).
const TABLE_KEYS: Record<string, string[][]> = {
  clients: [["clients"]],
  contracts: [["contracts"]],
  financial_transactions: [["financial_transactions"]],
  internal_credentials: [["internal_credentials"]],
  internal_document_folders: [["internal_document_folders"]],
  internal_documents: [["internal_documents"]],
  internal_task_comments: [["internal_task_comments"]],
  internal_task_subtasks: [["internal_task_subtasks"]],
  internal_task_time_entries: [["internal_task_time_entries"]],
  internal_tasks: [["internal_tasks"]],
  internal_workspace: [["internal_workspace"]],
  knowledge_items: [["knowledge_items"]],
  project_documents: [["project_documents"]],
  projects: [["projects"]],
  services: [["services"]],
  task_attachments: [["task_attachments"]],
  task_comments: [["task_comments"]],
  task_subtasks: [["task_subtasks"]],
  task_time_entries: [["task_time_entries"]],
  tasks: [["tasks"]],
  subtask_comments: [["subtask_comments"]],
  subtask_attachments: [["subtask_attachments"]],
  subtask_time_entries: [["subtask_time_entries"]],
  profiles: [["profiles"], ["profile"]],
};

/**
 * Subscribes to Postgres realtime changes on all major tables and invalidates
 * the matching React Query cache entries so every connected user sees updates
 * without needing a manual page refresh.
 *
 * Must be mounted inside an authenticated context (after the user is known).
 */
export function useRealtimeSync() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let channel = supabase.channel("global-db-sync");

    for (const [table, keyGroups] of Object.entries(TABLE_KEYS)) {
      channel = channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => {
          for (const queryKey of keyGroups) {
            qc.invalidateQueries({ queryKey });
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);
}
