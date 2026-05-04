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
      bank_accounts: {
        Row: {
          account_type: string
          balance: number
          connection_id: string
          created_at: string
          currency: string
          id: string
          name: string
          pluggy_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          balance?: number
          connection_id: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          pluggy_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          balance?: number
          connection_id?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          pluggy_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          created_at: string
          id: string
          institution_name: string | null
          pluggy_item_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_name?: string | null
          pluggy_item_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_name?: string | null
          pluggy_item_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          connection_id: string
          created_at: string
          date: string
          description: string
          id: string
          pluggy_transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string | null
          connection_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          pluggy_transaction_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          connection_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          pluggy_transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          code?: string
          course_id: string
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          level: string
          order: number
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level?: string
          order?: number
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level?: string
          order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          bank: string
          brand: string
          closing_day: number
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank?: string
          brand?: string
          closing_day?: number
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank?: string
          brand?: string
          closing_day?: number
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          image_url: string | null
          is_completed: boolean
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          image_url?: string | null
          is_completed?: boolean
          name: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          image_url?: string | null
          is_completed?: boolean
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order: number
          questions: Json | null
          subtitle: string | null
          summary: string | null
          title: string
          updated_at: string
          video_credit: string | null
          xp_reward: number
          youtube_url: string
          youtube_video_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order?: number
          questions?: Json | null
          subtitle?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          video_credit?: string | null
          xp_reward?: number
          youtube_url: string
          youtube_video_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order?: number
          questions?: Json | null
          subtitle?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          video_credit?: string | null
          xp_reward?: number
          youtube_url?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_transactions: {
        Row: {
          amount: number
          card_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          goal_id: string | null
          id: string
          notes: string | null
          payment_method: string
          shared_goal_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          shared_goal_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          shared_goal_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          active: boolean
          amount: number
          card_id: string | null
          category: string
          created_at: string
          day_of_month: number
          description: string
          goal_id: string | null
          id: string
          last_executed_at: string | null
          notes: string | null
          payment_method: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          card_id?: string | null
          category?: string
          created_at?: string
          day_of_month?: number
          description: string
          goal_id?: string | null
          id?: string
          last_executed_at?: string | null
          notes?: string | null
          payment_method?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          day_of_month?: number
          description?: string
          goal_id?: string | null
          id?: string
          last_executed_at?: string | null
          notes?: string | null
          payment_method?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_goal_contributions: {
        Row: {
          amount: number
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          shared_goal_id: string
          status: Database["public"]["Enums"]["shared_request_status"]
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          shared_goal_id: string
          status?: Database["public"]["Enums"]["shared_request_status"]
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          shared_goal_id?: string
          status?: Database["public"]["Enums"]["shared_request_status"]
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goal_contributions_shared_goal_id_fkey"
            columns: ["shared_goal_id"]
            isOneToOne: false
            referencedRelation: "shared_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_goal_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          shared_goal_id: string
          status: Database["public"]["Enums"]["shared_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          shared_goal_id: string
          status?: Database["public"]["Enums"]["shared_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          shared_goal_id?: string
          status?: Database["public"]["Enums"]["shared_request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goal_join_requests_shared_goal_id_fkey"
            columns: ["shared_goal_id"]
            isOneToOne: false
            referencedRelation: "shared_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_goal_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["shared_goal_role"]
          shared_goal_id: string
          total_contributed: number
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["shared_goal_role"]
          shared_goal_id: string
          total_contributed?: number
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["shared_goal_role"]
          shared_goal_id?: string
          total_contributed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goal_members_shared_goal_id_fkey"
            columns: ["shared_goal_id"]
            isOneToOne: false
            referencedRelation: "shared_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          current_amount: number
          id: string
          invite_code: string
          is_completed: boolean
          name: string
          preset_key: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_amount?: number
          id?: string
          invite_code: string
          is_completed?: boolean
          name: string
          preset_key?: string
          target_amount: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_amount?: number
          id?: string
          invite_code?: string
          is_completed?: boolean
          name?: string
          preset_key?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          questions_passed: boolean
          score: number
          summary_read: boolean
          updated_at: string
          user_id: string
          video_watched: boolean
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          questions_passed?: boolean
          score?: number
          summary_read?: boolean
          updated_at?: string
          user_id: string
          video_watched?: boolean
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          questions_passed?: boolean
          score?: number
          summary_read?: boolean
          updated_at?: string
          user_id?: string
          video_watched?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      user_stats: {
        Row: {
          last_activity_date: string | null
          level: number
          streak: number
          streak_protection: number
          streak_protection_reset_at: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          last_activity_date?: string | null
          level?: number
          streak?: number
          streak_protection?: number
          streak_protection_reset_at?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          last_activity_date?: string | null
          level?: number
          streak?: number
          streak_protection?: number
          streak_protection_reset_at?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_shared_contribution: {
        Args: { _contribution_id: string }
        Returns: string
      }
      award_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: {
          last_activity_date: string | null
          level: number
          streak: number
          streak_protection: number
          streak_protection_reset_at: string
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_shared_goal_by_code: {
        Args: { _code: string }
        Returns: {
          current_amount: number
          id: string
          is_completed: boolean
          member_count: number
          name: string
          preset_key: string
          target_amount: number
        }[]
      }
      gen_invite_code: { Args: never; Returns: string }
      get_shared_goal_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_shared_goal_admin: {
        Args: { _goal: string; _user: string }
        Returns: boolean
      }
      is_shared_goal_member: {
        Args: { _goal: string; _user: string }
        Returns: boolean
      }
      update_streak: {
        Args: { _user_id: string }
        Returns: {
          last_activity_date: string | null
          level: number
          streak: number
          streak_protection: number
          streak_protection_reset_at: string
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      shared_goal_role: "admin" | "member"
      shared_request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      shared_goal_role: ["admin", "member"],
      shared_request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
