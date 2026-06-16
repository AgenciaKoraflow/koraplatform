export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_integrations: {
        Row: {
          base_url: string | null
          client_id: string
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_enabled: boolean | null
          org_id: string
          status: Database["public"]["Enums"]["integration_status"] | null
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_enabled?: boolean | null
          org_id: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_enabled?: boolean | null
          org_id?: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          anniversary: string | null
          avatar: string | null
          briefing: string | null
          bu: string | null
          company: string | null
          created_at: string | null
          email: string | null
          head: string | null
          id: string
          logo: string | null
          name: string
          notes: string | null
          phone: string | null
          pipeline_stage: string | null
          proposal_sent_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          anniversary?: string | null
          avatar?: string | null
          briefing?: string | null
          bu?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          head?: string | null
          id?: string
          logo?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          proposal_sent_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          anniversary?: string | null
          avatar?: string | null
          briefing?: string | null
          bu?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          head?: string | null
          id?: string
          logo?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          proposal_sent_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_projects: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          org_id: string
          project_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          org_id: string
          project_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          org_id: string
          reminder_sent_at: string | null
          signature_data: string | null
          signature_ip: string | null
          signature_token: string
          signature_user_agent: string | null
          signed_at: string | null
          signer_email: string
          signer_name: string
          signer_type: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          org_id: string
          reminder_sent_at?: string | null
          signature_data?: string | null
          signature_ip?: string | null
          signature_token?: string
          signature_user_agent?: string | null
          signed_at?: string | null
          signer_email: string
          signer_name: string
          signer_type: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          org_id?: string
          reminder_sent_at?: string | null
          signature_data?: string | null
          signature_ip?: string | null
          signature_token?: string
          signature_user_agent?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          signer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_type: string | null
          bu: string | null
          client_cpf: string | null
          client_id: string | null
          client_signature_data: string | null
          client_signed_at: string | null
          client_signer_email: string | null
          client_signer_name: string | null
          contractor_signature_data: string | null
          contractor_signed_at: string | null
          contractor_signer_email: string | null
          contractor_signer_name: string | null
          created_at: string | null
          description: string | null
          document_data: string | null
          document_name: string | null
          document_storage_path: string | null
          document_type: string | null
          document_version: number
          end_date: string | null
          fully_signed_at: string | null
          id: string
          implementation_value: number | null
          koraflow_signature_data: string | null
          koraflow_signed_at: string | null
          koraflow_signer_email: string | null
          koraflow_signer_name: string | null
          koraflow_signer_user_id: string | null
          project_id: string | null
          project_ids: string[] | null
          proposal_id: string | null
          recurrence_end_date: string | null
          recurrence_start_date: string | null
          recurrence_type: string | null
          recurrence_value: number | null
          signature_link_expires_at: string | null
          signature_link_token: string | null
          signature_order: string | null
          signature_sent_at: string | null
          signed_at: string | null
          signed_document_data: string | null
          signed_document_storage_path: string | null
          start_date: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          billing_type?: string | null
          bu?: string | null
          client_cpf?: string | null
          client_id?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          client_signer_email?: string | null
          client_signer_name?: string | null
          contractor_signature_data?: string | null
          contractor_signed_at?: string | null
          contractor_signer_email?: string | null
          contractor_signer_name?: string | null
          created_at?: string | null
          description?: string | null
          document_data?: string | null
          document_name?: string | null
          document_storage_path?: string | null
          document_type?: string | null
          document_version?: number
          end_date?: string | null
          fully_signed_at?: string | null
          id?: string
          implementation_value?: number | null
          koraflow_signature_data?: string | null
          koraflow_signed_at?: string | null
          koraflow_signer_email?: string | null
          koraflow_signer_name?: string | null
          koraflow_signer_user_id?: string | null
          project_id?: string | null
          project_ids?: string[] | null
          proposal_id?: string | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          recurrence_value?: number | null
          signature_link_expires_at?: string | null
          signature_link_token?: string | null
          signature_order?: string | null
          signature_sent_at?: string | null
          signed_at?: string | null
          signed_document_data?: string | null
          signed_document_storage_path?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          billing_type?: string | null
          bu?: string | null
          client_cpf?: string | null
          client_id?: string | null
          client_signature_data?: string | null
          client_signed_at?: string | null
          client_signer_email?: string | null
          client_signer_name?: string | null
          contractor_signature_data?: string | null
          contractor_signed_at?: string | null
          contractor_signer_email?: string | null
          contractor_signer_name?: string | null
          created_at?: string | null
          description?: string | null
          document_data?: string | null
          document_name?: string | null
          document_storage_path?: string | null
          document_type?: string | null
          document_version?: number
          end_date?: string | null
          fully_signed_at?: string | null
          id?: string
          implementation_value?: number | null
          koraflow_signature_data?: string | null
          koraflow_signed_at?: string | null
          koraflow_signer_email?: string | null
          koraflow_signer_name?: string | null
          koraflow_signer_user_id?: string | null
          project_id?: string | null
          project_ids?: string[] | null
          proposal_id?: string | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          recurrence_value?: number | null
          signature_link_expires_at?: string | null
          signature_link_token?: string | null
          signature_order?: string | null
          signature_sent_at?: string | null
          signed_at?: string | null
          signed_document_data?: string | null
          signed_document_storage_path?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          category: string
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          description: string
          due_date: string | null
          due_day: number | null
          first_payment_date: string | null
          id: string
          installment_count: number | null
          is_indefinite: boolean | null
          is_recurring: boolean | null
          notes: string | null
          org_id: string
          other_category_note: string | null
          paid: boolean | null
          paid_at: string | null
          paid_by: string | null
          paid_date: string | null
          payment_method: string | null
          project_id: string | null
          recurrence_type: string | null
          status: string
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          category: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          due_day?: number | null
          first_payment_date?: string | null
          id?: string
          installment_count?: number | null
          is_indefinite?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          org_id: string
          other_category_note?: string | null
          paid?: boolean | null
          paid_at?: string | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurrence_type?: string | null
          status?: string
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          category?: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          due_day?: number | null
          first_payment_date?: string | null
          id?: string
          installment_count?: number | null
          is_indefinite?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          org_id?: string
          other_category_note?: string | null
          paid?: boolean | null
          paid_at?: string | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurrence_type?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_boards: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          elements: Json | null
          id: string
          name: string
          thumbnail_url: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          elements?: Json | null
          id?: string
          name: string
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          elements?: Json | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integration_credentials: {
        Row: {
          created_at: string | null
          credential_key: string
          credential_value: string
          id: string
          integration_id: string
          is_encrypted: boolean | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credential_key: string
          credential_value: string
          id?: string
          integration_id: string
          is_encrypted?: boolean | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credential_key?: string
          credential_value?: string
          id?: string
          integration_id?: string
          is_encrypted?: boolean | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health: {
        Row: {
          checked_at: string | null
          error_message: string | null
          id: string
          integration_id: string
          is_healthy: boolean | null
          org_id: string
          response_time_ms: number | null
        }
        Insert: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          is_healthy?: boolean | null
          org_id: string
          response_time_ms?: number | null
        }
        Update: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          is_healthy?: boolean | null
          org_id?: string
          response_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_health_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          integration_id: string
          message: string
          org_id: string
          severity: Database["public"]["Enums"]["log_severity"] | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          integration_id: string
          message: string
          org_id: string
          severity?: Database["public"]["Enums"]["log_severity"] | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          integration_id?: string
          message?: string
          org_id?: string
          severity?: Database["public"]["Enums"]["log_severity"] | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_metrics: {
        Row: {
          id: string
          integration_id: string
          metadata: Json | null
          metric_type: Database["public"]["Enums"]["metric_type"]
          metric_unit: string | null
          metric_value: number | null
          org_id: string
          recorded_at: string | null
        }
        Insert: {
          id?: string
          integration_id: string
          metadata?: Json | null
          metric_type: Database["public"]["Enums"]["metric_type"]
          metric_unit?: string | null
          metric_value?: number | null
          org_id: string
          recorded_at?: string | null
        }
        Update: {
          id?: string
          integration_id?: string
          metadata?: Json | null
          metric_type?: Database["public"]["Enums"]["metric_type"]
          metric_unit?: string | null
          metric_value?: number | null
          org_id?: string
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_metrics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "client_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          has_password: boolean | null
          id: string
          password: string | null
          project_id: string | null
          project_ids: string[] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
          username: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          has_password?: boolean | null
          id?: string
          password?: string | null
          project_id?: string | null
          project_ids?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          has_password?: boolean | null
          id?: string
          password?: string | null
          project_id?: string | null
          project_ids?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_objectives: {
        Row: {
          bu: Json | null
          category: string
          created_at: string
          created_by: string | null
          current: number | null
          description: string | null
          end_date: string
          id: string
          last_update: string | null
          org_id: string
          priority: string
          progress: number | null
          start_date: string
          status: string
          target: number
          title: string
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bu?: Json | null
          category: string
          created_at?: string
          created_by?: string | null
          current?: number | null
          description?: string | null
          end_date: string
          id?: string
          last_update?: string | null
          org_id: string
          priority?: string
          progress?: number | null
          start_date: string
          status?: string
          target: number
          title: string
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bu?: Json | null
          category?: string
          created_at?: string
          created_by?: string | null
          current?: number | null
          description?: string | null
          end_date?: string
          id?: string
          last_update?: string | null
          org_id?: string
          priority?: string
          progress?: number | null
          start_date?: string
          status?: string
          target?: number
          title?: string
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      okr_updates: {
        Row: {
          comment: string | null
          created_at: string
          date: string
          id: string
          objective_id: string
          org_id: string
          updated_by: string | null
          value: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          date?: string
          id?: string
          objective_id: string
          org_id: string
          updated_by?: string | null
          value: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          date?: string
          id?: string
          objective_id?: string
          org_id?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "okr_updates_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "okr_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          assigned_to: string | null
          bu: string | null
          category: string
          client_id: string | null
          created_at: string | null
          description: string | null
          documents: string[] | null
          due_date: string | null
          id: string
          name: string
          status: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          bu?: string | null
          category: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          due_date?: string | null
          id?: string
          name: string
          status?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          bu?: string | null
          category?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          due_date?: string | null
          id?: string
          name?: string
          status?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          description: string | null
          email: string | null
          first_login: boolean
          full_name: string | null
          id: string
          must_change_password: boolean
          password_changed_at: string | null
          phone: string | null
          role: string
          updated_at: string
          vertente: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          first_login?: boolean
          full_name?: string | null
          id: string
          must_change_password?: boolean
          password_changed_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          vertente?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          first_login?: boolean
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          password_changed_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          vertente?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          billing_type: string | null
          bu: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          head: string | null
          id: string
          name: string
          progress: number | null
          recurrence_start_date: string | null
          recurrence_value: number | null
          start_date: string | null
          status: string | null
          team: string[] | null
          type: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          billing_type?: string | null
          bu?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          head?: string | null
          id?: string
          name: string
          progress?: number | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          start_date?: string | null
          status?: string | null
          team?: string[] | null
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          billing_type?: string | null
          bu?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          head?: string | null
          id?: string
          name?: string
          progress?: number | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          start_date?: string | null
          status?: string | null
          team?: string[] | null
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          billing_type: string
          bu: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          installments_max: number | null
          name: string
          org_id: string
          price_bargain: number | null
          price_initial: number | null
          recurrence_price_bargain: number | null
          recurrence_price_initial: number | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_type?: string
          bu?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installments_max?: number | null
          name: string
          org_id?: string
          price_bargain?: number | null
          price_initial?: number | null
          recurrence_price_bargain?: number | null
          recurrence_price_initial?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          billing_type?: string
          bu?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installments_max?: number | null
          name?: string
          org_id?: string
          price_bargain?: number | null
          price_initial?: number | null
          recurrence_price_bargain?: number | null
          recurrence_price_initial?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      signature_attempts: {
        Row: {
          attempt_at: string | null
          contract_id: string
          id: string
          ip_address: string | null
          org_id: string
          success: boolean | null
        }
        Insert: {
          attempt_at?: string | null
          contract_id: string
          id?: string
          ip_address?: string | null
          org_id: string
          success?: boolean | null
        }
        Update: {
          attempt_at?: string | null
          contract_id?: string
          id?: string
          ip_address?: string | null
          org_id?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_attempts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_audit_log: {
        Row: {
          contract_id: string
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          org_id: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          org_id: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          org_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_email_logs: {
        Row: {
          contract_id: string
          email_type: string
          error_message: string | null
          id: string
          message_id: string | null
          org_id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          contract_id: string
          email_type: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          org_id: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          contract_id?: string
          email_type?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          org_id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_email_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_settings: {
        Row: {
          auto_notify_on_signature: boolean | null
          contract_id: string
          created_at: string | null
          id: string
          org_id: string
          require_client_signature: boolean | null
          require_contractor_signature: boolean | null
          signature_order: string
          updated_at: string | null
        }
        Insert: {
          auto_notify_on_signature?: boolean | null
          contract_id: string
          created_at?: string | null
          id?: string
          org_id: string
          require_client_signature?: boolean | null
          require_contractor_signature?: boolean | null
          signature_order?: string
          updated_at?: string | null
        }
        Update: {
          auto_notify_on_signature?: boolean | null
          contract_id?: string
          created_at?: string | null
          id?: string
          org_id?: string
          require_client_signature?: boolean | null
          require_contractor_signature?: boolean | null
          signature_order?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_settings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          project_id: string | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          created_at: string
          id: string
          value: string
        }
        Insert: {
          created_at?: string
          id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          value?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
          subtask_id: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          subtask_id?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          subtask_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "task_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          mentioned_users: string[]
          subtask_id: string | null
          task_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          mentioned_users?: string[]
          subtask_id?: string | null
          task_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          mentioned_users?: string[]
          subtask_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "task_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subtasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_entries: {
        Row: {
          author: string
          created_at: string
          description: string
          hours: number
          id: string
          subtask_id: string | null
          task_id: string
        }
        Insert: {
          author?: string
          created_at?: string
          description: string
          hours: number
          id?: string
          subtask_id?: string | null
          task_id: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          hours?: number
          id?: string
          subtask_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_entries_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "task_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          blocked_reason: string | null
          bu: string | null
          client_approved: boolean
          client_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          blocked_reason?: string | null
          bu?: string | null
          client_approved?: boolean
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          blocked_reason?: string | null
          bu?: string | null
          client_approved?: boolean
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_observability_summary: {
        Row: {
          active_integrations: number | null
          client_id: string | null
          client_name: string | null
          error_integrations: number | null
          errors_7d: number | null
          last_health_check: string | null
          total_integrations: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      audit_rls_isolation: {
        Args: never
        Returns: {
          has_permissive: boolean
          has_rls: boolean
          policy_count: number
          risk_level: string
          table_name: string
        }[]
      }
      check_contract_fully_signed: {
        Args: { p_contract_id: string }
        Returns: boolean
      }
      check_signature_rate_limit: {
        Args: { p_contract_id: string; p_ip_address: string }
        Returns: boolean
      }
      current_user_role: { Args: never; Returns: string }
      generate_signature_link: {
        Args: { p_contract_id: string }
        Returns: string
      }
      generate_signed_document: {
        Args: { p_contract_id: string }
        Returns: string
      }
      get_my_role: { Args: never; Returns: string }
      get_user_org_ids: { Args: never; Returns: string[] }
      user_is_global_admin: { Args: never; Returns: boolean }
      user_is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
    }
    Enums: {
      integration_status: "active" | "inactive" | "error" | "pending_setup"
      integration_type:
        | "n8n"
        | "supabase"
        | "openai"
        | "sendgrid"
        | "aws_s3"
        | "google_cloud"
        | "slack"
        | "notion"
        | "stripe"
        | "twilio"
        | "custom_api"
      log_severity: "info" | "warning" | "error" | "critical"
      metric_type:
        | "api_calls"
        | "errors"
        | "latency"
        | "usage_quota"
        | "cost"
        | "uptime"
        | "custom"
      org_role: "global_admin" | "admin" | "member"
      user_role: "admin" | "operador" | "observador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      integration_status: ["active", "inactive", "error", "pending_setup"],
      integration_type: [
        "n8n",
        "supabase",
        "openai",
        "sendgrid",
        "aws_s3",
        "google_cloud",
        "slack",
        "notion",
        "stripe",
        "twilio",
        "custom_api",
      ],
      log_severity: ["info", "warning", "error", "critical"],
      metric_type: [
        "api_calls",
        "errors",
        "latency",
        "usage_quota",
        "cost",
        "uptime",
        "custom",
      ],
      org_role: ["global_admin", "admin", "member"],
      user_role: ["admin", "operador", "observador"],
    },
  },
} as const
