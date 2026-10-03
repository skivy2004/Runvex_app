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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          agent: string
          cache_read_tokens: number
          cache_write_tokens: number
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          purpose: string
          user_id: string
        }
        Insert: {
          agent: string
          cache_read_tokens?: number
          cache_write_tokens?: number
          cost_usd: number
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          purpose: string
          user_id?: string
        }
        Update: {
          agent?: string
          cache_read_tokens?: number
          cache_write_tokens?: number
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_sports: {
        Row: {
          created_at: string
          level: Database["public"]["Enums"]["experience_level"]
          sport: Database["public"]["Enums"]["sport"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          level: Database["public"]["Enums"]["experience_level"]
          sport: Database["public"]["Enums"]["sport"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          level?: Database["public"]["Enums"]["experience_level"]
          sport?: Database["public"]["Enums"]["sport"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          agent: string | null
          content: string
          created_at: string
          id: string
          proposal: Json | null
          proposal_status: string | null
          role: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          agent?: string | null
          content: string
          created_at?: string
          id?: string
          proposal?: Json | null
          proposal_status?: string | null
          role: string
          user_id?: string
          workout_id?: string | null
        }
        Update: {
          agent?: string | null
          content?: string
          created_at?: string
          id?: string
          proposal?: Json | null
          proposal_status?: string | null
          role?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "planned_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string
          event_date: string | null
          event_name: string | null
          id: string
          race_preset: string | null
          segments: Json
          sports: Database["public"]["Enums"]["sport"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_date?: string | null
          event_name?: string | null
          id?: string
          race_preset?: string | null
          segments?: Json
          sports?: Database["public"]["Enums"]["sport"][]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string | null
          event_name?: string | null
          id?: string
          race_preset?: string | null
          segments?: Json
          sports?: Database["public"]["Enums"]["sport"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      planned_workouts: {
        Row: {
          created_at: string
          duration_minutes: number
          feedback_note: string | null
          id: string
          notes: string | null
          position: number
          rpe: number | null
          scheduled_on: string
          sport: Database["public"]["Enums"]["sport"]
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          feedback_note?: string | null
          notes?: string | null
          position?: number
          rpe?: number | null
          scheduled_on: string
          sport: Database["public"]["Enums"]["sport"]
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          feedback_note?: string | null
          notes?: string | null
          position?: number
          rpe?: number | null
          scheduled_on?: string
          sport?: Database["public"]["Enums"]["sport"]
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          onboarding_completed_at: string | null
          pool_length: number
          swim_equipment: string[]
          timezone: string
          updated_at: string
          work_pattern: Database["public"]["Enums"]["work_pattern"] | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id: string
          locale?: Database["public"]["Enums"]["app_locale"]
          onboarding_completed_at?: string | null
          pool_length?: number
          swim_equipment?: string[]
          timezone?: string
          updated_at?: string
          work_pattern?: Database["public"]["Enums"]["work_pattern"] | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          onboarding_completed_at?: string | null
          pool_length?: number
          swim_equipment?: string[]
          timezone?: string
          updated_at?: string
          work_pattern?: Database["public"]["Enums"]["work_pattern"] | null
        }
        Relationships: []
      }
      weekly_availability: {
        Row: {
          available_minutes: number
          long_sessions: Database["public"]["Enums"]["sport"][]
          sports: Database["public"]["Enums"]["sport"][]
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          available_minutes?: number
          long_sessions?: Database["public"]["Enums"]["sport"][]
          sports?: Database["public"]["Enums"]["sport"][]
          updated_at?: string
          user_id?: string
          weekday: number
        }
        Update: {
          available_minutes?: number
          long_sessions?: Database["public"]["Enums"]["sport"][]
          sports?: Database["public"]["Enums"]["sport"][]
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
      complete_onboarding: {
        Args: {
          p_availability: Json
          p_date_of_birth: string
          p_display_name: string
          p_goal?: Json
          p_sports: Json
          p_work_pattern: Database["public"]["Enums"]["work_pattern"]
        }
        Returns: undefined
      }
      save_training_profile: {
        Args: {
          p_availability: Json
          p_goal?: Json
          p_sports: Json
          p_work_pattern: Database["public"]["Enums"]["work_pattern"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_locale: "en" | "nl"
      experience_level: "beginner" | "intermediate" | "advanced"
      sport: "running" | "cycling" | "swimming" | "strength"
      work_pattern: "fixed" | "variable" | "shifts"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_locale: ["en", "nl"],
      experience_level: ["beginner", "intermediate", "advanced"],
      sport: ["running", "cycling", "swimming", "strength"],
      work_pattern: ["fixed", "variable", "shifts"],
    },
  },
} as const
