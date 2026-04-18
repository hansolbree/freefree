export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      centers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          phone?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      user_centers: {
        Row: {
          id: string;
          user_id: string;
          center_id: string;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          center_id: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          color?: string;
          is_active?: boolean;
        };
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          center_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          is_recurring: boolean;
          recurrence_rule: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          center_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          center_id?: string;
          title?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          center_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          birth_date: string | null;
          gender: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          center_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          center_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          center_id: string;
          session_number: number;
          session_date: string;
          duration_minutes: number;
          session_type: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          center_id: string;
          session_number: number;
          session_date: string;
          duration_minutes?: number;
          session_type?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          center_id?: string;
          session_number?: number;
          session_date?: string;
          duration_minutes?: number;
          session_type?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
