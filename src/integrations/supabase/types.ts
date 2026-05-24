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
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          full_name?: string | null;
          description?: string | null;
          cargo?: string | null;
          vertente?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'admin' | 'operador' | 'observador';
          first_login?: boolean;
          password_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          description?: string | null;
          cargo?: string | null;
          vertente?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'admin' | 'operador' | 'observador';
          first_login?: boolean;
          password_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
      clients: {
        Row: {
          id: string;
          name: string | null;
          company: string | null;
          email: string | null;
          phone: string | null;
          pipeline_stage: string | null;
          notes: string | null;
          anniversary: string | null;
          briefing: string | null;
          proposal_sent_date: string | null;
          head: string | null;
          bu: string[] | null;
          logo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          pipeline_stage?: string | null;
          notes?: string | null;
          anniversary?: string | null;
          briefing?: string | null;
          proposal_sent_date?: string | null;
          head?: string | null;
          bu?: string[] | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          pipeline_stage?: string | null;
          notes?: string | null;
          anniversary?: string | null;
          briefing?: string | null;
          proposal_sent_date?: string | null;
          head?: string | null;
          bu?: string[] | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string | null;
          description: string | null;
          status: string | null;
          progress: number | null;
          end_date: string | null;
          team: string[] | null;
          head: string | null;
          value: number | null;
          billing_type: string | null;
          type: string | null;
          recurrence_value: number | null;
          recurrence_start_date: string | null;
          bu: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name?: string | null;
          description?: string | null;
          status?: string | null;
          progress?: number | null;
          end_date?: string | null;
          team?: string[] | null;
          head?: string | null;
          value?: number | null;
          billing_type?: string | null;
          type?: string | null;
          recurrence_value?: number | null;
          recurrence_start_date?: string | null;
          bu?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string | null;
          description?: string | null;
          status?: string | null;
          progress?: number | null;
          end_date?: string | null;
          team?: string[] | null;
          head?: string | null;
          value?: number | null;
          billing_type?: string | null;
          type?: string | null;
          recurrence_value?: number | null;
          recurrence_start_date?: string | null;
          bu?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          title: string | null;
          description: string | null;
          status: string | null;
          priority: string | null;
          due_date: string | null;
          assigned_to: string | null;
          bu: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          assigned_to?: string | null;
          bu?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          project_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          assigned_to?: string | null;
          bu?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          client_id: string;
          project_ids: string[] | null;
          project_id: string | null;
          title: string | null;
          value: number | null;
          status: string | null;
          type: string | null;
          billing_type: string | null;
          recurrence_value: number | null;
          recurrence_start_date: string | null;
          created_at: string | null;
          signed_at: string | null;
          end_date: string | null;
          expires_at: string | null;
          document_name: string | null;
          document_data: string | null;
          document_type: string | null;
          document_storage_path: string | null;
          document_version: number | null;
          signed_document_storage_path: string | null;
          signature_link_token: string | null;
          signature_link_expires_at: string | null;
          signature_sent_at: string | null;
          koraflow_signed_at: string | null;
          koraflow_signature_data: string | null;
          koraflow_signer_name: string | null;
          koraflow_signer_email: string | null;
          koraflow_signer_user_id: string | null;
          client_signed_at: string | null;
          client_signature_data: string | null;
          client_signer_name: string | null;
          client_signer_email: string | null;
          client_cpf: string | null;
          signed_document_data: string | null;
          fully_signed_at: string | null;
          signature_order: string | null;
          contractor_signed_at: string | null;
          contractor_signature_data: string | null;
          contractor_signer_name: string | null;
          contractor_signer_email: string | null;
          bu: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          value?: number | null;
          status?: string | null;
          type?: string | null;
          billing_type?: string | null;
          recurrence_value?: number | null;
          recurrence_start_date?: string | null;
          created_at?: string | null;
          signed_at?: string | null;
          end_date?: string | null;
          expires_at?: string | null;
          document_name?: string | null;
          document_data?: string | null;
          document_type?: string | null;
          document_storage_path?: string | null;
          document_version?: number | null;
          signed_document_storage_path?: string | null;
          signature_link_token?: string | null;
          signature_link_expires_at?: string | null;
          signature_sent_at?: string | null;
          koraflow_signed_at?: string | null;
          koraflow_signature_data?: string | null;
          koraflow_signer_name?: string | null;
          koraflow_signer_email?: string | null;
          koraflow_signer_user_id?: string | null;
          client_signed_at?: string | null;
          client_signature_data?: string | null;
          client_signer_name?: string | null;
          client_signer_email?: string | null;
          client_cpf?: string | null;
          signed_document_data?: string | null;
          fully_signed_at?: string | null;
          signature_order?: string | null;
          contractor_signed_at?: string | null;
          contractor_signature_data?: string | null;
          contractor_signer_name?: string | null;
          contractor_signer_email?: string | null;
          bu?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          value?: number | null;
          status?: string | null;
          type?: string | null;
          billing_type?: string | null;
          recurrence_value?: number | null;
          recurrence_start_date?: string | null;
          created_at?: string | null;
          signed_at?: string | null;
          end_date?: string | null;
          expires_at?: string | null;
          document_name?: string | null;
          document_data?: string | null;
          document_type?: string | null;
          document_storage_path?: string | null;
          document_version?: number | null;
          signed_document_storage_path?: string | null;
          signature_link_token?: string | null;
          signature_link_expires_at?: string | null;
          signature_sent_at?: string | null;
          koraflow_signed_at?: string | null;
          koraflow_signature_data?: string | null;
          koraflow_signer_name?: string | null;
          koraflow_signer_email?: string | null;
          koraflow_signer_user_id?: string | null;
          client_signed_at?: string | null;
          client_signature_data?: string | null;
          client_signer_name?: string | null;
          client_signer_email?: string | null;
          client_cpf?: string | null;
          signed_document_data?: string | null;
          fully_signed_at?: string | null;
          signature_order?: string | null;
          contractor_signed_at?: string | null;
          contractor_signature_data?: string | null;
          contractor_signer_name?: string | null;
          contractor_signer_email?: string | null;
          bu?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      knowledge_items: {
        Row: {
          id: string;
          client_id: string | null;
          project_ids: string[] | null;
          project_id: string | null;
          title: string | null;
          category: string | null;
          content: string | null;
          username: string | null;
          password: string | null;
          url: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          category?: string | null;
          content?: string | null;
          username?: string | null;
          password?: string | null;
          url?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          category?: string | null;
          content?: string | null;
          username?: string | null;
          password?: string | null;
          url?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          client_id: string;
          project_ids: string[] | null;
          project_id: string | null;
          title: string | null;
          description: string | null;
          status: string | null;
          priority: string | null;
          assignee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          assignee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          project_ids?: string[] | null;
          project_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          assignee?: string | null;
          created_at?: string;
          updated_at?: string;
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
