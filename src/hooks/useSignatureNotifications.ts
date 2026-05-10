import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SignatureNotification {
  id: string;
  contractId: string;
  contractTitle: string;
  eventType: "client_signed" | "contractor_signed" | "fully_signed";
  createdAt: string;
  read: boolean;
}

export function useSignatureNotifications() {
  const [notifications, setNotifications] = useState<SignatureNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch existing notifications
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
        .in("event_type", ["client_signed", "contractor_signed", "fully_signed"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedNotifications: SignatureNotification[] = (data || []).map((item: any) => ({
        id: item.id,
        contractId: item.contract_id,
        contractTitle: item.contracts?.title || "Contrato",
        eventType: item.event_type,
        createdAt: item.created_at,
        read: false, // We'll track this locally for now
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching signature notifications:", error);
    }
  }, []);

  // Subscribe to new signature events
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
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
          const newData = payload.new as any;
          
          if (["client_signed", "contractor_signed", "fully_signed"].includes(newData.event_type)) {
            // Fetch contract title
            const { data: contract } = await supabase
              .from("contracts")
              .select("title")
              .eq("id", newData.contract_id)
              .single();

            const notification: SignatureNotification = {
              id: newData.id,
              contractId: newData.contract_id,
              contractTitle: contract?.title || "Contrato",
              eventType: newData.event_type,
              createdAt: newData.created_at,
              read: false,
            };

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            const messages = {
              client_signed: `O cliente assinou o contrato "${notification.contractTitle}"`,
              contractor_signed: `O contratante assinou o contrato "${notification.contractTitle}"`,
              fully_signed: `O contrato "${notification.contractTitle}" foi totalmente assinado!`,
            };

            toast.success(messages[newData.event_type as keyof typeof messages], {
              action: {
                label: "Ver",
                onClick: () => {
                  window.location.href = `/contratos`;
                },
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
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
