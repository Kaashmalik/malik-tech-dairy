// Auto-generated Supabase types - DO NOT EDIT MANUALLY
// Generated on: 2024-12-26
// Run: mcp0_generate_typescript_types to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          id: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      breeding_records: {
        Row: {
          actual_birth_date: string | null
          animal_id: string
          breeding_date: string
          breeding_method: string | null
          created_at: string
          expected_due_date: string | null
          gestation_days: number | null
          id: string
          insemination_technician: string | null
          notes: string | null
          offspring_count: number | null
          offspring_id: string | null
          pregnancy_check_method: string | null
          pregnancy_confirmed: boolean | null
          pregnancy_confirmed_date: string | null
          recorded_by: string | null
          semen_source: string | null
          semen_straw_id: string | null
          sire_id: string | null
          species: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actual_birth_date?: string | null
          animal_id: string
          breeding_date: string
          breeding_method?: string | null
          created_at?: string
          expected_due_date?: string | null
          gestation_days?: number | null
          id: string
          insemination_technician?: string | null
          notes?: string | null
          offspring_count?: number | null
          offspring_id?: string | null
          pregnancy_check_method?: string | null
          pregnancy_confirmed?: boolean | null
          pregnancy_confirmed_date?: string | null
          recorded_by?: string | null
          semen_source?: string | null
          semen_straw_id?: string | null
          sire_id?: string | null
          species?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actual_birth_date?: string | null
          animal_id?: string
          breeding_date?: string
          breeding_method?: string | null
          created_at?: string
          expected_due_date?: string | null
          gestation_days?: number | null
          id?: string
          insemination_technician?: string | null
          notes?: string | null
          offspring_count?: number | null
          offspring_id?: string | null
          pregnancy_check_method?: string | null
          pregnancy_confirmed?: boolean | null
          pregnancy_confirmed_date?: string | null
          recorded_by?: string | null
          semen_source?: string | null
          semen_straw_id?: string | null
          sire_id?: string | null
          species?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string | null
          date: string
          description: string
          id: string
          receipt_url: string | null
          recorded_by: string | null
          tenant_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string | null
          date: string
          description: string
          id: string
          receipt_url?: string | null
          recorded_by?: string | null
          tenant_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          date?: string
          description?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          tenant_id?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      farm_applications: {
        Row: {
          address: string | null
          animal_types: Json | null
          applicant_id: string
          assigned_farm_id: string | null
          assigned_tenant_id: string | null
          city: string | null
          created_at: string
          email: string
          estimated_animals: number | null
          farm_name: string
          id: string
          owner_name: string
          payment_amount: number | null
          payment_date: string | null
          payment_reference: string | null
          payment_slip_provider: Database["public"]["Enums"]["storage_provider"] | null
          payment_slip_url: string | null
          phone: string
          province: string | null
          rejection_reason: string | null
          requested_plan: Database["public"]["Enums"]["subscription_plan"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["farm_application_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          animal_types?: Json | null
          applicant_id: string
          assigned_farm_id?: string | null
          assigned_tenant_id?: string | null
          city?: string | null
          created_at?: string
          email: string
          estimated_animals?: number | null
          farm_name: string
          id: string
          owner_name: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_slip_provider?: Database["public"]["Enums"]["storage_provider"] | null
          payment_slip_url?: string | null
          phone: string
          province?: string | null
          rejection_reason?: string | null
          requested_plan?: Database["public"]["Enums"]["subscription_plan"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["farm_application_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          animal_types?: Json | null
          applicant_id?: string
          assigned_farm_id?: string | null
          assigned_tenant_id?: string | null
          city?: string | null
          created_at?: string
          email?: string
          estimated_animals?: number | null
          farm_name?: string
          id?: string
          owner_name?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_slip_provider?: Database["public"]["Enums"]["storage_provider"] | null
          payment_slip_url?: string | null
          phone?: string
          province?: string | null
          rejection_reason?: string | null
          requested_plan?: Database["public"]["Enums"]["subscription_plan"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["farm_application_status"]
          updated_at?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          animal_id: string
          attachments: Json | null
          cost: number | null
          created_at: string
          date: string
          description: string
          id: string
          next_due_date: string | null
          recorded_by: string | null
          tenant_id: string
          type: string
          veterinarian: string | null
        }
        Insert: {
          animal_id: string
          attachments?: Json | null
          cost?: number | null
          created_at?: string
          date: string
          description: string
          id: string
          next_due_date?: string | null
          recorded_by?: string | null
          tenant_id: string
          type: string
          veterinarian?: string | null
        }
        Update: {
          animal_id?: string
          attachments?: Json | null
          cost?: number | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          next_due_date?: string | null
          recorded_by?: string | null
          tenant_id?: string
          type?: string
          veterinarian?: string | null
        }
        Relationships: []
      }
      milk_logs: {
        Row: {
          animal_id: string
          created_at: string
          date: string
          fat: number | null
          id: string
          notes: string | null
          quality: number | null
          quantity: number
          recorded_by: string | null
          session: string
          tenant_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          date: string
          fat?: number | null
          id: string
          notes?: string | null
          quality?: number | null
          quantity: number
          recorded_by?: string | null
          session: string
          tenant_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          date?: string
          fat?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          quantity?: number
          recorded_by?: string | null
          session?: string
          tenant_id?: string
        }
        Relationships: []
      }
      platform_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string | null
          phone: string | null
          platform_role: Database["public"]["Enums"]["user_platform_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["user_platform_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["user_platform_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number | null
          buyer_name: string | null
          buyer_phone: string | null
          category: string | null
          contact_info: string | null
          created_at: string
          currency: string | null
          customer_name: string | null
          date: string
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          price_per_unit: number
          quantity: number
          recorded_by: string | null
          tenant_id: string
          total: number
          type: string
          unit: string
        }
        Insert: {
          amount?: number | null
          buyer_name?: string | null
          buyer_phone?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          date: string
          description?: string | null
          id: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_unit: number
          quantity: number
          recorded_by?: string | null
          tenant_id: string
          total: number
          type: string
          unit: string
        }
        Update: {
          amount?: number | null
          buyer_name?: string | null
          buyer_phone?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_unit?: number
          quantity?: number
          recorded_by?: string | null
          tenant_id?: string
          total?: number
          type?: string
          unit?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          renew_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          token: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          renew_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          token?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          renew_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          token?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          join_date: string | null
          permissions: Json | null
          role: string
          salary: number | null
          status: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          join_date?: string | null
          permissions?: Json | null
          role: string
          salary?: number | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          join_date?: string | null
          permissions?: Json | null
          role?: string
          salary?: number | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          accent_color: string | null
          animal_types: Json | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          farm_name: string
          id: string
          language: string | null
          logo_url: string | null
          primary_color: string | null
          slug: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          animal_types?: Json | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          farm_name: string
          id: string
          language?: string | null
          logo_url?: string | null
          primary_color?: string | null
          slug: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          animal_types?: Json | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          farm_name?: string
          id?: string
          language?: string | null
          logo_url?: string | null
          primary_color?: string | null
          slug?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      animal_health_summary: {
        Row: {
          health_record_count: number | null
          id: string | null
          last_health_check: string | null
          name: string | null
          species: string | null
          status: string | null
          tag: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      breeding_status: {
        Row: {
          count: number | null
          species: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      daily_milk_production: {
        Row: {
          animal_count: number | null
          avg_quality: number | null
          date: string | null
          session: string | null
          tenant_id: string | null
          total_quantity: number | null
        }
        Relationships: []
      }
      monthly_expenses: {
        Row: {
          category: string | null
          month: string | null
          tenant_id: string | null
          total_amount: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          month: string | null
          tenant_id: string | null
          total_quantity: number | null
          total_revenue: number | null
          transaction_count: number | null
          type: string | null
        }
        Relationships: []
      }
      tenant_summary: {
        Row: {
          animal_count: number | null
          farm_name: string | null
          id: string | null
          member_count: number | null
          slug: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"] | null
          subscription_status: Database["public"]["Enums"]["subscription_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_animal_limit: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      get_next_farm_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_tenant_animal_count: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_tenant_member_count: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      user_is_member_of_tenant: {
        Args: { p_user_id: string; p_tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      audit_action: "create" | "update" | "delete" | "read" | "login" | "logout"
      farm_application_status:
        | "pending"
        | "payment_uploaded"
        | "under_review"
        | "approved"
        | "rejected"
      payment_gateway: "jazzcash" | "easypaisa" | "xpay" | "bank_transfer"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "manual_verification"
      storage_provider: "cloudinary" | "supabase"
      subscription_plan: "free" | "professional" | "farm" | "enterprise"
      subscription_status:
        | "active"
        | "trial"
        | "expired"
        | "cancelled"
        | "past_due"
        | "pending_approval"
      user_platform_role: "super_admin" | "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for table operations
type PublicSchema = Database["public"]

export type Tables<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Update"]

export type Views<
  ViewName extends keyof PublicSchema["Views"]
> = PublicSchema["Views"][ViewName]["Row"]

export type Enums<
  EnumName extends keyof PublicSchema["Enums"]
> = PublicSchema["Enums"][EnumName]

// Common type aliases for convenience
export type Animal = Tables<"animals">
export type AnimalInsert = TablesInsert<"animals">
export type AnimalUpdate = TablesUpdate<"animals">

export type MilkLog = Tables<"milk_logs">
export type MilkLogInsert = TablesInsert<"milk_logs">
export type MilkLogUpdate = TablesUpdate<"milk_logs">

export type HealthRecord = Tables<"health_records">
export type HealthRecordInsert = TablesInsert<"health_records">
export type HealthRecordUpdate = TablesUpdate<"health_records">

export type BreedingRecord = Tables<"breeding_records">
export type BreedingRecordInsert = TablesInsert<"breeding_records">
export type BreedingRecordUpdate = TablesUpdate<"breeding_records">

export type Tenant = Tables<"tenants">
export type TenantInsert = TablesInsert<"tenants">
export type TenantUpdate = TablesUpdate<"tenants">

export type PlatformUser = Tables<"platform_users">
export type PlatformUserInsert = TablesInsert<"platform_users">
export type PlatformUserUpdate = TablesUpdate<"platform_users">

export type TenantMember = Tables<"tenant_members">
export type TenantMemberInsert = TablesInsert<"tenant_members">
export type TenantMemberUpdate = TablesUpdate<"tenant_members">

export type Subscription = Tables<"subscriptions">
export type SubscriptionInsert = TablesInsert<"subscriptions">
export type SubscriptionUpdate = TablesUpdate<"subscriptions">

export type Expense = Tables<"expenses">
export type ExpenseInsert = TablesInsert<"expenses">
export type ExpenseUpdate = TablesUpdate<"expenses">

export type Sale = Tables<"sales">
export type SaleInsert = TablesInsert<"sales">
export type SaleUpdate = TablesUpdate<"sales">

export type FarmApplication = Tables<"farm_applications">
export type FarmApplicationInsert = TablesInsert<"farm_applications">
export type FarmApplicationUpdate = TablesUpdate<"farm_applications">

export type AuditLog = Tables<"audit_logs">
export type AuditLogInsert = TablesInsert<"audit_logs">

// Enum types
export type SubscriptionPlan = Enums<"subscription_plan">
export type SubscriptionStatus = Enums<"subscription_status">
export type PaymentGateway = Enums<"payment_gateway">
export type PaymentStatus = Enums<"payment_status">
export type AuditAction = Enums<"audit_action">
export type FarmApplicationStatus = Enums<"farm_application_status">
export type StorageProvider = Enums<"storage_provider">
export type UserPlatformRole = Enums<"user_platform_role">

// Animal species type (commonly used)
export type AnimalSpecies = "cow" | "buffalo" | "chicken" | "goat" | "sheep" | "horse"

// Animal status type
export type AnimalStatus = "active" | "sold" | "deceased" | "sick" | "quarantine"

// Milk session type
export type MilkSession = "morning" | "evening"
