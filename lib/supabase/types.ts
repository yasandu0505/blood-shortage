export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BloodStatus = 'critical' | 'low' | 'normal'
export type AuditAction = 'create' | 'update' | 'delete'
export type UserRole = 'admin' | 'editor'

export interface Database {
  public: {
    Tables: {
      centers: {
        Row: {
          id: string
          name: string
          district: string
          address: string | null
          phone: string | null
          opening_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          district: string
          address?: string | null
          phone?: string | null
          opening_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          district?: string
          address?: string | null
          phone?: string | null
          opening_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_centers: {
        Row: {
          id: string
          user_id: string
          center_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          center_id: string
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          center_id?: string
          role?: UserRole
          created_at?: string
        }
      }
      shortages: {
        Row: {
          id: string
          center_id: string
          blood_type: string
          status: BloodStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          center_id: string
          blood_type: string
          status?: BloodStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          center_id?: string
          blood_type?: string
          status?: BloodStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          center_id: string | null
          action: AuditAction
          table_name: string
          old_data: Json | null
          new_data: Json | null
          timestamp: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          center_id?: string | null
          action: AuditAction
          table_name: string
          old_data?: Json | null
          new_data?: Json | null
          timestamp?: string
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          center_id?: string | null
          action?: AuditAction
          table_name?: string
          old_data?: Json | null
          new_data?: Json | null
          timestamp?: string
          ip_address?: string | null
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
      blood_status: BloodStatus
      audit_action: AuditAction
      user_role: UserRole
    }
  }
}

