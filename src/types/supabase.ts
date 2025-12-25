export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      animals: {
        Row: {
          id: string
          tenant_id: string
          tag: string
          name: string | null
          species: string
          breed: string | null
          date_of_birth: string | null
          gender: string
          photo_url: string | null
          photo_provider: string | null
          status: string
          purchase_date: string | null
          purchase_price: number | null
          weight: number | null
          color: string | null
          mother_id: string | null
          father_id: string | null
          notes: string | null
          custom_fields: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['animals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['animals']['Insert']>
      }
      milk_logs: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          date: string
          morning_quantity: number | null
          evening_quantity: number | null
          total_quantity: number
          quality_score: number | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['milk_logs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['milk_logs']['Insert']>
      }
      health_records: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          type: 'vaccination' | 'medication' | 'checkup' | 'surgery' | 'emergency'
          title: string
          description: string | null
          date: string
          next_date: string | null
          veterinarian: string | null
          cost: number | null
          notes: string | null
          attachments: string[] | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['health_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['health_records']['Insert']>
      }
      breeding_records: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          type: 'natural' | 'artificial'
          partner_animal_id: string | null
          date: string
          success_date: string | null
          status: 'planned' | 'in_progress' | 'successful' | 'failed'
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['breeding_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['breeding_records']['Insert']>
      }
      tenants: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      platform_users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'super_admin' | 'farm_owner' | 'farm_manager' | 'veterinarian' | 'breeder' | 'milking_staff' | 'feed_manager' | 'accountant' | 'guest'
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['platform_users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['platform_users']['Insert']>
      }
      tenant_members: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: 'farm_owner' | 'farm_manager' | 'veterinarian' | 'breeder' | 'milking_staff' | 'feed_manager' | 'accountant' | 'guest'
          permissions: Json | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenant_members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenant_members']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan: 'free' | 'professional' | 'farm' | 'enterprise'
          status: 'active' | 'cancelled' | 'expired' | 'trial'
          starts_at: string
          ends_at: string | null
          price: number | null
          currency: string | null
          features: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          tenant_id: string
          category: string
          amount: number
          currency: string
          date: string
          description: string | null
          vendor: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          product_type: 'milk' | 'animal' | 'equipment' | 'other'
          quantity: number
          unit_price: number
          total_amount: number
          currency: string
          date: string
          customer: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          subscription_id: string | null
          amount: number
          currency: string
          method: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'credit_card'
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      api_keys: {
        Row: {
          id: string
          tenant_id: string
          name: string
          key_prefix: string
          key_hash: string
          permissions: Json | null
          last_used: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['api_keys']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      farm_applications: {
        Row: {
          id: string
          user_id: string
          farm_name: string
          owner_name: string
          email: string
          phone: string
          address: string
          farm_size: number | null
          animals_count: number | null
          plan: 'free' | 'professional' | 'farm' | 'enterprise'
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['farm_applications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['farm_applications']['Insert']>
      }
      custom_fields_config: {
        Row: {
          id: string
          tenant_id: string
          table_name: string
          field_name: string
          field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
          label: string
          options: string[] | null
          required: boolean
          default_value: Json | null
          validation: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['custom_fields_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['custom_fields_config']['Insert']>
      }
      email_subscriptions: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          type: 'marketing' | 'product_updates' | 'tips_and_tricks' | 'milk_production_alerts' | 'health_reminders' | 'breeding_alerts' | 'expense_alerts' | 'subscription_renewals' | 'system_notifications' | 'security_alerts'
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['email_subscriptions']['Insert']>
      }
      predictions: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string | null
          type: 'milk_yield' | 'health_risk' | 'breeding_success' | 'feed_optimization' | 'disease_outbreak'
          model_version: string
          prediction_data: Json
          confidence_score: number | null
          predicted_at: string
          valid_until: string | null
          actual_value: number | null
          is_accurate: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['predictions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['predictions']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']