import { supabase } from './supabase';

export type GlobalSettings = {
  id: number;
  app_name: string;
  hotel_name: string;
  bank_account_number: string;
  max_file_size_mb: number;
  currency: string;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
};

export type LandingPageContent = {
  id: number;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  is_active: boolean;
  updated_at: string;
};

export type Amenity = {
  id: number;
  name: string;
  icon_name: string;
  created_at: string;
};

export type RoomAmenity = {
  amenities: Amenity;
};

/**
 * Fetch global settings from the database
 * @returns GlobalSettings object or null if not found
 */
export async function getGlobalSettings(): Promise<GlobalSettings | null> {
  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching global settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return null;
  }
}

/**
 * Fetch landing page content by section key
 * @param sectionKey The section key to fetch (e.g., 'HERO')
 * @returns LandingPageContent object or null if not found
 */
export async function getLandingPageContent(sectionKey: string): Promise<LandingPageContent | null> {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error(`Error fetching landing page content for ${sectionKey}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching landing page content for ${sectionKey}:`, error);
    return null;
  }
}

/**
 * Fetch all active landing page sections
 * @returns Array of LandingPageContent objects
 */
export async function getAllActiveLandingPageContent(): Promise<LandingPageContent[]> {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) {
      console.error('Error fetching landing page content:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching landing page content:', error);
    return [];
  }
}

/**
 * Fetch amenities for a specific room
 * @param roomId Room ID
 * @returns Array of RoomAmenity objects
 */
export async function getRoomAmenities(roomId: number): Promise<RoomAmenity[]> {
  try {
    const { data, error } = await supabase
      .from('room_amenities')
      .select(`
        room_id,
        amenity_id,
        amenities (*)
      `)
      .eq('room_id', roomId);

    if (error) {
      console.error(`Error fetching amenities for room ${roomId}:`, error);
      return [];
    }

    // Map data to RoomAmenity type
    return (data || []).map((item: any) => ({
      amenities: item.amenities
    }));
  } catch (error) {
    console.error(`Error fetching amenities for room ${roomId}:`, error);
    return [];
  }
}

/**
 * Fetch all amenities
 * @returns Array of Amenity objects
 */
export async function getAllAmenities(): Promise<Amenity[]> {
  try {
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching amenities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return [];
  }
}