/**
 * Supabase Database Types
 *
 * 스키마: runhousecustom
 * 이 파일은 supabase gen types로 자동 생성할 수도 있음
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  runhousecustom: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          contact_email: string
          contact_phone: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          contact_email: string
          contact_phone?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          contact_email?: string
          contact_phone?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string | null
          phone: string
          organization_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email?: string | null
          phone: string
          organization_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string | null
          phone?: string
          organization_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          tenant_id: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          shipping_info: Json
          subtotal: number
          shipping_cost: number
          total_amount: number
          status: string
          admin_memo: string | null
          tracking_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          tenant_id: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          shipping_info: Json
          subtotal: number
          shipping_cost: number
          total_amount: number
          status?: string
          admin_memo?: string | null
          tracking_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          tenant_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          shipping_info?: Json
          subtotal?: number
          shipping_cost?: number
          total_amount?: number
          status?: string
          admin_memo?: string | null
          tracking_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          color: string
          color_label: string
          size: string
          quantity: number
          unit_price: number
          total_price: number
          design_snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          color: string
          color_label: string
          size: string
          quantity: number
          unit_price: number
          total_price: number
          design_snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          color?: string
          color_label?: string
          size?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          design_snapshot?: Json
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: string | null
          to_status: string
          changed_by: string
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: string | null
          to_status: string
          changed_by: string
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string
          memo?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          description: string | null
          category: string
          base_price: number
          images: Json
          variants: Json
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          description?: string | null
          category?: string
          base_price: number
          images?: Json
          variants?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          base_price?: number
          images?: Json
          variants?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_customizable_areas: {
        Row: {
          id: string
          product_id: string
          view_name: string
          display_name: string
          zone_x: number
          zone_y: number
          zone_width: number
          zone_height: number
          image_url: string | null
          is_enabled: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          product_id: string
          view_name: string
          display_name: string
          zone_x: number
          zone_y: number
          zone_width: number
          zone_height: number
          image_url?: string | null
          is_enabled?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          product_id?: string
          view_name?: string
          display_name?: string
          zone_x?: number
          zone_y?: number
          zone_width?: number
          zone_height?: number
          image_url?: string | null
          is_enabled?: boolean
          sort_order?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_today_order_count: {
        Args: { p_tenant_id: string }
        Returns: number
      }
    }
    Enums: {
      order_status:
        | 'pending'
        | 'design_confirmed'
        | 'preparing'
        | 'in_production'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
    }
  }
}
