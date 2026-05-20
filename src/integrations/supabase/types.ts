export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      system_health_checks: {
        Row: {
          id: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          title: string | null;
          client_id: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          client_id?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          client_id?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      signature_audit_log: {
        Row: {
          id: string;
          contract_id: string;
          event_type: string;
          event_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          event_type: string;
          event_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          event_type?: string;
          event_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      insights_boards: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          thumbnail_url: string | null;
          elements: Json;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description?: string | null;
          thumbnail_url?: string | null;
          elements?: Json;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          elements?: Json;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_integrations: {
        Row: {
          id: string;
          client_id: string;
          integration_type: string;
          status: string;
          display_name: string | null;
          description: string | null;
          base_url: string | null;
          api_key: string | null;
          config: Json | null;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          integration_type: string;
          status?: string;
          display_name?: string | null;
          description?: string | null;
          base_url?: string | null;
          api_key?: string | null;
          config?: Json | null;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          integration_type?: string;
          status?: string;
          display_name?: string | null;
          description?: string | null;
          base_url?: string | null;
          api_key?: string | null;
          config?: Json | null;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_metrics: {
        Row: {
          id: string;
          integration_id: string;
          metric_type: string;
          metric_value: number | null;
          metric_unit: string | null;
          recorded_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          integration_id: string;
          metric_type: string;
          metric_value?: number | null;
          metric_unit?: string | null;
          recorded_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          integration_id?: string;
          metric_type?: string;
          metric_value?: number | null;
          metric_unit?: string | null;
          recorded_at?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      integration_logs: {
        Row: {
          id: string;
          integration_id: string;
          severity: string;
          message: string;
          context: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          severity: string;
          message: string;
          context?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          severity?: string;
          message?: string;
          context?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      integration_health: {
        Row: {
          id: string;
          integration_id: string;
          is_healthy: boolean;
          response_time_ms: number | null;
          error_message: string | null;
          checked_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          is_healthy: boolean;
          response_time_ms?: number | null;
          error_message?: string | null;
          checked_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          is_healthy?: boolean;
          response_time_ms?: number | null;
          error_message?: string | null;
          checked_at?: string;
        };
        Relationships: [];
      };
      okr_objectives: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target: number;
          current: number | null;
          unit: string | null;
          status: string;
          start_date: string;
          end_date: string;
          priority: string;
          category: string;
          bu: string[] | null;
          progress: number | null;
          last_update: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target: number;
          current?: number | null;
          unit?: string | null;
          status: string;
          start_date: string;
          end_date: string;
          priority: string;
          category: string;
          bu?: string[] | null;
          progress?: number | null;
          last_update?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          target?: number;
          current?: number | null;
          unit?: string | null;
          status?: string;
          start_date?: string;
          end_date?: string;
          priority?: string;
          category?: string;
          bu?: string[] | null;
          progress?: number | null;
          last_update?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      okr_updates: {
        Row: {
          id: string;
          objective_id: string;
          date: string;
          value: number;
          comment: string | null;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          objective_id: string;
          date: string;
          value: number;
          comment?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          objective_id?: string;
          date?: string;
          value?: number;
          comment?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          type: string;
          category: string | null;
          description: string | null;
          value: number;
          is_recurring: boolean;
          recurrence_type: string | null;
          due_date: string | null;
          due_day: number | null;
          paid_date: string | null;
          status: string;
          client_id: string | null;
          project_id: string | null;
          notes: string | null;
          other_category_note: string | null;
          installment_count: number | null;
          first_payment_date: string | null;
          is_indefinite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          category?: string | null;
          description?: string | null;
          value: number;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          due_date?: string | null;
          due_day?: number | null;
          paid_date?: string | null;
          status?: string;
          client_id?: string | null;
          project_id?: string | null;
          notes?: string | null;
          other_category_note?: string | null;
          installment_count?: number | null;
          first_payment_date?: string | null;
          is_indefinite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          category?: string | null;
          description?: string | null;
          value?: number;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          due_date?: string | null;
          due_day?: number | null;
          paid_date?: string | null;
          status?: string;
          client_id?: string | null;
          project_id?: string | null;
          notes?: string | null;
          other_category_note?: string | null;
          installment_count?: number | null;
          first_payment_date?: string | null;
          is_indefinite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_observability_summary: {
        Row: {
          client_id: string;
          client_name: string;
          total_integrations: number;
          active_integrations: number;
          error_integrations: number;
          last_health_check: string | null;
          total_logs_7d: number;
          errors_7d: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      client_observability_summary: {
        Row: {
          client_id: string;
          client_name: string;
          total_integrations: number;
          active_integrations: number;
          error_integrations: number;
          last_health_check: string | null;
          total_logs_7d: number;
          errors_7d: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
