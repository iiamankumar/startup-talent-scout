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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string
          engineer_id: string
          hire_request_id: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          engineer_id: string
          hire_request_id: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          engineer_id?: string
          hire_request_id?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "engineers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_hire_request_id_fkey"
            columns: ["hire_request_id"]
            isOneToOne: false
            referencedRelation: "hire_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          stage: Database["public"]["Enums"]["company_stage"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          stage?: Database["public"]["Enums"]["company_stage"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          stage?: Database["public"]["Enums"]["company_stage"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      engineer_reviews: {
        Row: {
          approved: boolean
          created_at: string
          engineer_id: string
          id: string
          quote: string
          rating: number
          reviewer_company: string | null
          reviewer_name: string
          reviewer_role: string | null
          reviewer_user_id: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          engineer_id: string
          id?: string
          quote: string
          rating: number
          reviewer_company?: string | null
          reviewer_name: string
          reviewer_role?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          engineer_id?: string
          id?: string
          quote?: string
          rating?: number
          reviewer_company?: string | null
          reviewer_name?: string
          reviewer_role?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      engineers: {
        Row: {
          ai_interview_completed_at: string | null
          ai_interview_score: number | null
          ai_interview_status: Database["public"]["Enums"]["interview_status"]
          ai_interview_summary: string | null
          ai_interview_transcript: Json
          available: boolean
          aveiq_score: number | null
          bio: string | null
          created_at: string
          display_name: string
          github_url: string | null
          headline: string | null
          hourly_rate_usd: number | null
          linkedin_url: string | null
          location: string | null
          main_interview_notes: string | null
          main_interview_scheduled_at: string | null
          main_interview_status: Database["public"]["Enums"]["interview_status"]
          main_interview_verdict: string | null
          main_interviewer_id: string | null
          resume_feedback: string | null
          resume_score: number | null
          resume_text: string | null
          resume_url: string | null
          skills: string[]
          updated_at: string
          user_id: string
          vetting: Database["public"]["Enums"]["vetting_status"]
          website_url: string | null
          work_authorization: Database["public"]["Enums"]["work_auth"]
          years_experience: number | null
        }
        Insert: {
          ai_interview_completed_at?: string | null
          ai_interview_score?: number | null
          ai_interview_status?: Database["public"]["Enums"]["interview_status"]
          ai_interview_summary?: string | null
          ai_interview_transcript?: Json
          available?: boolean
          aveiq_score?: number | null
          bio?: string | null
          created_at?: string
          display_name: string
          github_url?: string | null
          headline?: string | null
          hourly_rate_usd?: number | null
          linkedin_url?: string | null
          location?: string | null
          main_interview_notes?: string | null
          main_interview_scheduled_at?: string | null
          main_interview_status?: Database["public"]["Enums"]["interview_status"]
          main_interview_verdict?: string | null
          main_interviewer_id?: string | null
          resume_feedback?: string | null
          resume_score?: number | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id: string
          vetting?: Database["public"]["Enums"]["vetting_status"]
          website_url?: string | null
          work_authorization?: Database["public"]["Enums"]["work_auth"]
          years_experience?: number | null
        }
        Update: {
          ai_interview_completed_at?: string | null
          ai_interview_score?: number | null
          ai_interview_status?: Database["public"]["Enums"]["interview_status"]
          ai_interview_summary?: string | null
          ai_interview_transcript?: Json
          available?: boolean
          aveiq_score?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string
          github_url?: string | null
          headline?: string | null
          hourly_rate_usd?: number | null
          linkedin_url?: string | null
          location?: string | null
          main_interview_notes?: string | null
          main_interview_scheduled_at?: string | null
          main_interview_status?: Database["public"]["Enums"]["interview_status"]
          main_interview_verdict?: string | null
          main_interviewer_id?: string | null
          resume_feedback?: string | null
          resume_score?: number | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string
          vetting?: Database["public"]["Enums"]["vetting_status"]
          website_url?: string | null
          work_authorization?: Database["public"]["Enums"]["work_auth"]
          years_experience?: number | null
        }
        Relationships: []
      }
      hire_requests: {
        Row: {
          budget_monthly_usd: number | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          role_title: string
          stack: string[]
          status: Database["public"]["Enums"]["hire_status"]
          updated_at: string
          urgency: string | null
        }
        Insert: {
          budget_monthly_usd?: number | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          role_title: string
          stack?: string[]
          status?: Database["public"]["Enums"]["hire_status"]
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          budget_monthly_usd?: number | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          role_title?: string
          stack?: string[]
          status?: Database["public"]["Enums"]["hire_status"]
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hire_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "engineer" | "founder"
      application_status: "submitted" | "shortlisted" | "rejected" | "hired"
      company_stage: "idea" | "pre_seed" | "seed" | "series_a" | "series_b_plus"
      hire_status: "open" | "matched" | "closed"
      interview_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "passed"
        | "failed"
        | "skipped"
      vetting_status: "pending" | "in_review" | "vetted" | "rejected"
      work_auth:
        | "us_citizen"
        | "us_green_card"
        | "us_h1b"
        | "us_opt_cpt"
        | "us_tn"
        | "other_visa"
        | "india_resident"
        | "eu_resident"
        | "remote_only"
        | "unspecified"
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
  public: {
    Enums: {
      app_role: ["admin", "engineer", "founder"],
      application_status: ["submitted", "shortlisted", "rejected", "hired"],
      company_stage: ["idea", "pre_seed", "seed", "series_a", "series_b_plus"],
      hire_status: ["open", "matched", "closed"],
      interview_status: [
        "not_started",
        "in_progress",
        "completed",
        "passed",
        "failed",
        "skipped",
      ],
      vetting_status: ["pending", "in_review", "vetted", "rejected"],
      work_auth: [
        "us_citizen",
        "us_green_card",
        "us_h1b",
        "us_opt_cpt",
        "us_tn",
        "other_visa",
        "india_resident",
        "eu_resident",
        "remote_only",
        "unspecified",
      ],
    },
  },
} as const
