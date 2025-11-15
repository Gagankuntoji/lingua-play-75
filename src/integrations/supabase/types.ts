// Supabase Database Types
// This file defines the TypeScript types for your Supabase database schema
// You can generate this automatically using: npx supabase gen types typescript --project-id rqleadkduhpsilfscfwl

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
      profiles: {
        Row: {
          id: string
          email: string | null
          xp: number | null
          streak: number | null
          last_active: string | null
          created_at: string | null
          daily_goal_xp: number | null
          daily_goal_last_adjusted: string | null
        }
        Insert: {
          id: string
          email?: string | null
          xp?: number | null
          streak?: number | null
          last_active?: string | null
          created_at?: string | null
          daily_goal_xp?: number | null
          daily_goal_last_adjusted?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          xp?: number | null
          streak?: number | null
          last_active?: string | null
          created_at?: string | null
          daily_goal_xp?: number | null
          daily_goal_last_adjusted?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          language_from: string
          language_to: string
          flag_emoji: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          language_from: string
          language_to: string
          flag_emoji?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          language_from?: string
          language_to?: string
          flag_emoji?: string | null
          created_at?: string | null
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_index: number
          created_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order_index?: number
          created_at?: string | null
        }
      }
      items: {
        Row: {
          id: string
          lesson_id: string
          type: string
          question: string
          correct_answer: string
          options: Json | null
          audio_url: string | null
          explanation: string | null
          order_index: number
          created_at: string | null
          hint: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          type: string
          question: string
          correct_answer: string
          options?: Json | null
          audio_url?: string | null
          explanation?: string | null
          order_index: number
          created_at?: string | null
          hint?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          type?: string
          question?: string
          correct_answer?: string
          options?: Json | null
          audio_url?: string | null
          explanation?: string | null
          order_index?: number
          created_at?: string | null
          hint?: string | null
        }
      }
      user_item_state: {
        Row: {
          id: string
          user_id: string
          item_id: string
          ease_factor: number | null
          interval: number | null
          repetition_count: number | null
          next_due: string | null
          last_reviewed: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          ease_factor?: number | null
          interval?: number | null
          repetition_count?: number | null
          next_due?: string | null
          last_reviewed?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          ease_factor?: number | null
          interval?: number | null
          repetition_count?: number | null
          next_due?: string | null
          last_reviewed?: string | null
          created_at?: string | null
        }
      }
      exercise_attempts: {
        Row: {
          id: string
          user_id: string
          item_id: string
          user_answer: string
          correct: boolean
          score: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          user_answer: string
          correct: boolean
          score: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          user_answer?: string
          correct?: boolean
          score?: number
          created_at?: string | null
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          xp_earned: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          xp_earned?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          xp_earned?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
        }
      }
      playlists: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          focus_tag: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          focus_tag?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          focus_tag?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      playlist_lessons: {
        Row: {
          id: string
          playlist_id: string
          lesson_id: string
          order_index: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          playlist_id: string
          lesson_id: string
          order_index?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          playlist_id?: string
          lesson_id?: string
          order_index?: number | null
          created_at?: string | null
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

