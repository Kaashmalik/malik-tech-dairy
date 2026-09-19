export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      animals: {
        Row: {
          breed: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          custom_fields: Json | null;
          date_of_birth: string | null;
          father_id: string | null;
          gender: string;
          id: string;
          mother_id: string | null;
          name: string | null;
          notes: string | null;
          photo_provider: Database['public']['Enums']['storage_provider'] | null;
          photo_url: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          species: string;
          status: string;
          tag: string;
          tenant_id: string;
          updated_at: string;
          weight: number | null;
        };
        Insert: {
          breed?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          custom_fields?: Json | null;
          date_of_birth?: string | null;
          father_id?: string | null;
          gender: string;
          id: string;
          mother_id?: string | null;
          name?: string | null;
          notes?: string | null;
          photo_provider?: Database['public']['Enums']['storage_provider'] | null;
          photo_url?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          species: string;
          status?: string;
          tag: string;
          tenant_id: string;
          updated_at?: string;
          weight?: number | null;
        };
        Update: {
          breed?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          custom_fields?: Json | null;
          date_of_birth?: string | null;
          father_id?: string | null;
          gender?: string;
          id?: string;
          mother_id?: string | null;
          name?: string | null;
          notes?: string | null;
          photo_provider?: Database['public']['Enums']['storage_provider'] | null;
          photo_url?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          species?: string;
          status?: string;
          tag?: string;
          tenant_id?: string;
          updated_at?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'animals_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'platform_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'animals_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          tenant_id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          vendor_name: string | null;
          receipt_url: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          vendor_name?: string | null;
          receipt_url?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          date?: string;
          category?: string;
          description?: string;
          amount?: number;
          vendor_name?: string | null;
          receipt_url?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          tenant_id: string;
          date: string;
          type: string;
          quantity: number;
          unit: string;
          price_per_unit: number;
          total: number;
          currency: string;
          buyer_name: string | null;
          buyer_phone: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
          category: string | null;
          customer_name: string | null;
          contact_info: string | null;
          payment_method: string | null;
          payment_status: string;
          amount: number | null;
          description: string | null;
        };
        Insert: {
          id: string;
          tenant_id: string;
          date: string;
          type: string;
          quantity: number;
          unit: string;
          price_per_unit: number;
          total: number;
          currency?: string;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          category?: string | null;
          customer_name?: string | null;
          contact_info?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          amount?: number | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          date?: string;
          type?: string;
          quantity?: number;
          unit?: string;
          price_per_unit?: number;
          total?: number;
          currency?: string;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          category?: string | null;
          customer_name?: string | null;
          contact_info?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          amount?: number | null;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      health_records: {
        Row: {
          id: string;
          tenant_id: string;
          animal_id: string;
          date: string;
          type: string;
          description: string;
          severity: string | null;
          treated_by: string | null;
          treatment: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          animal_id: string;
          date: string;
          type: string;
          description: string;
          severity?: string | null;
          treated_by?: string | null;
          treatment?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          animal_id?: string;
          date?: string;
          type?: string;
          description?: string;
          severity?: string | null;
          treated_by?: string | null;
          treatment?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'health_records_animal_id_fkey';
            columns: ['animal_id'];
            isOneToOne: false;
            referencedRelation: 'animals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'health_records_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          id: string;
          slug: string;
          farm_name: string;
          logo_url: string | null;
          primary_color: string | null;
          accent_color: string | null;
          language: string | null;
          currency: string | null;
          timezone: string | null;
          animal_types: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          farm_location: Json | null;
          weather_enabled: boolean | null;
          weather_unit: string | null;
        };
        Insert: {
          id: string;
          slug: string;
          farm_name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          accent_color?: string | null;
          language?: string | null;
          currency?: string | null;
          timezone?: string | null;
          animal_types?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          farm_location?: Json | null;
          weather_enabled?: boolean | null;
          weather_unit?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          farm_name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          accent_color?: string | null;
          language?: string | null;
          currency?: string | null;
          timezone?: string | null;
          animal_types?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          farm_location?: Json | null;
          weather_enabled?: boolean | null;
          weather_unit?: string | null;
        };
        Relationships: [];
      };
      milk_logs: {
        Row: {
          id: string;
          tenant_id: string;
          animal_id: string;
          date: string;
          session: string;
          quantity: number;
          unit: string;
          quality: number | null;
          fat_percent: number | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          animal_id: string;
          date: string;
          session: string;
          quantity: number;
          unit: string;
          quality?: number | null;
          fat_percent?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          animal_id?: string;
          date?: string;
          session?: string;
          quantity?: number;
          unit?: string;
          quality?: number | null;
          fat_percent?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'milk_logs_animal_id_fkey';
            columns: ['animal_id'];
            isOneToOne: false;
            referencedRelation: 'animals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'milk_logs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      platform_users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          platform_role: Database['public']['Enums']['user_platform_role'];
          is_active: boolean;
          email_verified: boolean;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          platform_role?: Database['public']['Enums']['user_platform_role'];
          is_active?: boolean;
          email_verified?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          platform_role?: Database['public']['Enums']['user_platform_role'];
          is_active?: boolean;
          email_verified?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          type: string;
          category: string | null;
          value: number | null;
          purchase_date: string | null;
          warranty_expiry: string | null;
          status: 'operational' | 'maintenance' | 'retired';
          location: string | null;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          type: string;
          category?: string | null;
          value?: number | null;
          purchase_date?: string | null;
          warranty_expiry?: string | null;
          status?: 'operational' | 'maintenance' | 'retired';
          location?: string | null;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          type?: string;
          category?: string | null;
          value?: number | null;
          purchase_date?: string | null;
          warranty_expiry?: string | null;
          status?: 'operational' | 'maintenance' | 'retired';
          location?: string | null;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      farm_applications: {
        Row: {
          id: string;
          applicant_id: string;
          farm_name: string;
          owner_name: string;
          email: string;
          phone: string;
          address: string | null;
          city: string | null;
          province: string | null;
          animal_types: Json | null;
          estimated_animals: number | null;
          requested_plan: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['farm_application_status'];
          payment_slip_url: string | null;
          payment_slip_provider: Database['public']['Enums']['storage_provider'] | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_reference: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
          assigned_tenant_id: string | null;
          assigned_farm_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          applicant_id: string;
          farm_name: string;
          owner_name: string;
          email: string;
          phone: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          animal_types?: Json | null;
          estimated_animals?: number | null;
          requested_plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['farm_application_status'];
          payment_slip_url?: string | null;
          payment_slip_provider?: Database['public']['Enums']['storage_provider'] | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_reference?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          assigned_tenant_id?: string | null;
          assigned_farm_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          applicant_id?: string;
          farm_name?: string;
          owner_name?: string;
          email?: string;
          phone?: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          animal_types?: Json | null;
          estimated_animals?: number | null;
          requested_plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['farm_application_status'];
          payment_slip_url?: string | null;
          payment_slip_provider?: Database['public']['Enums']['storage_provider'] | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_reference?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          assigned_tenant_id?: string | null;
          assigned_farm_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'farm_applications_applicant_id_fkey';
            columns: ['applicant_id'];
            isOneToOne: false;
            referencedRelation: 'platform_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'farm_applications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'platform_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'farm_applications_assigned_tenant_id_fkey';
            columns: ['assigned_tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      // Veterinary Management Tables
      animal_vaccinations: {
        Row: {
          id: string;
          tenant_id: string;
          animal_id: string;
          vaccine_id: string;
          disease_id: string;
          vaccine_name: string;
          vaccination_date: string;
          administered_by: string;
          batch_number: string;
          dose_number: number;
          dosage: number;
          route: string;
          site: string;
          next_due_date: string;
          adverse_reactions: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          animal_id: string;
          vaccine_id: string;
          disease_id: string;
          vaccine_name: string;
          vaccination_date: string;
          administered_by: string;
          batch_number: string;
          dose_number: number;
          dosage: number;
          route: string;
          site: string;
          next_due_date?: string;
          adverse_reactions?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          animal_id?: string;
          vaccine_id?: string;
          disease_id?: string;
          vaccine_name?: string;
          vaccination_date?: string;
          administered_by?: string;
          batch_number?: string;
          dose_number?: number;
          dosage?: number;
          route?: string;
          site?: string;
          next_due_date?: string;
          adverse_reactions?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      breeding_records: {
        Row: {
          id: string;
          tenant_id: string;
          animal_id: string;
          breeding_date: string;
          method: 'natural' | 'artificial_insemination';
          sire_id: string | null;
          semen_batch: string | null;
          technician: string | null;
          pregnancy_check_date: string | null;
          pregnancy_confirmed: boolean;
          due_date: string | null;
          outcome: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          animal_id: string;
          breeding_date: string;
          method: 'natural' | 'artificial_insemination';
          sire_id?: string | null;
          semen_batch?: string | null;
          technician?: string | null;
          pregnancy_check_date?: string | null;
          pregnancy_confirmed?: boolean;
          due_date?: string | null;
          outcome?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          animal_id?: string;
          breeding_date?: string;
          method?: 'natural' | 'artificial_insemination';
          sire_id?: string | null;
          semen_batch?: string | null;
          technician?: string | null;
          pregnancy_check_date?: string | null;
          pregnancy_confirmed?: boolean;
          due_date?: string | null;
          outcome?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      diseases: {
        Row: {
          id: string;
          name: string;
          name_urdu: string | null;
          local_name: string | null;
          category: string;
          subcategory: string | null;
          causative_agent: string | null;
          affected_species: string[];
          symptoms: string[];
          early_signs: string[] | null;
          advanced_signs: string[] | null;
          transmission_mode: string | null;
          incubation_period: string | null;
          mortality_rate: string | null;
          morbidity_rate: string | null;
          zoonotic: boolean;
          peak_season: string | null;
          high_risk_regions: string[] | null;
          preventive_measures: string[] | null;
          vaccination_available: boolean;
          economic_impact_score: number;
          milk_production_impact: string | null;
          severity_default: string;
          is_notifiable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_urdu?: string | null;
          local_name?: string | null;
          category: string;
          subcategory?: string | null;
          causative_agent?: string | null;
          affected_species: string[];
          symptoms: string[];
          early_signs?: string[] | null;
          advanced_signs?: string[] | null;
          transmission_mode?: string | null;
          incubation_period?: string | null;
          mortality_rate?: string | null;
          morbidity_rate?: string | null;
          zoonotic?: boolean;
          peak_season?: string | null;
          high_risk_regions?: string[] | null;
          preventive_measures?: string[] | null;
          vaccination_available?: boolean;
          economic_impact_score?: number;
          milk_production_impact?: string | null;
          severity_default?: string;
          is_notifiable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_urdu?: string | null;
          local_name?: string | null;
          category?: string;
          subcategory?: string | null;
          causative_agent?: string | null;
          affected_species?: string[];
          symptoms?: string[];
          early_signs?: string[] | null;
          advanced_signs?: string[] | null;
          transmission_mode?: string | null;
          incubation_period?: string | null;
          mortality_rate?: string | null;
          morbidity_rate?: string | null;
          zoonotic?: boolean;
          peak_season?: string | null;
          high_risk_regions?: string[] | null;
          preventive_measures?: string[] | null;
          vaccination_available?: boolean;
          economic_impact_score?: number;
          milk_production_impact?: string | null;
          severity_default?: string;
          is_notifiable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medicines: {
        Row: {
          id: string;
          name: string;
          generic_name: string | null;
          brand_name: string | null;
          manufacturer: string | null;
          category: string;
          form: string;
          strength: string | null;
          dosage: string | null;
          administration_route: string;
          contraindications: string[] | null;
          side_effects: string[] | null;
          storage_requirements: string | null;
          withdrawal_period: string | null;
          price: number | null;
          is_prescription_required: boolean;
          is_controlled_substance: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          generic_name?: string | null;
          brand_name?: string | null;
          manufacturer?: string | null;
          category: string;
          form: string;
          strength?: string | null;
          dosage?: string | null;
          administration_route: string;
          contraindications?: string[] | null;
          side_effects?: string[] | null;
          storage_requirements?: string | null;
          withdrawal_period?: string | null;
          price?: number | null;
          is_prescription_required?: boolean;
          is_controlled_substance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          generic_name?: string | null;
          brand_name?: string | null;
          manufacturer?: string | null;
          category?: string;
          form?: string;
          strength?: string | null;
          dosage?: string | null;
          administration_route?: string;
          contraindications?: string[] | null;
          side_effects?: string[] | null;
          storage_requirements?: string | null;
          withdrawal_period?: string | null;
          price?: number | null;
          is_prescription_required?: boolean;
          is_controlled_substance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          tenant_id: string;
          animal_id: string | null;
          type:
            | 'milk_yield'
            | 'health_risk'
            | 'breeding_success'
            | 'feed_optimization'
            | 'disease_outbreak';
          model_version: string;
          prediction_data: Json;
          confidence_score: number | null;
          predicted_at: string;
          valid_until: string | null;
          actual_value: number | null;
          is_accurate: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          animal_id?: string | null;
          type:
            | 'milk_yield'
            | 'health_risk'
            | 'breeding_success'
            | 'feed_optimization'
            | 'disease_outbreak';
          model_version?: string;
          prediction_data: Json;
          confidence_score?: number | null;
          predicted_at?: string;
          valid_until?: string | null;
          actual_value?: number | null;
          is_accurate?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          animal_id?: string | null;
          type?:
            | 'milk_yield'
            | 'health_risk'
            | 'breeding_success'
            | 'feed_optimization'
            | 'disease_outbreak';
          model_version?: string;
          prediction_data?: Json;
          confidence_score?: number | null;
          predicted_at?: string;
          valid_until?: string | null;
          actual_value?: number | null;
          is_accurate?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      migration_logs: {
        Row: {
          id: string;
          tenant_id: string;
          table_name: string;
          operation: 'create' | 'update' | 'delete';
          record_id: string;
          old_data: Json | null;
          new_data: Json | null;
          migration_date: string;
          status: 'pending' | 'completed' | 'failed';
          error_message: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          table_name: string;
          operation: 'create' | 'update' | 'delete';
          record_id: string;
          old_data?: Json | null;
          new_data?: Json | null;
          migration_date?: string;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          table_name?: string;
          operation?: 'create' | 'update' | 'delete';
          record_id?: string;
          old_data?: Json | null;
          new_data?: Json | null;
          migration_date?: string;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout';
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout';
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          action?: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout';
          table_name?: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          type:
            | 'marketing'
            | 'product_updates'
            | 'tips_and_tricks'
            | 'milk_production_alerts'
            | 'health_reminders'
            | 'breeding_alerts'
            | 'expense_alerts'
            | 'subscription_renewals'
            | 'system_notifications'
            | 'security_alerts';
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          type:
            | 'marketing'
            | 'product_updates'
            | 'tips_and_tricks'
            | 'milk_production_alerts'
            | 'health_reminders'
            | 'breeding_alerts'
            | 'expense_alerts'
            | 'subscription_renewals'
            | 'system_notifications'
            | 'security_alerts';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          type?:
            | 'marketing'
            | 'product_updates'
            | 'tips_and_tricks'
            | 'milk_production_alerts'
            | 'health_reminders'
            | 'breeding_alerts'
            | 'expense_alerts'
            | 'subscription_renewals'
            | 'system_notifications'
            | 'security_alerts';
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_history: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          plan: Database['public']['Enums']['subscription_plan'];
          gateway: Database['public']['Enums']['payment_gateway'];
          transaction_id: string;
          amount: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          plan: Database['public']['Enums']['subscription_plan'];
          gateway: Database['public']['Enums']['payment_gateway'];
          transaction_id: string;
          amount: number;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          plan?: Database['public']['Enums']['subscription_plan'];
          gateway?: Database['public']['Enums']['payment_gateway'];
          transaction_id?: string;
          amount?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          gateway: Database['public']['Enums']['payment_gateway'];
          expires_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['subscription_status'];
          gateway?: Database['public']['Enums']['payment_gateway'];
          expires_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['subscription_status'];
          gateway?: Database['public']['Enums']['payment_gateway'];
          expires_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: string;
          permissions: string[];
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: string;
          permissions: string[];
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: string;
          permissions?: string[];
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_fields_config: {
        Row: {
          id: string;
          tenant_id: string;
          entity_type: string;
          field_name: string;
          field_type: string;
          is_required: boolean;
          options: Json | null;
          default_value: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          entity_type: string;
          field_name: string;
          field_type: string;
          is_required?: boolean;
          options?: Json | null;
          default_value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          entity_type?: string;
          field_name?: string;
          field_type?: string;
          is_required?: boolean;
          options?: Json | null;
          default_value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weather_data: {
        Row: {
          id: string;
          tenant_id: string;
          temperature: number;
          city_name: string;
          humidity: number;
          pressure: number;
          weather_main: string;
          data_timestamp: string;
          country: string;
          latitude?: number;
          longitude?: number;
          description?: string;
          wind_speed?: number;
          wind_direction?: number;
          visibility?: number;
          clouds?: number;
          sunrise?: string;
          sunset?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          temperature: number;
          city_name: string;
          humidity: number;
          pressure: number;
          weather_main: string;
          data_timestamp: string;
          country: string;
          latitude?: number;
          longitude?: number;
          description?: string;
          wind_speed?: number;
          wind_direction?: number;
          visibility?: number;
          clouds?: number;
          sunrise?: string;
          sunset?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          temperature?: number;
          city_name?: string;
          humidity?: number;
          pressure?: number;
          weather_main?: string;
          data_timestamp?: string;
          country?: string;
          latitude?: number;
          longitude?: number;
          description?: string;
          wind_speed?: number;
          wind_direction?: number;
          visibility?: number;
          clouds?: number;
          sunrise?: string;
          sunset?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      iot_devices: {
        Row: {
          id: string;
          tenant_id: string;
          device_id: string;
          device_type: string;
          name: string;
          location: string | null;
          is_active: boolean;
          last_seen: string | null;
          battery_level: number | null;
          signal_strength: number | null;
          configuration: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          device_id: string;
          device_type: string;
          name: string;
          location?: string | null;
          is_active?: boolean;
          last_seen?: string | null;
          battery_level?: number | null;
          signal_strength?: number | null;
          configuration?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          device_id?: string;
          device_type?: string;
          name?: string;
          location?: string | null;
          is_active?: boolean;
          last_seen?: string | null;
          battery_level?: number | null;
          signal_strength?: number | null;
          configuration?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feed_inventory: {
        Row: {
          id: string;
          tenant_id: string;
          feed_name: string;
          feed_type: string;
          quantity: number;
          unit: string;
          cost_per_unit: number;
          supplier: string | null;
          purchase_date: string;
          expiry_date: string | null;
          storage_location: string;
          nutritional_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          feed_name: string;
          feed_type: string;
          quantity: number;
          unit: string;
          cost_per_unit: number;
          supplier?: string | null;
          purchase_date: string;
          expiry_date?: string | null;
          storage_location: string;
          nutritional_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          feed_name?: string;
          feed_type?: string;
          quantity?: number;
          unit?: string;
          cost_per_unit?: number;
          supplier?: string | null;
          purchase_date?: string;
          expiry_date?: string | null;
          storage_location?: string;
          nutritional_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_attendance: {
        Row: {
          id: string;
          tenant_id: string;
          staff_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          hours_worked: number | null;
          overtime_hours: number | null;
          task_type: string | null;
          notes: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          hours_worked?: number | null;
          overtime_hours?: number | null;
          task_type?: string | null;
          notes?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          hours_worked?: number | null;
          overtime_hours?: number | null;
          task_type?: string | null;
          notes?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          assigned_by: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date: string | null;
          completed_at: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          assigned_by: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          completed_at?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          assigned_by?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          completed_at?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          tenant_id: string;
          key_name: string;
          key_hash: string;
          key_prefix: string;
          permissions: string[];
          is_active: boolean;
          expires_at: string | null;
          last_used: string | null;
          usage_count: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          key_name: string;
          key_hash: string;
          key_prefix: string;
          permissions: string[];
          is_active?: boolean;
          expires_at?: string | null;
          last_used?: string | null;
          usage_count?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          key_name?: string;
          key_hash?: string;
          key_prefix?: string;
          permissions?: string[];
          is_active?: boolean;
          expires_at?: string | null;
          last_used?: string | null;
          usage_count?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          amount: number;
          currency: string;
          gateway: Database['public']['Enums']['payment_gateway'];
          status: Database['public']['Enums']['payment_status'];
          transaction_id: string | null;
          plan: Database['public']['Enums']['subscription_plan'];
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          amount: number;
          currency: string;
          gateway: Database['public']['Enums']['payment_gateway'];
          status?: Database['public']['Enums']['payment_status'];
          transaction_id?: string | null;
          plan: Database['public']['Enums']['subscription_plan'];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          amount?: number;
          currency?: string;
          gateway?: Database['public']['Enums']['payment_gateway'];
          status?: Database['public']['Enums']['payment_status'];
          transaction_id?: string | null;
          plan?: Database['public']['Enums']['subscription_plan'];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vaccination_schedules: {
        Row: {
          id: string;
          disease_id: string;
          vaccine_medicine_id: string;
          species: string;
          animal_age_start_months: number;
          animal_age_start_label: string;
          dose_number: number;
          interval_from_previous_days: number;
          booster_interval_months: number | null;
          is_core_vaccine: boolean;
          is_mandatory: boolean;
          recommended_by: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          disease_id: string;
          vaccine_medicine_id: string;
          species: string;
          animal_age_start_months: number;
          animal_age_start_label: string;
          dose_number: number;
          interval_from_previous_days: number;
          booster_interval_months?: number | null;
          is_core_vaccine?: boolean;
          is_mandatory?: boolean;
          recommended_by?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          disease_id?: string;
          vaccine_medicine_id?: string;
          species?: string;
          animal_age_start_months?: number;
          animal_age_start_label?: string;
          dose_number?: number;
          interval_from_previous_days?: number;
          booster_interval_months?: number | null;
          is_core_vaccine?: boolean;
          is_mandatory?: boolean;
          recommended_by?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      treatment_protocols: {
        Row: {
          id: string;
          disease_id: string;
          name: string;
          protocol_type: string;
          severity_level: string;
          steps: Json;
          medicines_required: Json;
          supportive_care: Json;
          dietary_recommendations: Json;
          isolation_required: boolean;
          quarantine_period_days: number | null;
          expected_recovery_days: number | null;
          success_rate: number | null;
          recommended_by: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          disease_id: string;
          name: string;
          protocol_type: string;
          severity_level: string;
          steps: Json;
          medicines_required: Json;
          supportive_care: Json;
          dietary_recommendations: Json;
          isolation_required?: boolean;
          quarantine_period_days?: number | null;
          expected_recovery_days?: number | null;
          success_rate?: number | null;
          recommended_by?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          disease_id?: string;
          name?: string;
          protocol_type?: string;
          severity_level?: string;
          steps?: Json;
          medicines_required?: Json;
          supportive_care?: Json;
          dietary_recommendations?: Json;
          isolation_required?: boolean;
          quarantine_period_days?: number | null;
          expected_recovery_days?: number | null;
          success_rate?: number | null;
          recommended_by?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medicine_inventory: {
        Row: {
          id: string;
          tenant_id: string;
          medicine_id: string;
          quantity: number;
          unit: string;
          batch_number: string | null;
          purchase_date: string | null;
          expiry_date: string | null;
          purchase_price: number | null;
          supplier: string | null;
          storage_location: string;
          reorder_level: number | null;
          current_stock: number;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          medicine_id: string;
          quantity: number;
          unit: string;
          batch_number?: string | null;
          purchase_date?: string | null;
          expiry_date?: string | null;
          purchase_price?: number | null;
          supplier?: string | null;
          storage_location: string;
          reorder_level?: number | null;
          current_stock?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          medicine_id?: string;
          quantity?: number;
          unit?: string;
          batch_number?: string | null;
          purchase_date?: string | null;
          expiry_date?: string | null;
          purchase_price?: number | null;
          supplier?: string | null;
          storage_location?: string;
          reorder_level?: number | null;
          current_stock?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          tenant_id: string;
          type: 'recommendation' | 'prediction' | 'alert' | 'optimization';
          category: 'feed' | 'milk' | 'health' | 'breeding' | 'financial';
          title: string;
          description: string;
          impact: 'high' | 'medium' | 'low';
          confidence: number;
          actionable: boolean;
          data: Json | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type: 'recommendation' | 'prediction' | 'alert' | 'optimization';
          category: 'feed' | 'milk' | 'health' | 'breeding' | 'financial';
          title: string;
          description: string;
          impact: 'high' | 'medium' | 'low';
          confidence: number;
          actionable: boolean;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          type?: 'recommendation' | 'prediction' | 'alert' | 'optimization';
          category?: 'feed' | 'milk' | 'health' | 'breeding' | 'financial';
          title?: string;
          description?: string;
          impact?: 'high' | 'medium' | 'low';
          confidence?: number;
          actionable?: boolean;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_animal_limit: { Args: { p_tenant_id: string }; Returns: boolean };
      get_next_farm_id: { Args: { p_year?: number }; Returns: string };
      get_tenant_animal_count: { Args: { p_tenant_id: string }; Returns: number };
      get_tenant_member_count: { Args: { p_tenant_id: string }; Returns: number };
      user_is_member_of_tenant: { Args: { tenant_uuid: string }; Returns: boolean };
    };
    Enums: {
      audit_action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout';
      farm_application_status:
        | 'pending'
        | 'payment_uploaded'
        | 'under_review'
        | 'approved'
        | 'rejected';
      payment_gateway: 'jazzcash' | 'easypaisa' | 'xpay' | 'bank_transfer';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'manual_verification';
      storage_provider: 'cloudinary' | 'supabase';
      subscription_plan: 'free' | 'professional' | 'farm' | 'enterprise';
      subscription_status:
        | 'active'
        | 'trial'
        | 'expired'
        | 'cancelled'
        | 'past_due'
        | 'pending_approval';
      user_platform_role: 'super_admin' | 'admin' | 'user';
      medicine_category:
        | 'antibiotic'
        | 'anti_inflammatory'
        | 'antiparasitic'
        | 'anthelmintic'
        | 'vaccine'
        | 'vitamin'
        | 'mineral'
        | 'hormonal'
        | 'antifungal'
        | 'antiseptic'
        | 'analgesic'
        | 'antipyretic'
        | 'antihistamine'
        | 'cardiac'
        | 'respiratory'
        | 'digestive'
        | 'reproductive'
        | 'topical';
      medicine_form:
        | 'injection'
        | 'oral_liquid'
        | 'oral_powder'
        | 'bolus'
        | 'tablet'
        | 'capsule'
        | 'paste'
        | 'ointment'
        | 'spray'
        | 'pour_on'
        | 'drench'
        | 'intramammary'
        | 'implant'
        | 'suspension';
      administration_route:
        | 'intramuscular'
        | 'intravenous'
        | 'subcutaneous'
        | 'oral'
        | 'intramammary'
        | 'topical'
        | 'intranasal'
        | 'intrauterine'
        | 'per_rectum'
        | 'pour_on';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Export helper types for convenience
export type Tables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row'];

export type TablesInsert<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Insert'];

export type TablesUpdate<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Update'];

export type Enums<EnumName extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][EnumName];

// Animal species type (commonly used across the application)
export type AnimalSpecies = 'cow' | 'buffalo' | 'chicken' | 'goat' | 'sheep' | 'horse';

// Animal status type
export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'sick' | 'quarantine';

// Milk session type
export type MilkSession = 'morning' | 'evening';

// Breeding method type
export type BreedingMethod = 'natural' | 'artificial_insemination';

// Breeding status type
export type BreedingStatus =
  | 'inseminated'
  | 'check_pending'
  | 'confirmed'
  | 'not_pregnant'
  | 'pregnant'
  | 'delivered'
  | 'failed'
  | 'overdue';

// Health record type
export type HealthRecordType = 'vaccination' | 'treatment' | 'checkup' | 'disease' | 'surgery';

// Expense category type
export type ExpenseCategory =
  | 'feed'
  | 'medicine'
  | 'labor'
  | 'equipment'
  | 'utilities'
  | 'veterinary'
  | 'maintenance'
  | 'other';

// Sale type
export type SaleType = 'milk' | 'animal' | 'egg' | 'manure' | 'other';

// Re-export common types for convenience
export type Animal = Tables<'animals'>;
export type MilkLog = Tables<'milk_logs'>;
export type HealthRecord = Tables<'health_records'>;
export type Expense = Tables<'expenses'>;
export type Sale = Tables<'sales'>;
export type Tenant = Tables<'tenants'>;
export type PlatformUser = Tables<'platform_users'>;

// Subscription types
export type SubscriptionPlan = Enums<'subscription_plan'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type PaymentGateway = Enums<'payment_gateway'>;
export type PaymentStatus = Enums<'payment_status'>;
export type AuditAction = Enums<'audit_action'>;
export type FarmApplicationStatus = Enums<'farm_application_status'>;
export type StorageProvider = Enums<'storage_provider'>;
export type UserPlatformRole = Enums<'user_platform_role'>;
