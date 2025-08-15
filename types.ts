import { Database } from './types/supabase';

// --- Base Supabase Row Types ---
type SupabaseDivision = Database['public']['Tables']['divisions']['Row'];
type SupabaseChannel = Database['public']['Tables']['channels']['Row'];
type SupabaseDevice = Database['public']['Tables']['devices']['Row'];
type SupabaseLayout = Database['public']['Tables']['layouts']['Row'];

// --- Enums (re-export for convenience) ---
export enum CameraStatus {
  Online = 'Online',
  Offline = 'Offline',
}

export enum DeviceType {
  NVR = 'NVR',
  DVR = 'DVR',
}

export enum ActionType {
  Compras = 'Requisição de Compras',
  Obras = 'Chamado para Obras',
  RIF = 'Relatório de Inspeção (RIF)',
}

// --- App-specific Types (extending Supabase types) ---

export type Division = SupabaseDivision;
export type Channel = SupabaseChannel;
export type ChannelLog = Database['public']['Tables']['channel_logs']['Row'];

export interface Device extends SupabaseDevice {
  channels: Channel[];
}

export interface PlacedCamera {
  channelId: number;
  deviceId: number;
  x: number; // percentage
  y: number; // percentage
  rotation: number; // degrees
  flipped: boolean;
}

// The 'placed_cameras' column in Supabase is of type JSON.
// In the app, we expect it to be an array of PlacedCamera objects.
export interface DivisionLayout extends Omit<SupabaseLayout, 'placed_cameras'> {
  placed_cameras: PlacedCamera[];
}
