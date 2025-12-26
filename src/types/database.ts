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
  public: {
    Tables: {
      animals: {
        Row: {
          breed: string | null
          color: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          date_of_birth: string | null
          father_id: string | null
          gender: string
          id: string
          mother_id: string | null
          name: string | null
          notes: string | null
          photo_provider: Database["public"]["Enums"]["storage_provider"] | null
          photo_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          species: string
          status: string
          tag: string
          tenant_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          breed?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          father_id?: string | null
          gender: string
          id: string
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          photo_provider?: Database["public"]["Enums"]["storage_provider"] | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          species: string
          status?: string
          tag: string
          tenant_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          breed?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          father_id?: string | null
          gender?: string
          id?: string
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          photo_provider?: Database["public"]["Enums"]["storage_provider"] | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          species?: string
          status?: string
          tag?: string
          tenant_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          id: string
          tenant_id: string
          date: string
          category: string
          description: string
          amount: number
          vendor_name: string | null
          receipt_url: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          date: string
          category: string
          description: string
          amount: number
          vendor_name?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          date?: string
          category?: string
          description?: string
          amount?: number
          vendor_name?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          date: string
          type: string
          quantity: number
          unit: string
          price_per_unit: number
          total: number
          currency: string
          buyer_name: string | null
          buyer_phone: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
          category: string | null
          customer_name: string | null
          contact_info: string | null
          payment_method: string | null
          payment_status: string
          amount: number | null
          description: string | null
        }
        Insert: {
          id: string
          tenant_id: string
          date: string
          type: string
          quantity: number
          unit: string
          price_per_unit: number
          total: number
          currency?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          category?: string | null
          customer_name?: string | null
          contact_info?: string | null
          payment_method?: string | null
          payment_status?: string
          amount?: number | null
          description?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          date?: string
          type?: string
          quantity?: number
          unit?: string
          price_per_unit?: number
          total?: number
          currency?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          category?: string | null
          customer_name?: string | null
          contact_info?: string | null
          payment_method?: string | null
          payment_status?: string
          amount?: number | null
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          date: string
          type: string
          description: string
          severity: string | null
          treated_by: string | null
          treatment: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          animal_id: string
          date: string
          type: string
          description: string
          severity?: string | null
          treated_by?: string | null
          treatment?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          date?: string
          type?: string
          description?: string
          severity?: string | null
          treated_by?: string | null
          treatment?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          id: string
          slug: string
          farm_name: string
          logo_url: string | null
          primary_color: string | null
          accent_color: string | null
          language: string | null
          currency: string | null
          timezone: string | null
          animal_types: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          farm_location: Json | null
          weather_enabled: boolean | null
          weather_unit: string | null
        }
        Insert: {
          id: string
          slug: string
          farm_name: string
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          language?: string | null
          currency?: string | null
          timezone?: string | null
          animal_types?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          farm_location?: Json | null
          weather_enabled?: boolean | null
          weather_unit?: string | null
        }
        Update: {
          id?: string
          slug?: string
          farm_name?: string
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          language?: string | null
          currency?: string | null
          timezone?: string | null
          animal_types?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          farm_location?: Json | null
          weather_enabled?: boolean | null
          weather_unit?: string | null
        }
        Relationships: []
      }
      milk_logs: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          date: string
          session: string
          quantity: number
          unit: string
          quality: number | null
          fat_percent: number | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          animal_id: string
          date: string
          session: string
          quantity: number
          unit: string
          quality?: number | null
          fat_percent?: number | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          date?: string
          session?: string
          quantity?: number
          unit?: string
          quality?: number | null
          fat_percent?: number | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milk_logs_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milk_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Functions: {
      check_animal_limit: { Args: { p_tenant_id: string }; Returns: boolean }
      get_next_farm_id: { Args: { p_year?: number }; Returns: string }
      get_tenant_animal_count: { Args: { p_tenant_id: string }; Returns: number }
      get_tenant_member_count: { Args: { p_tenant_id: string }; Returns: number }
      user_is_member_of_tenant: { Args: { tenant_uuid: string }; Returns: boolean }
    }
    Enums: {
      audit_action: "create" | "update" | "delete" | "read" | "login" | "logout"
      farm_application_status: "pending" | "payment_uploaded" | "under_review" | "approved" | "rejected"
      payment_gateway: "jazzcash" | "easypaisa" | "xpay" | "bank_transfer"
      payment_status: "pending" | "completed" | "failed" | "refunded" | "manual_verification"
      storage_provider: "cloudinary" | "supabase"
      subscription_plan: "free" | "professional" | "farm" | "enterprise"
      subscription_status: "active" | "trial" | "expired" | "cancelled" | "past_due" | "pending_approval"
      user_platform_role: "super_admin" | "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Export helper types for convenience
export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"]

export type Enums<
  EnumName extends keyof Database["public"]["Enums"],
> = Database["public"]["Enums"][EnumName]

// Animal species type (commonly used across the application)
export type AnimalSpecies = "cow" | "buffalo" | "chicken" | "goat" | "sheep" | "horse"

// Animal status type
export type AnimalStatus = "active" | "sold" | "deceased" | "sick" | "quarantine"

// Milk session type
export type MilkSession = "morning" | "evening"

// Breeding method type
export type BreedingMethod = "natural" | "artificial_insemination"

// Breeding status type
export type BreedingStatus = 
  | "inseminated" 
  | "check_pending" 
  | "confirmed" 
  | "not_pregnant" 
  | "pregnant" 
  | "delivered" 
  | "failed" 
  | "overdue"

// Health record type
export type HealthRecordType = "vaccination" | "treatment" | "checkup" | "disease" | "surgery"

// Expense category type
export type ExpenseCategory = 
  | "feed" 
  | "medicine" 
  | "labor" 
  | "equipment" 
  | "utilities" 
  | "veterinary" 
  | "maintenance" 
  | "other"

// Sale type
export type SaleType = "milk" | "animal" | "egg" | "manure" | "other"

// Re-export common types for convenience
export type Animal = Tables<"animals">
export type MilkLog = Tables<"milk_logs">
export type HealthRecord = Tables<"health_records">
export type Expense = Tables<"expenses">
export type Sale = Tables<"sales">
export type Tenant = Tables<"tenants">
export type PlatformUser = Tables<"platform_users">;

// Subscription types
export type SubscriptionPlan = Enums<"subscription_plan">
export type SubscriptionStatus = Enums<"subscription_status">
export type PaymentGateway = Enums<"payment_gateway">
export type PaymentStatus = Enums<"payment_status">
export type AuditAction = Enums<"audit_action">
export type FarmApplicationStatus = Enums<"farm_application_status">
export type StorageProvider = Enums<"storage_provider">
export type UserPlatformRole = Enums<"user_platform_role">
