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
      channel_logs: {
        Row: {
          id: number
          created_at: string
          channel_id: number
          log_entry: string
          new_status: Database["public"]["Enums"]["camera_status"] | null
          action_taken: Database["public"]["Enums"]["action_type"] | null
        }
        Insert: {
          id?: number
          created_at?: string
          channel_id: number
          log_entry: string
          new_status?: Database["public"]["Enums"]["camera_status"] | null
          action_taken?: Database["public"]["Enums"]["action_type"] | null
        }
        Update: {
          id?: number
          created_at?: string
          channel_id?: number
          log_entry?: string
          new_status?: Database["public"]["Enums"]["camera_status"] | null
          action_taken?: Database["public"]["Enums"]["action_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          action_notes: string | null
          action_taken: Database["public"]["Enums"]["action_type"] | null
          created_at: string
          device_id: number
          id: number
          name: string
          status: Database["public"]["Enums"]["camera_status"]
        }
        Insert: {
          action_notes?: string | null
          action_taken?: Database["public"]["Enums"]["action_type"] | null
          created_at?: string
          device_id: number
          id?: number
          name: string
          status?: Database["public"]["Enums"]["camera_status"]
        }
        Update: {
          action_notes?: string | null
          action_taken?: Database["public"]["Enums"]["action_type"] | null
          created_at?: string
          device_id?: number
          id?: number
          name?: string
          status?: Database["public"]["Enums"]["camera_status"]
        }
        Relationships: [
          {
            foreignKeyName: "channels_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          channel_count: number
          created_at: string
          division_id: number
          id: number
          location: string
          name: string
          type: Database["public"]["Enums"]["device_type"]
        }
        Insert: {
          channel_count?: number
          created_at?: string
          division_id: number
          id?: number
          location: string
          name: string
          type?: Database["public"]["Enums"]["device_type"]
        }
        Update: {
          channel_count?: number
          created_at?: string
          division_id?: number
          id?: number
          location?: string
          name?: string
          type?: Database["public"]["Enums"]["device_type"]
        }
        Relationships: [
          {
            foreignKeyName: "devices_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      layouts: {
        Row: {
          background_image_url: string | null
          background_rotation: number
          created_at: string
          division_id: number
          id: number
          placed_cameras: Json
        }
        Insert: {
          background_image_url?: string | null
          background_rotation?: number
          created_at?: string
          division_id: number
          id?: number
          placed_cameras?: Json
        }
        Update: {
          background_image_url?: string | null
          background_rotation?: number
          created_at?: string
          division_id?: number
          id?: number
          placed_cameras?: Json
        }
        Relationships: [
          {
            foreignKeyName: "layouts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: true
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_type:
        | "Requisição de Compras"
        | "Chamado para Obras"
        | "Relatório de Inspeção (RIF)"
      camera_status: "Online" | "Offline"
      device_type: "NVR" | "DVR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  T extends keyof Database["public"]["Enums"]
> = Database["public"]["Enums"][T]
