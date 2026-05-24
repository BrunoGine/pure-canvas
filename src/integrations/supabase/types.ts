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
      ai_usage_log: {
        Row: {
          created_at: string
          feature: string
          id: string
          model: string
          prompt_chars: number | null
          response_chars: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          model: string
          prompt_chars?: number | null
          response_chars?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_chars?: number | null
          response_chars?: number | null
          user_id?: string
        }
        Relationships: []
      }
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
      budgets: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          id: string
          limit_amount: number
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string
          id?: string
          limit_amount: number
          period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      companies: {
        Row: {
          business_type: string | null
          created_at: string
          employees_count: number | null
          id: string
          main_goal: string | null
          monthly_revenue: number | null
          name: string
          segment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          employees_count?: number | null
          id?: string
          main_goal?: string | null
          monthly_revenue?: number | null
          name: string
          segment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          employees_count?: number | null
          id?: string
          main_goal?: string | null
          monthly_revenue?: number | null
          name?: string
          segment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
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
          audience: string
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
          audience?: string
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
          audience?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_credentials: {
        Row: {
          created_at: string
          credential_id: string
          device_label: string
          id: string
          last_used_at: string
          public_key: string
          sign_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          device_label?: string
          id?: string
          last_used_at?: string
          public_key: string
          sign_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          device_label?: string
          id?: string
          last_used_at?: string
          public_key?: string
          sign_count?: number
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          goal_type: string
          id: string
          image_url: string | null
          is_completed: boolean
          monthly_target_amount: number | null
          name: string
          target_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          image_url?: string | null
          is_completed?: boolean
          monthly_target_amount?: number | null
          name: string
          target_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          image_url?: string | null
          is_completed?: boolean
          monthly_target_amount?: number | null
          name?: string
          target_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content_md: string
          created_at: string
          id: string
          is_current: boolean
          kind: string
          published_at: string
          version: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          is_current?: boolean
          kind: string
          published_at?: string
          version: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          is_current?: boolean
          kind?: string
          published_at?: string
          version?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      plans: {
        Row: {
          created_at: string
          currency: string
          features: Json
          gateway_price_id_monthly: string | null
          gateway_price_id_yearly: string | null
          highlight: boolean
          key: Database["public"]["Enums"]["subscription_plan"]
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: Json
          gateway_price_id_monthly?: string | null
          gateway_price_id_yearly?: string | null
          highlight?: boolean
          key: Database["public"]["Enums"]["subscription_plan"]
          name: string
          price_monthly_cents?: number
          price_yearly_cents?: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          features?: Json
          gateway_price_id_monthly?: string | null
          gateway_price_id_yearly?: string | null
          highlight?: boolean
          key?: Database["public"]["Enums"]["subscription_plan"]
          name?: string
          price_monthly_cents?: number
          price_yearly_cents?: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          ai_use_business_data: boolean
          ai_use_financial_data: boolean
          created_at: string
          disable_social_recommendations: boolean
          email_essential: boolean
          email_financial_tips: boolean
          email_marketing: boolean
          email_product_updates: boolean
          hide_avatar_in_shared_goals: boolean
          hide_contribution_amount: boolean
          hide_profile_in_public_lists: boolean
          hide_recent_activity: boolean
          require_invite_approval: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_use_business_data?: boolean
          ai_use_financial_data?: boolean
          created_at?: string
          disable_social_recommendations?: boolean
          email_essential?: boolean
          email_financial_tips?: boolean
          email_marketing?: boolean
          email_product_updates?: boolean
          hide_avatar_in_shared_goals?: boolean
          hide_contribution_amount?: boolean
          hide_profile_in_public_lists?: boolean
          hide_recent_activity?: boolean
          require_invite_approval?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_use_business_data?: boolean
          ai_use_financial_data?: boolean
          created_at?: string
          disable_social_recommendations?: boolean
          email_essential?: boolean
          email_financial_tips?: boolean
          email_marketing?: boolean
          email_product_updates?: boolean
          hide_avatar_in_shared_goals?: boolean
          hide_contribution_amount?: boolean
          hide_profile_in_public_lists?: boolean
          hide_recent_activity?: boolean
          require_invite_approval?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_company_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          financial_goal: string | null
          has_emergency_fund: boolean | null
          id: string
          monthly_income: number | null
          onboarding_completed: boolean
          theme_preference: string | null
          tracks_expenses: string | null
          updated_at: string
        }
        Insert: {
          active_company_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          financial_goal?: string | null
          has_emergency_fund?: boolean | null
          id: string
          monthly_income?: number | null
          onboarding_completed?: boolean
          theme_preference?: string | null
          tracks_expenses?: string | null
          updated_at?: string
        }
        Update: {
          active_company_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          financial_goal?: string | null
          has_emergency_fund?: boolean | null
          id?: string
          monthly_income?: number | null
          onboarding_completed?: boolean
          theme_preference?: string | null
          tracks_expenses?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      subscription_overrides: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          granted_by: string
          id?: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end: boolean
          coupon_code: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_cents: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean
          coupon_code?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_cents?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean
          coupon_code?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_cents?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachments: Json | null
          category: string
          created_at: string
          id: string
          is_faq_candidate: boolean
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category?: string
          created_at?: string
          id?: string
          is_faq_candidate?: boolean
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string
          created_at?: string
          id?: string
          is_faq_candidate?: boolean
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
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
      user_legal_acceptances: {
        Row: {
          accepted_at: string
          document_id: string
          id: string
          ip: string | null
          kind: string
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document_id: string
          id?: string
          ip?: string | null
          kind: string
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document_id?: string
          id?: string
          ip?: string | null
          kind?: string
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
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
      admin_grant_override: {
        Args: {
          _duration_days: number
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _reason: string
          _user_id: string
        }
        Returns: {
          active: boolean
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscription_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_revoke_override: {
        Args: { _override_id: string }
        Returns: {
          active: boolean
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscription_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_search_users: {
        Args: { _query: string }
        Returns: {
          display_name: string
          email: string
          id: string
        }[]
      }
      approve_shared_contribution: {
        Args: { _contribution_id: string }
        Returns: string
      }
      award_user_badge: {
        Args: { _badge_key: string }
        Returns: {
          badge_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_badges"
          isOneToOne: true
          isSetofReturn: false
        }
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
      get_effective_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      get_shared_goal_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      get_shared_goal_profiles_v2: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          hide_avatar: boolean
          hide_contribution: boolean
          hide_profile: boolean
          id: string
        }[]
      }
      has_accepted_current_legal: { Args: { _uid: string }; Returns: boolean }
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
      issue_certificate: {
        Args: { _course_id: string }
        Returns: {
          code: string
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
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
      billing_interval: "month" | "year"
      payment_gateway: "stripe" | "mercadopago" | "none"
      shared_goal_role: "admin" | "member"
      shared_request_status: "pending" | "approved" | "rejected"
      subscription_plan: "free" | "premium" | "enterprise"
      subscription_status:
        | "active"
        | "trialing"
        | "expired"
        | "canceled"
        | "past_due"
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
      billing_interval: ["month", "year"],
      payment_gateway: ["stripe", "mercadopago", "none"],
      shared_goal_role: ["admin", "member"],
      shared_request_status: ["pending", "approved", "rejected"],
      subscription_plan: ["free", "premium", "enterprise"],
      subscription_status: [
        "active",
        "trialing",
        "expired",
        "canceled",
        "past_due",
      ],
    },
  },
} as const
