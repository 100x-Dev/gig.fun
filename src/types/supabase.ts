export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          price: number
          currency: string
          delivery_days: number
          category: string
          tags: string[] | null
          status: string
          fid: number
          user_name: string | null
          user_pfp: string | null
          wallet_address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          price: number
          currency: string
          delivery_days: number
          category: string
          tags?: string[] | null
          status?: string
          fid: number
          user_name?: string | null
          user_pfp?: string | null
          wallet_address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          delivery_days?: number
          category?: string
          tags?: string[] | null
          status?: string
          fid?: number
          user_name?: string | null
          user_pfp?: string | null
          wallet_address?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
