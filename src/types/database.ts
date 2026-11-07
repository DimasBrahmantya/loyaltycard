export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          reward_text: string
          stamps_required: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string
          reward_text?: string
          stamps_required?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string
          reward_text?: string
          stamps_required?: number
          created_at?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          tenant_id: string
          user_id: string
          role: 'owner' | 'staff'
          created_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role: 'owner' | 'staff'
          created_at?: string
        }
        Update: {
          tenant_id?: string
          user_id?: string
          role?: 'owner' | 'staff'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      cards: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          public_token: string
          stamps_required: number
          stamps_count: number
          current_cycle: number
          status: 'active' | 'completed'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          public_token?: string
          stamps_required: number
          stamps_count?: number
          current_cycle?: number
          status?: 'active' | 'completed'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          public_token?: string
          stamps_required?: number
          stamps_count?: number
          current_cycle?: number
          status?: 'active' | 'completed'
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      stamps: {
        Row: {
          id: string
          tenant_id: string
          card_id: string
          cycle: number
          stamped_by: string | null
          note: string | null
          created_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          card_id: string
          cycle: number
          stamped_by?: string | null
          note?: string | null
          created_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          card_id?: string
          cycle?: number
          stamped_by?: string | null
          note?: string | null
          created_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stamps_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      redemptions: {
        Row: {
          id: string
          tenant_id: string
          card_id: string
          cycle: number
          redeemed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          card_id: string
          cycle: number
          redeemed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          card_id?: string
          cycle?: number
          redeemed_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      transaction_history: {
        Row: {
          id: string | null
          tenant_id: string | null
          card_id: string | null
          type: 'stamp' | 'void' | 'redeem' | null
          at: string | null
          actor: string | null
          note: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stamps_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      is_member: {
        Args: {
          tid: string
        }
        Returns: boolean
      }
      is_owner: {
        Args: {
          tid: string
        }
        Returns: boolean
      }
      create_tenant: {
        Args: {
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      create_card: {
        Args: {
          p_tenant: string
          p_name: string
          p_phone?: string | null
        }
        Returns: Database["public"]["Tables"]["cards"]["Row"]
      }
      add_stamp: {
        Args: {
          p_card: string
          p_note?: string | null
        }
        Returns: Database["public"]["Tables"]["cards"]["Row"]
      }
      void_stamp: {
        Args: {
          p_stamp: string
        }
        Returns: Database["public"]["Tables"]["cards"]["Row"]
      }
      redeem_card: {
        Args: {
          p_card: string
        }
        Returns: Database["public"]["Tables"]["cards"]["Row"]
      }
      get_public_card: {
        Args: {
          p_token: string
        }
        Returns: {
          tenant_name: string
          logo_url: string | null
          brand_color: string
          reward_text: string
          customer_name: string
          stamps_count: number
          stamps_required: number
          status: string
          rewards_redeemed: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

