// src/lib/supabase/types.ts
// Hand-written TypeScript types matching the RemixEngine database schema.
// Regenerate after schema changes:
//   npx supabase gen types typescript --local > src/lib/supabase/types.ts
// (Requires local Supabase running via Docker)

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
      re_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'editor' | 'viewer'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'editor' | 'viewer'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          role?: 'admin' | 'editor' | 'viewer'
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      re_projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          status: 'draft' | 'scraping' | 'remixing' | 'generating' | 'assembling' | 'complete' | 'error'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          status?: 'draft' | 'scraping' | 'remixing' | 'generating' | 'assembling' | 'complete' | 'error'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'draft' | 'scraping' | 'remixing' | 'generating' | 'assembling' | 'complete' | 'error'
          settings?: Json
          updated_at?: string
        }
      }
      re_batch_jobs: {
        Row: {
          id: string
          project_id: string
          channel_url: string | null
          channel_id: string | null
          channel_name: string | null
          total_videos: number
          completed_videos: number
          status: 'pending' | 'scraping' | 'scraped' | 'processing' | 'complete' | 'error'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          channel_url?: string | null
          channel_id?: string | null
          channel_name?: string | null
          total_videos?: number
          completed_videos?: number
          status?: 'pending' | 'scraping' | 'scraped' | 'processing' | 'complete' | 'error'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          channel_url?: string | null
          channel_id?: string | null
          channel_name?: string | null
          total_videos?: number
          completed_videos?: number
          status?: 'pending' | 'scraping' | 'scraped' | 'processing' | 'complete' | 'error'
          updated_at?: string
        }
      }
      re_videos: {
        Row: {
          id: string
          project_id: string
          batch_job_id: string | null
          youtube_url: string
          youtube_id: string
          original_title: string | null
          original_description: string | null
          original_thumbnail_url: string | null
          original_transcript: string | null
          channel_name: string | null
          channel_id: string | null
          duration_seconds: number | null
          view_count: number | null
          published_at: string | null
          video_file_path: string | null
          thumbnail_file_path: string | null
          transcript_file_path: string | null
          scrape_status: 'pending' | 'processing' | 'complete' | 'error'
          remix_status: 'pending' | 'processing' | 'complete' | 'error'
          generation_status: 'pending' | 'processing' | 'complete' | 'error'
          assembly_status: 'pending' | 'processing' | 'complete' | 'error'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          batch_job_id?: string | null
          youtube_url: string
          youtube_id: string
          original_title?: string | null
          original_description?: string | null
          original_thumbnail_url?: string | null
          original_transcript?: string | null
          channel_name?: string | null
          channel_id?: string | null
          duration_seconds?: number | null
          view_count?: number | null
          published_at?: string | null
          video_file_path?: string | null
          thumbnail_file_path?: string | null
          transcript_file_path?: string | null
          scrape_status?: 'pending' | 'processing' | 'complete' | 'error'
          remix_status?: 'pending' | 'processing' | 'complete' | 'error'
          generation_status?: 'pending' | 'processing' | 'complete' | 'error'
          assembly_status?: 'pending' | 'processing' | 'complete' | 'error'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          original_title?: string | null
          original_description?: string | null
          original_thumbnail_url?: string | null
          original_transcript?: string | null
          duration_seconds?: number | null
          view_count?: number | null
          published_at?: string | null
          video_file_path?: string | null
          thumbnail_file_path?: string | null
          transcript_file_path?: string | null
          scrape_status?: 'pending' | 'processing' | 'complete' | 'error'
          remix_status?: 'pending' | 'processing' | 'complete' | 'error'
          generation_status?: 'pending' | 'processing' | 'complete' | 'error'
          assembly_status?: 'pending' | 'processing' | 'complete' | 'error'
          error_message?: string | null
          updated_at?: string
        }
      }
      re_remixed_titles: {
        Row: {
          id: string
          video_id: string
          style: string
          title: string
          reasoning: string | null
          is_selected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          style: string
          title: string
          reasoning?: string | null
          is_selected?: boolean
          created_at?: string
        }
        Update: {
          style?: string
          title?: string
          reasoning?: string | null
          is_selected?: boolean
        }
      }
      re_remixed_thumbnails: {
        Row: {
          id: string
          video_id: string
          prompt: string
          analysis: string | null
          file_path: string
          is_selected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          prompt: string
          analysis?: string | null
          file_path: string
          is_selected?: boolean
          created_at?: string
        }
        Update: {
          prompt?: string
          analysis?: string | null
          file_path?: string
          is_selected?: boolean
        }
      }
      re_remixed_scripts: {
        Row: {
          id: string
          video_id: string
          full_script: string
          tone: string | null
          target_audience: string | null
          total_duration_seconds: number | null
          is_selected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          full_script: string
          tone?: string | null
          target_audience?: string | null
          total_duration_seconds?: number | null
          is_selected?: boolean
          created_at?: string
        }
        Update: {
          full_script?: string
          tone?: string | null
          target_audience?: string | null
          total_duration_seconds?: number | null
          is_selected?: boolean
        }
      }
      re_scenes: {
        Row: {
          id: string
          script_id: string
          scene_number: number
          dialogue_line: string
          duration_seconds: number
          broll_description: string
          on_screen_text: string | null
          audio_file_path: string | null
          avatar_video_path: string | null
          broll_video_path: string | null
          audio_status: 'pending' | 'processing' | 'complete' | 'error'
          avatar_status: 'pending' | 'processing' | 'complete' | 'error'
          broll_status: 'pending' | 'processing' | 'complete' | 'error'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          script_id: string
          scene_number: number
          dialogue_line: string
          duration_seconds: number
          broll_description: string
          on_screen_text?: string | null
          audio_file_path?: string | null
          avatar_video_path?: string | null
          broll_video_path?: string | null
          audio_status?: 'pending' | 'processing' | 'complete' | 'error'
          avatar_status?: 'pending' | 'processing' | 'complete' | 'error'
          broll_status?: 'pending' | 'processing' | 'complete' | 'error'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          dialogue_line?: string
          duration_seconds?: number
          broll_description?: string
          on_screen_text?: string | null
          audio_file_path?: string | null
          avatar_video_path?: string | null
          broll_video_path?: string | null
          audio_status?: 'pending' | 'processing' | 'complete' | 'error'
          avatar_status?: 'pending' | 'processing' | 'complete' | 'error'
          broll_status?: 'pending' | 'processing' | 'complete' | 'error'
          error_message?: string | null
        }
      }
      re_rendered_videos: {
        Row: {
          id: string
          video_id: string
          script_id: string
          file_path: string
          duration_seconds: number | null
          resolution: string | null
          file_size_bytes: number | null
          render_time_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          script_id: string
          file_path: string
          duration_seconds?: number | null
          resolution?: string | null
          file_size_bytes?: number | null
          render_time_seconds?: number | null
          created_at?: string
        }
        Update: {
          file_path?: string
          duration_seconds?: number | null
          resolution?: string | null
          file_size_bytes?: number | null
          render_time_seconds?: number | null
        }
      }
      re_jobs: {
        Row: {
          id: string
          type:
            | 'scrape'
            | 'scrape_batch'
            | 'remix_title'
            | 'remix_thumbnail'
            | 'remix_script'
            | 'generate_audio'
            | 'generate_avatar'
            | 'generate_broll'
            | 'render'
          status: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled'
          video_id: string | null
          project_id: string | null
          scene_id: string | null
          progress: number
          result: Json | null
          error_message: string | null
          retry_count: number
          max_retries: number
          created_by: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type:
            | 'scrape'
            | 'scrape_batch'
            | 'remix_title'
            | 'remix_thumbnail'
            | 'remix_script'
            | 'generate_audio'
            | 'generate_avatar'
            | 'generate_broll'
            | 'render'
          status?: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled'
          video_id?: string | null
          project_id?: string | null
          scene_id?: string | null
          progress?: number
          result?: Json | null
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          created_by?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled'
          progress?: number
          result?: Json | null
          error_message?: string | null
          retry_count?: number
          started_at?: string | null
          completed_at?: string | null
        }
      }
      re_api_usage: {
        Row: {
          id: string
          service: 'gemini' | 'fal_ai' | 'elevenlabs' | 'heygen' | 'runway' | 'kling' | 'youtube'
          endpoint: string
          tokens_used: number | null
          characters_used: number | null
          minutes_used: number | null
          cost_estimate: number
          video_id: string | null
          project_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service: 'gemini' | 'fal_ai' | 'elevenlabs' | 'heygen' | 'runway' | 'kling' | 'youtube'
          endpoint: string
          tokens_used?: number | null
          characters_used?: number | null
          minutes_used?: number | null
          cost_estimate?: number
          video_id?: string | null
          project_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          tokens_used?: number | null
          characters_used?: number | null
          minutes_used?: number | null
          cost_estimate?: number
        }
      }
      re_system_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          value?: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_user: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_editor_or_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
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

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Named row types for convenience
export type ReUser = Tables<'re_users'>
export type ReProject = Tables<'re_projects'>
export type ReBatchJob = Tables<'re_batch_jobs'>
export type ReVideo = Tables<'re_videos'>
export type ReRemixedTitle = Tables<'re_remixed_titles'>
export type ReRemixedThumbnail = Tables<'re_remixed_thumbnails'>
export type ReRemixedScript = Tables<'re_remixed_scripts'>
export type ReScene = Tables<'re_scenes'>
export type ReRenderedVideo = Tables<'re_rendered_videos'>
export type ReJob = Tables<'re_jobs'>
export type ReApiUsage = Tables<'re_api_usage'>
export type ReSystemSetting = Tables<'re_system_settings'>
