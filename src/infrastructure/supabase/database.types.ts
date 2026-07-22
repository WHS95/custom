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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  runhousecustom: {
    Tables: {
      customer_auth_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_auth_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_auth_users: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          organization_name: string | null
          phone: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization_name?: string | null
          phone: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization_name?: string | null
          phone?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string
          color_label: string
          created_at: string
          design_snapshot: Json
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          size: string
          total_price: number
          unit_price: number
        }
        Insert: {
          color: string
          color_label: string
          created_at?: string
          design_snapshot: Json
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          size: string
          total_price: number
          unit_price: number
        }
        Update: {
          color?: string
          color_label?: string
          created_at?: string
          design_snapshot?: Json
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          size?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status:
            | Database["runhousecustom"]["Enums"]["order_status"]
            | null
          id: string
          memo: string | null
          order_id: string
          to_status: Database["runhousecustom"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?:
            | Database["runhousecustom"]["Enums"]["order_status"]
            | null
          id?: string
          memo?: string | null
          order_id: string
          to_status: Database["runhousecustom"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?:
            | Database["runhousecustom"]["Enums"]["order_status"]
            | null
          id?: string
          memo?: string | null
          order_id?: string
          to_status?: Database["runhousecustom"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_memo: string | null
          attachment_files: Json | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          order_number: string
          shipping_cost: number
          shipping_info: Json
          status: Database["runhousecustom"]["Enums"]["order_status"]
          subtotal: number
          tenant_id: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_memo?: string | null
          attachment_files?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          order_number: string
          shipping_cost: number
          shipping_info: Json
          status?: Database["runhousecustom"]["Enums"]["order_status"]
          subtotal: number
          tenant_id: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_memo?: string | null
          attachment_files?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          order_number?: string
          shipping_cost?: number
          shipping_info?: Json
          status?: Database["runhousecustom"]["Enums"]["order_status"]
          subtotal?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_customizable_areas: {
        Row: {
          color_id: string | null
          created_at: string
          display_name: string
          id: string
          image_url: string | null
          is_enabled: boolean
          product_id: string
          sort_order: number
          view_name: string
          zone_height: number
          zone_width: number
          zone_x: number
          zone_y: number
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          product_id: string
          sort_order?: number
          view_name: string
          zone_height: number
          zone_width: number
          zone_x: number
          zone_y: number
        }
        Update: {
          color_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          product_id?: string
          sort_order?: number
          view_name?: string
          zone_height?: number
          zone_width?: number
          zone_x?: number
          zone_y?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_customizable_areas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_message: string | null
          base_price: number
          category: string
          created_at: string
          description: string | null
          detail_image_url: string | null
          id: string
          images: Json | null
          is_active: boolean
          name: string
          price_tiers: Json | null
          slug: string
          sort_order: number
          tenant_id: string
          updated_at: string
          variants: Json | null
        }
        Insert: {
          admin_message?: string | null
          base_price: number
          category?: string
          created_at?: string
          description?: string | null
          detail_image_url?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          name: string
          price_tiers?: Json | null
          slug: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          admin_message?: string | null
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          detail_image_url?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          name?: string
          price_tiers?: Json | null
          slug?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_memo: string | null
          approved_at: string | null
          author_name: string
          author_type: string
          content: string
          created_at: string
          id: string
          images: Json | null
          is_featured: boolean
          order_id: string | null
          organization_name: string | null
          rating: number
          sort_order: number
          status: Database["runhousecustom"]["Enums"]["review_status"]
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          admin_memo?: string | null
          approved_at?: string | null
          author_name: string
          author_type?: string
          content: string
          created_at?: string
          id?: string
          images?: Json | null
          is_featured?: boolean
          order_id?: string | null
          organization_name?: string | null
          rating: number
          sort_order?: number
          status?: Database["runhousecustom"]["Enums"]["review_status"]
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          admin_memo?: string | null
          approved_at?: string | null
          author_name?: string
          author_type?: string
          content?: string
          created_at?: string
          id?: string
          images?: Json | null
          is_featured?: boolean
          order_id?: string | null
          organization_name?: string | null
          rating?: number
          sort_order?: number
          status?: Database["runhousecustom"]["Enums"]["review_status"]
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      size_collection_responses: {
        Row: {
          collection_id: string
          color_id: string | null
          created_at: string
          edit_token: string
          id: string
          is_paid: boolean
          name: string
          note: string | null
          quantity: number
          size: string
          updated_at: string
        }
        Insert: {
          collection_id: string
          color_id?: string | null
          created_at?: string
          edit_token: string
          id?: string
          is_paid?: boolean
          name: string
          note?: string | null
          quantity?: number
          size: string
          updated_at?: string
        }
        Update: {
          collection_id?: string
          color_id?: string | null
          created_at?: string
          edit_token?: string
          id?: string
          is_paid?: boolean
          name?: string
          note?: string | null
          quantity?: number
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_collection_responses_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "size_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      size_collections: {
        Row: {
          admin_token: string
          allowed_colors: Json | null
          created_at: string
          creator_user_id: string | null
          crew_name: string | null
          deadline: string | null
          deposit_info: string | null
          id: string
          order_number: string | null
          product_id: string | null
          status: string
          tenant_id: string
          title: string
          token: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          admin_token: string
          allowed_colors?: Json | null
          created_at?: string
          creator_user_id?: string | null
          crew_name?: string | null
          deadline?: string | null
          deposit_info?: string | null
          id?: string
          order_number?: string | null
          product_id?: string | null
          status?: string
          tenant_id: string
          title: string
          token: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          admin_token?: string
          allowed_colors?: Json | null
          created_at?: string
          creator_user_id?: string | null
          crew_name?: string | null
          deadline?: string | null
          deposit_info?: string | null
          id?: string
          order_number?: string | null
          product_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          token?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_collections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_admins: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          password_hash: string
          tenant_id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash: string
          tenant_id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string
          tenant_id?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_admins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_carts: {
        Row: {
          color: string
          color_label: string
          created_at: string
          design_layers: Json
          id: string
          product_id: string
          product_name: string
          quantity: number
          size: string
          tenant_id: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          color_label: string
          created_at?: string
          design_layers?: Json
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          size: string
          tenant_id?: string
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          color_label?: string
          created_at?: string
          design_layers?: Json
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          size?: string
          tenant_id?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_carts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      used_sso_tokens: {
        Row: {
          jti: string
          aud: string
          exp: string
          used_at: string
        }
        Insert: {
          jti: string
          aud: string
          exp: string
          used_at?: string
        }
        Update: {
          jti?: string
          aud?: string
          exp?: string
          used_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          crew_name: string | null
          default_address: Json | null
          id: string
          marketing_agreed: boolean
          marketing_agreed_at: string | null
          name: string
          phone: string
          tenant_id: string
          updated_at: string
          user_id: string
          user_type: Database["runhousecustom"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          crew_name?: string | null
          default_address?: Json | null
          id?: string
          marketing_agreed?: boolean
          marketing_agreed_at?: string | null
          name: string
          phone?: string
          tenant_id?: string
          updated_at?: string
          user_id: string
          user_type?: Database["runhousecustom"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          crew_name?: string | null
          default_address?: Json | null
          id?: string
          marketing_agreed?: boolean
          marketing_agreed_at?: string | null
          name?: string
          phone?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          user_type?: Database["runhousecustom"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "customer_auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      crew_stats: {
        Row: {
          crew_name: string | null
          member_count: number | null
          order_count: number | null
          total_amount: number | null
        }
        Relationships: []
      }
      order_list_view: {
        Row: {
          admin_memo: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string | null
          item_count: number | null
          order_number: string | null
          organization_name: string | null
          recipient_name: string | null
          shipping_cost: number | null
          status: Database["runhousecustom"]["Enums"]["order_status"] | null
          subtotal: number | null
          tenant_id: string | null
          tenant_name: string | null
          total_amount: number | null
          total_quantity: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_order_number: { Args: { p_tenant_id: string }; Returns: string }
      get_today_order_count: { Args: { p_tenant_id: string }; Returns: number }
    }
    Enums: {
      order_status:
        | "pending"
        | "design_confirmed"
        | "preparing"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
      review_status: "pending" | "approved" | "rejected"
      user_type: "individual" | "crew_staff" | "crew_pending"
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
  runhousecustom: {
    Enums: {
      order_status: [
        "pending",
        "design_confirmed",
        "preparing",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected"],
      user_type: ["individual", "crew_staff", "crew_pending"],
    },
  },
} as const
