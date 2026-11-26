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
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          vat_id: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vat_id?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      invoice_emails: {
        Row: {
          created_at: string
          error: string | null
          id: string
          included_payment_link: boolean
          invoice_id: string
          message: string
          payment_amount_cents: number | null
          resend_email_id: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          included_payment_link?: boolean
          invoice_id: string
          message: string
          payment_amount_cents?: number | null
          resend_email_id?: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          to_email: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          included_payment_link?: boolean
          invoice_id?: string
          message?: string
          payment_amount_cents?: number | null
          resend_email_id?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          to_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_emails_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          net_cents: number
          position: number
          quantity: number
          unit: Database["public"]["Enums"]["line_unit"]
          unit_price_cents: number
          user_id: string
          vat_cents: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          net_cents?: number
          position: number
          quantity?: number
          unit?: Database["public"]["Enums"]["line_unit"]
          unit_price_cents?: number
          user_id?: string
          vat_cents?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          net_cents?: number
          position?: number
          quantity?: number
          unit?: Database["public"]["Enums"]["line_unit"]
          unit_price_cents?: number
          user_id?: string
          vat_cents?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_company_name: string | null
          client_display_name: string | null
          client_email: string | null
          client_full_name: string | null
          client_id: string | null
          client_vat_id: string | null
          comments: string | null
          content_hash: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          due_date: string
          first_sent_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_seq: number
          invoice_year: number
          last_sent_at: string | null
          last_sent_content_hash: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          paid_currency: Database["public"]["Enums"]["currency_code"] | null
          paid_method: Database["public"]["Enums"]["payment_method"] | null
          payment_amount_cents: number | null
          payment_currency: Database["public"]["Enums"]["currency_code"] | null
          payment_token: string | null
          pdf_content_hash: string | null
          pdf_generated_at: string | null
          pdf_path: string | null
          sender_address: string | null
          sender_company_name: string | null
          sender_email: string | null
          sender_full_name: string | null
          sender_vat_id: string | null
          sender_website: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_company_name?: string | null
          client_display_name?: string | null
          client_email?: string | null
          client_full_name?: string | null
          client_id?: string | null
          client_vat_id?: string | null
          comments?: string | null
          content_hash?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          due_date?: string
          first_sent_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_seq: number
          invoice_year: number
          last_sent_at?: string | null
          last_sent_content_hash?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          paid_currency?: Database["public"]["Enums"]["currency_code"] | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_amount_cents?: number | null
          payment_currency?: Database["public"]["Enums"]["currency_code"] | null
          payment_token?: string | null
          pdf_content_hash?: string | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          sender_address?: string | null
          sender_company_name?: string | null
          sender_email?: string | null
          sender_full_name?: string | null
          sender_vat_id?: string | null
          sender_website?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          client_address?: string | null
          client_company_name?: string | null
          client_display_name?: string | null
          client_email?: string | null
          client_full_name?: string | null
          client_id?: string | null
          client_vat_id?: string | null
          comments?: string | null
          content_hash?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          due_date?: string
          first_sent_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_seq?: number
          invoice_year?: number
          last_sent_at?: string | null
          last_sent_content_hash?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          paid_currency?: Database["public"]["Enums"]["currency_code"] | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_amount_cents?: number | null
          payment_currency?: Database["public"]["Enums"]["currency_code"] | null
          payment_token?: string | null
          pdf_content_hash?: string | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          sender_address?: string | null
          sender_company_name?: string | null
          sender_email?: string | null
          sender_full_name?: string | null
          sender_vat_id?: string | null
          sender_website?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          default_currency: Database["public"]["Enums"]["currency_code"]
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          vat_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          account: string | null
          id: string
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          account?: string | null
          id: string
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          account?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dashboard_paid_by_month: {
        Args: never
        Returns: {
          currency: Database["public"]["Enums"]["currency_code"]
          month: string
          paid_cents: number
          paid_to_date_cents: number
        }[]
      }
      dashboard_summary: {
        Args: never
        Returns: {
          currency: Database["public"]["Enums"]["currency_code"]
          outstanding_cents: number
          outstanding_count: number
          overdue_cents: number
          overdue_count: number
          paid_this_month_cents: number
        }[]
      }
      delete_client: {
        Args: { p_client_id: string; p_delete_unpaid?: boolean }
        Returns: {
          invoice_id: string
          pdf_path: string
          stripe_checkout_session_id: string
        }[]
      }
      save_invoice: {
        Args: { p_invoice: Json; p_items: Json }
        Returns: {
          client_address: string | null
          client_company_name: string | null
          client_display_name: string | null
          client_email: string | null
          client_full_name: string | null
          client_id: string | null
          client_vat_id: string | null
          comments: string | null
          content_hash: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          due_date: string
          first_sent_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_seq: number
          invoice_year: number
          last_sent_at: string | null
          last_sent_content_hash: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          paid_currency: Database["public"]["Enums"]["currency_code"] | null
          paid_method: Database["public"]["Enums"]["payment_method"] | null
          payment_amount_cents: number | null
          payment_currency: Database["public"]["Enums"]["currency_code"] | null
          payment_token: string | null
          pdf_content_hash: string | null
          pdf_generated_at: string | null
          pdf_path: string | null
          sender_address: string | null
          sender_company_name: string | null
          sender_email: string | null
          sender_full_name: string | null
          sender_vat_id: string | null
          sender_website: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      currency_code: "EUR" | "USD" | "BAM" | "GBP"
      email_status: "sent" | "failed"
      invoice_status: "draft" | "unpaid" | "paid"
      line_unit: "hours" | "flat"
      payment_method: "stripe" | "manual"
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
      currency_code: ["EUR", "USD", "BAM", "GBP"],
      email_status: ["sent", "failed"],
      invoice_status: ["draft", "unpaid", "paid"],
      line_unit: ["hours", "flat"],
      payment_method: ["stripe", "manual"],
    },
  },
} as const
