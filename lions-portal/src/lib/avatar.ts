import { supabaseUrl } from "@/lib/supabase/config";
export const avatarUrl = (path?: string | null) => (path ? `${supabaseUrl}/storage/v1/object/public/avatars/${path}` : null);
