import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Tables } from "@/integrations/supabase/types";

type AuditLogRow = Tables<"signature_audit_log">;

const SIGNATURE_EVENTS = ["client_signed", "contractor_signed", "fully_signed"] as const;
type SignatureEventType = (typeof SIGNATURE_EVENTS)[number];

export interface SignatureNotification {
  id: string;
  contractId: string;
  contractTitle: string;
  eventType: SignatureEventType;
  createdAt: string;
  read: boolean;
}

interface AuditLogWithContract {
  id: string;
  contract_id: string;
  event_type: string;
  created_at: string;
  contracts: { title: string | null } | null;
}

export function useSignatureNotifications() {
  const [notifications, setNotifications] = useState<SignatureNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("signature_audit_log")
        .select(`
          id,
          contract_id,
          event_type,
          created_at,
          contracts!inner(title)
        `)
        .in("event_type", [...SIGNATURE_EVENTS])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedNotifications: SignatureNotification[] = (
        (data ?? []) as unknown as AuditLogWithContract[]
      ).map((item) => ({
        id: item.id,
        contractId: item.contract_id,
        contractTitle: item.contracts?.title ?? "Contrato",
        eventType: item.event_type as SignatureEventType,
        createdAt: item.created_at,
        read: false,
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      logger.error("Error fetching signature notifications:", error instanceof Error ? error : undefined);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("signature-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signature_audit_log",
        },
        async (payload) => {
          const newData = payload.new as AuditLogRow;

          if (SIGNATURE_EVENTS.includes(newData.event_type as SignatureEventType)) {
            const { data: contract } = await supabase
              .from("contracts")
              .select("title")
              .eq("id", newData.contract_id)
              .single();

            const notification: SignatureNotification = {
              id: newData.id,
              contractId: newData.contract_id,
              contractTitle: contract?.title ?? "Contrato",
              eventType: newData.event_type as SignatureEventType,
              createdAt: newData.created_at,
              read: false,
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            const messages: Record<SignatureEventType, string> = {
              client_signed: `O cliente assinou o contrato "${notification.contractTitle}"`,
              contractor_signed: `O contratante assinou o contrato "${notification.contractTitle}"`,
              fully_signed: `O contrato "${notification.contractTitle}" foi totalmente assinado!`,
            };

            toast.success(messages[newData.event_type as SignatureEventType], {
              action: {
                label: "Ver",
                onClick: () => {
                  window.location.href = "/contratos";
                },
              },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications: fetchNotifications,
  };
}
