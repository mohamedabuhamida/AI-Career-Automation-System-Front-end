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
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          structured_data: Json | null;
          ats_score: number | null;
          version: number;
          status: "processing" | "processed" | "failed";
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          structured_data?: Json | null;
          ats_score?: number | null;
          version?: number;
          status?: "processing" | "processed" | "failed";
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          structured_data?: Json | null;
          ats_score?: number | null;
          version?: number;
          status?: "processing" | "processed" | "failed";
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cvs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      google_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_tokens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      emails_sent: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          company_email: string;
          job_title: string | null;
          job_description: string | null;
          cv_id: string | null;
          email_content: string | null;
          status: "pending" | "sent" | "failed" | "bounced";
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          company_email: string;
          job_title?: string | null;
          job_description?: string | null;
          cv_id?: string | null;
          email_content?: string | null;
          status?: "pending" | "sent" | "failed" | "bounced";
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          company_email?: string;
          job_title?: string | null;
          job_description?: string | null;
          cv_id?: string | null;
          email_content?: string | null;
          status?: "pending" | "sent" | "failed" | "bounced";
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emails_sent_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emails_sent_cv_id_fkey";
            columns: ["cv_id"];
            referencedRelation: "cvs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      email_sending_stats: {
        Row: {
          user_id: string | null;
          sending_date: string | null;
          status: string | null;
          count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "emails_sent_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_latest_cv: {
        Args: {
          user_uuid: string;
        };
        Returns: string;
      };
      get_daily_email_count: {
        Args: {
          user_uuid: string;
          check_date: string;
        };
        Returns: number;
      };
      check_email_rate_limit: {
        Args: {
          user_uuid: string;
        };
        Returns: boolean;
      };
      update_email_status: {
        Args: {
          email_id: string;
          new_status: string;
          error_msg?: string;
        };
        Returns: undefined;
      };
      encrypt_token: {
        Args: {
          token: string;
        };
        Returns: string;
      };
      decrypt_token: {
        Args: {
          encrypted_token: string;
        };
        Returns: string;
      };
    };
    Enums: {
      cv_status: "processing" | "processed" | "failed";
      email_status: "pending" | "sent" | "failed" | "bounced";
    };
  };
}

// Helper types for common operations
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Specific table types for easier imports
export type Profile = Tables<"profiles">;
export type CV = Tables<"cvs">;
export type GoogleToken = Tables<"google_tokens">;
export type EmailSent = Tables<"emails_sent">;

// Extended types for frontend use
export interface CVWithDetails extends CV {
  profile?: Profile;
}

export interface EmailWithDetails extends EmailSent {
  cv?: CV;
  profile?: Profile;
}

// Form types
export interface CVUploadForm {
  file: File;
}

export interface JobApplicationForm {
  company_name: string;
  company_email: string;
  job_title: string;
  job_description: string;
  cv_id?: string;
}

// Response types
export interface CVProcessResponse {
  id: string;
  structured_data: Json;
  ats_score: number;
  version: number;
}

export interface EmailSendResponse {
  id: string;
  status: EmailSent["status"];
  sent_at?: string;
}

// Error types
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
