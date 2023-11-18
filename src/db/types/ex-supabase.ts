import { Database } from './supabase';

export type Cast = Database['public']['Tables']['casts']['Row'];
export type CastInsert = Database['public']['Tables']['casts']['Insert'];
export type CastUpdate = Database['public']['Tables']['casts']['Update'];

export type UnifiedPost = Database['public']['Tables']['unified_posts']['Row'];
export type UnifiedPostInsert = Database['public']['Tables']['unified_posts']['Insert'];
export type UnifiedPostUpdate = Database['public']['Tables']['unified_posts']['Update'];
