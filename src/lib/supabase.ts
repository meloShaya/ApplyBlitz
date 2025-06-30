import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          location: string | null;
          linkedin_url: string | null;
          website_url: string | null;
          resume_url: string | null;
          profile_picture_url: string | null;
          summary: string | null;
          skills: string[] | null;
          experience_years: number;
          education: string | null;
          preferred_salary_min: number | null;
          preferred_salary_max: number | null;
          preferred_locations: string[] | null;
          preferred_job_types: string[] | null;
          preferred_remote: boolean;
          preferred_industries: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          plan_name: string;
          plan_price: number;
          applications_limit: number;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          company_name: string;
          job_url: string;
          job_board: string;
          salary_range: string | null;
          location: string | null;
          job_description: string | null;
          match_score: number | null;
          status: 'pending' | 'applied' | 'failed' | 'requires_action' | 'interview' | 'rejected' | 'offer';
          failure_reason: string | null;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
    };
  };
};