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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_contact: string
          lead_id: string | null
          lead_name: string
          status: string
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_contact: string
          lead_id?: string | null
          lead_name: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_contact?: string
          lead_id?: string | null
          lead_name?: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      cta_clicks: {
        Row: {
          created_at: string
          cta_text: string | null
          id: string
          page: string
          section: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          id?: string
          page: string
          section: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          id?: string
          page?: string
          section?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ctas: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          image_url: string | null
          text: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          image_url?: string | null
          text: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          image_url?: string | null
          text?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ctas_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          lead_count: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_count?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_count?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          channel: string
          content: string
          conversation_id: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          metadata: Json | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          channel: string
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          folder_id: string | null
          id: string
          intent_signal: string
          is_competitor: boolean
          location: string | null
          name: string
          phone: string | null
          position: string | null
          sources: string[] | null
          status: string
          telegram: string | null
          urgency: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          folder_id?: string | null
          id?: string
          intent_signal: string
          is_competitor?: boolean
          location?: string | null
          name: string
          phone?: string | null
          position?: string | null
          sources?: string[] | null
          status?: string
          telegram?: string | null
          urgency?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          folder_id?: string | null
          id?: string
          intent_signal?: string
          is_competitor?: boolean
          location?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          sources?: string[] | null
          status?: string
          telegram?: string | null
          urgency?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          channel: string
          id: string
          lead_id: string | null
          lead_name: string
          message: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          id?: string
          lead_id?: string | null
          lead_name: string
          message: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          id?: string
          lead_id?: string | null
          lead_name?: string
          message?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          leads_used: number
          name: string
          plan: string
          plan_type: string
          searches_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          leads_used?: number
          name: string
          plan?: string
          plan_type?: string
          searches_used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          leads_used?: number
          name?: string
          plan?: string
          plan_type?: string
          searches_used?: number
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          category: string
          created_at: string
          folder_id: string | null
          id: string
          insights: Json | null
          leads_found: number
          leads_saved: number
          name: string
          niche: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          folder_id?: string | null
          id?: string
          insights?: Json | null
          leads_found?: number
          leads_saved?: number
          name: string
          niche: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          insights?: Json | null
          leads_found?: number
          leads_saved?: number
          name?: string
          niche?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_slots: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          slot_number: number
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          slot_number: number
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          slot_number?: number
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      user_messaging_credentials: {
        Row: {
          created_at: string
          email_configured: boolean
          email_from_address: string | null
          email_from_name: string | null
          id: string
          metadata: Json | null
          resend_api_key: string | null
          sms_configured: boolean
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string
          user_id: string
          whatsapp_access_token: string | null
          whatsapp_configured: boolean
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          created_at?: string
          email_configured?: boolean
          email_from_address?: string | null
          email_from_name?: string | null
          id?: string
          metadata?: Json | null
          resend_api_key?: string | null
          sms_configured?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id: string
          whatsapp_access_token?: string | null
          whatsapp_configured?: boolean
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          created_at?: string
          email_configured?: boolean
          email_from_address?: string | null
          email_from_name?: string | null
          id?: string
          metadata?: Json | null
          resend_api_key?: string | null
          sms_configured?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_access_token?: string | null
          whatsapp_configured?: boolean
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
      user_messaging_usage: {
        Row: {
          billing_cycle_start: string
          created_at: string
          email_limit: number
          email_used: number
          id: string
          sms_limit: number
          sms_used: number
          updated_at: string
          user_id: string
          whatsapp_limit: number
          whatsapp_used: number
        }
        Insert: {
          billing_cycle_start?: string
          created_at?: string
          email_limit?: number
          email_used?: number
          id?: string
          sms_limit?: number
          sms_used?: number
          updated_at?: string
          user_id: string
          whatsapp_limit?: number
          whatsapp_used?: number
        }
        Update: {
          billing_cycle_start?: string
          created_at?: string
          email_limit?: number
          email_used?: number
          id?: string
          sms_limit?: number
          sms_used?: number
          updated_at?: string
          user_id?: string
          whatsapp_limit?: number
          whatsapp_used?: number
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
          role?: Database["public"]["Enums"]["app_role"]
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
      check_messaging_limit: {
        Args: { _channel: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_messaging_usage: {
        Args: { _channel: string; _user_id: string }
        Returns: boolean
      }
      is_lead_owner: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      owns_resource: { Args: { _resource_user_id: string }; Returns: boolean }
      reset_monthly_usage: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
